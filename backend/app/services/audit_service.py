from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[3]
ML_ROOT = PROJECT_ROOT / "ml"
if str(ML_ROOT) not in sys.path:
    sys.path.append(str(ML_ROOT))

from ledgerspy_engine.modules.anomaly_detector import AnomalyModel
from ledgerspy_engine.modules.benford_profiler import BenfordProfiler
from ledgerspy_engine.modules.entity_matcher import EntityMatcher
from ledgerspy_engine.utils.preprocessing import LedgerPreprocessor
from ledgerspy_engine.data_integrity import DataIntegrityScorer


REQUIRED_OUTPUT_COLUMNS = [
    "transaction_id",
    "timestamp",
    "amount",
    "source_entity",
    "destination_entity",
]


class AuditServiceError(RuntimeError):
    """Raised when uploaded data cannot be transformed into auditable format."""


def generate_file_id(filename: str) -> str:
    import re
    import unicodedata
    
    stem = Path(filename).stem
    
    # Normalize unicode (NFKD) and encode to ASCII, ignoring non-ASCII
    normalized = unicodedata.normalize('NFKD', stem)
    normalized = normalized.encode('ascii', 'ignore').decode('ascii')
    
    # Replace non-alphanumeric characters (except hyphen/underscore) with underscore
    sanitized = re.sub(r'[^a-zA-Z0-9_-]', '_', normalized)
    
    # Collapse repeated underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    
    # Trim leading/trailing underscores
    sanitized = sanitized.strip('_')
    
    # Cap to 50 chars to avoid overly long IDs
    sanitized = sanitized[:50] if sanitized else "file"
    
    return f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{sanitized}_{uuid4().hex[:8]}"


def normalize_vendor_name(value: Any) -> str:
    text = "" if pd.isna(value) else str(value)
    text = text.strip().lower()
    if not text:
        return "unknown_vendor"
    return " ".join(text.split())


def _find_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    lower_map = {col.lower().strip(): col for col in df.columns}
    for candidate in candidates:
        if candidate in lower_map:
            return lower_map[candidate]
    return None


def prepare_ledger_dataframe(raw_df: pd.DataFrame) -> pd.DataFrame:
    df = raw_df.copy()
    df.columns = [str(col).lower().strip() for col in df.columns]

    amount_col = _find_column(df, ["amount", "transaction_amount", "value"])
    timestamp_col = _find_column(df, ["timestamp", "date", "transaction_date", "txn_date", "datetime"])
    destination_col = _find_column(
        df,
        ["destination_entity", "vendor", "vendor_name", "merchant", "description", "payee"],
    )
    source_col = _find_column(df, ["source_entity", "source", "payer", "account", "from_account"])
    txn_id_col = _find_column(df, ["transaction_id", "txn_id", "id"])

    missing = []
    if not amount_col:
        missing.append("amount")
    if not timestamp_col:
        missing.append("timestamp/date")
    if not destination_col:
        missing.append("destination_entity/vendor")

    if missing:
        raise AuditServiceError(f"Missing required columns for analysis: {missing}")

    transformed = pd.DataFrame()
    transformed["amount"] = pd.to_numeric(df[amount_col], errors="coerce")
    transformed["timestamp"] = pd.to_datetime(df[timestamp_col], errors="coerce")
    transformed["destination_entity"] = df[destination_col].map(normalize_vendor_name)

    if source_col:
        transformed["source_entity"] = df[source_col].fillna("uploaded_source").astype(str).str.strip()
    else:
        transformed["source_entity"] = "uploaded_source"

    if txn_id_col:
        transformed["transaction_id"] = df[txn_id_col].fillna("").astype(str).str.strip()
    else:
        transformed["transaction_id"] = ""
    
    # Reset index to avoid positional indexer errors after DataFrame creation
    transformed = transformed.reset_index(drop=True)
    
    # Fill missing transaction IDs with generated ones
    blank_ids = transformed["transaction_id"] == ""
    num_blanks = blank_ids.sum()
    if num_blanks > 0:
        transformed.loc[blank_ids, "transaction_id"] = [f"TXN-{i:06d}" for i in range(num_blanks)]
    
    # Ensure all transaction IDs are unique by appending index
    transformed["transaction_id"] = transformed["transaction_id"].astype(str) + "-" + transformed.index.astype(str)

    transformed = transformed[REQUIRED_OUTPUT_COLUMNS]

    preprocessor = LedgerPreprocessor()
    clean_df = preprocessor.validate_and_clean(transformed)
    
    if clean_df.empty:
        raise AuditServiceError(
            "No valid transactions after data validation. All rows may have invalid or unparseable timestamps. "
            "Please verify the input data has valid dates and required fields."
        )
    
    return clean_df


def _normalize_anomaly_scores(raw_scores: np.ndarray) -> np.ndarray:
    if raw_scores.size == 0:
        return raw_scores

    min_val = float(np.min(raw_scores))
    max_val = float(np.max(raw_scores))
    if max_val == min_val:
        return np.zeros_like(raw_scores)

    # IsolationForest uses lower scores for more anomalous rows, so we invert.
    normalized = ((max_val - raw_scores) / (max_val - min_val)) * 100.0
    return np.clip(normalized, 0.0, 100.0)


def run_full_analysis(raw_df: pd.DataFrame, filename: str) -> dict[str, Any]:
    file_id = generate_file_id(filename)
    clean_df = prepare_ledger_dataframe(raw_df)

    # Calculate data integrity & readiness score first
    integrity_scorer = DataIntegrityScorer()
    readiness_report = integrity_scorer.calculate_overall_readiness(raw_df)

    preprocessor = LedgerPreprocessor()
    features = preprocessor.engineer_anomaly_features(clean_df)

    anomaly_model = AnomalyModel(contamination=0.05)
    anomaly_model.train(features)
    anomaly_flags = anomaly_model.predict(features)
    anomaly_scores = anomaly_model.get_scores(features)
    anomaly_risk_scores = _normalize_anomaly_scores(np.asarray(anomaly_scores, dtype=float))

    benford_profiler = BenfordProfiler()
    benford_result = benford_profiler.analyze(clean_df, weighted=False)
    
    # Use tiered formula for Benford risk scoring based on chi-square deviation
    # Thresholds:
    #   - Compliant (ratio < 1): Use MAD scaling for nuanced differentiation
    #   - Moderate fraud (1 < ratio < 90): Use linear scaling for moderate deviations
    #   - Severe fraud (ratio >= 90): Use sqrt scaling that saturates at 100%
    chi_square = float(benford_result.get("chi_square_stat", 0.0))
    mad = float(benford_result.get("mad", 0.0)) / 100.0  # Convert from % to decimal
    threshold = float(benford_profiler.threshold)
    
    ratio = chi_square / threshold
    
    if ratio < 2:
        # Compliant or near-compliant: Use MAD-based scaling (0-20% range)
        benford_risk = round(min(mad * 100 * 2, 100.0), 2)
    elif ratio < 90:
        # Moderate fraud: Linear scaling of ratio (20-80% range)
        benford_risk = round(min(ratio / 3, 100.0), 2)
    else:
        # Severe fraud: Sqrt scaling saturates near 100% (90-100% range)
        import math
        benford_risk = round(min(math.sqrt(ratio) * 10, 100.0), 2)

    entity_matcher = EntityMatcher(default_threshold=85)
    fuzzy_matches = entity_matcher.find_ghost_vendors(clean_df["destination_entity"].tolist())
    vendor_match_risk: dict[str, float] = {}
    for item in fuzzy_matches:
        score = float(item.get("risk_score", 0.0))
        vendor_1 = item.get("vendor_1")
        vendor_2 = item.get("vendor_2")
        if vendor_1:
            vendor_match_risk[vendor_1] = max(vendor_match_risk.get(vendor_1, 0.0), score)
        if vendor_2:
            vendor_match_risk[vendor_2] = max(vendor_match_risk.get(vendor_2, 0.0), score)

    risk_scores = []
    transactions = []
    anomalies = []

    for row_idx, row in clean_df.reset_index(drop=True).iterrows():
        anomaly_component = float(anomaly_risk_scores[row_idx])
        fuzzy_component = float(vendor_match_risk.get(row["destination_entity"], 0.0))
        # ✅ FIXED: Correct weights - 50% anomaly, 30% vendor, 20% benford
        total_risk = (0.5 * anomaly_component) + (0.3 * fuzzy_component) + (0.2 * benford_risk)
        total_risk = round(min(total_risk, 100.0), 2)

        explanations = []
        primary_reason = "No strong fraud indicators"
        
        # Determine primary reason based on strongest component
        if anomaly_component >= fuzzy_component and anomaly_component >= benford_risk:
            if anomaly_flags[row_idx]:
                explanations.append("Isolation Forest marked this transaction as anomalous.")
                primary_reason = f"Anomaly Detection ({anomaly_component:.1f}%)"
        
        if fuzzy_component >= anomaly_component and fuzzy_component >= benford_risk:
            if fuzzy_component >= 85:
                explanations.append("Destination vendor has high similarity with another vendor record.")
                primary_reason = f"Vendor Similarity Match ({fuzzy_component:.1f}%)"
        
        if benford_risk >= anomaly_component and benford_risk >= fuzzy_component:
            if benford_risk >= 60:
                explanations.append("Ledger-wide digit distribution deviates from Benford expectations.")
                primary_reason = f"Benford Violation ({benford_risk:.1f}%)"
        
        # Add secondary explanations
        if anomaly_flags[row_idx] and primary_reason != f"Anomaly Detection ({anomaly_component:.1f}%)":
            explanations.append("Isolation Forest marked this transaction as anomalous.")
        if fuzzy_component >= 85 and primary_reason != f"Vendor Similarity Match ({fuzzy_component:.1f}%)":
            explanations.append("Destination vendor has high similarity with another vendor record.")
        if benford_risk >= 60 and primary_reason != f"Benford Violation ({benford_risk:.1f}%)":
            explanations.append("Ledger-wide digit distribution deviates from Benford expectations.")
        
        if not explanations:
            explanations.append("No strong fraud indicators triggered for this transaction.")

        tx_payload = {
            "transaction_id": str(row["transaction_id"]),
            "timestamp": row["timestamp"].isoformat() if pd.notna(row["timestamp"]) else None,
            "amount": float(row["amount"]),
            "source_entity": str(row["source_entity"]),
            "destination_entity": str(row["destination_entity"]),
            "risk_score": total_risk,
            "is_anomaly": bool(anomaly_flags[row_idx]),
            "explanation": explanations,
            "primary_reason": primary_reason,
        }

        transactions.append(tx_payload)
        risk_scores.append({"transaction_id": tx_payload["transaction_id"], "risk_score": total_risk})

        if tx_payload["is_anomaly"] or total_risk >= 70:
            anomalies.append(tx_payload)

    return {
        "file_id": file_id,
        "status": "completed",
        "readiness_report": readiness_report,
        "summary": {
            "total_records": int(len(clean_df)),
            "flagged_records": int(len(anomalies)),
            "benford_risk": round(float(benford_risk), 2),
            "fuzzy_match_count": int(len(fuzzy_matches)),
        },
        "anomalies": anomalies,
        "benford": benford_result,
        "fuzzy_matches": fuzzy_matches,
        "risk_scores": risk_scores,
        "transactions": transactions,
    }
