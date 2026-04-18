import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler


class LedgerPreprocessor:
    def __init__(self):
        self.required_cols = [
            'transaction_id', 'timestamp', 'amount',
            'source_entity', 'destination_entity'
        ]
        self.scaler = None  # stored so anomaly module can inverse later

    def calculate_readiness_score(self, df: pd.DataFrame) -> dict:
        """Run this on RAW data before cleaning."""
        total_rows = len(df)
        if total_rows == 0:
            return {
                "readiness_score": 0,
                "status": "Empty File",
                "metrics": {"completeness": 0, "validity": 0, "uniqueness": 0},
                "issues": ["File is empty."]
            }

        # Validate required columns exist before accessing
        missing_cols = set(self.required_cols) - set(df.columns)
        if missing_cols:
            return {
                "readiness_score": 0,
                "status": "Missing Required Columns",
                "metrics": {"completeness": 0, "validity": 0, "uniqueness": 0},
                "issues": [f"Missing required columns: {', '.join(sorted(missing_cols))}."]
            }

        completeness = 1 - (
            df[self.required_cols].isnull().sum().sum()
            / (total_rows * len(self.required_cols))
        )
        uniqueness_ratio = df['transaction_id'].nunique() / total_rows
        
        # Validate both amounts and timestamps for validity
        valid_amounts = pd.to_numeric(df['amount'], errors='coerce').notnull().sum()
        valid_timestamps = pd.to_datetime(df['timestamp'], errors='coerce').notnull().sum()
        validity_score = min(valid_amounts, valid_timestamps) / total_rows

        final_score = (completeness * 0.4) + (validity_score * 0.4) + (uniqueness_ratio * 0.2)

        return {
            "readiness_score": round(final_score * 100, 2),
            "metrics": {
                "completeness": round(completeness * 100, 2),
                "validity": round(validity_score * 100, 2),
                "uniqueness": round(uniqueness_ratio * 100, 2)
            },
            "issues": self._generate_issue_list(df)  # raw df, issues are real
        }

    def validate_and_clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """Run this AFTER readiness score, before ML modules."""
        df = df.copy()
        for col in ['source_entity', 'destination_entity', 'transaction_id']:
            df[col] = df[col].fillna("UNKNOWN").astype(str).str.strip()

        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0.0)
        df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')

        dropped = df['timestamp'].isnull().sum()
        if dropped > 0:
            print(f"[LedgerPreprocessor] Warning: dropped {dropped} row(s) with invalid timestamps.")

        cleaned = df.dropna(subset=['timestamp']).reset_index(drop=True)
        
        # Guard: warn if cleaned dataframe is empty
        if len(cleaned) == 0:
            print("[LedgerPreprocessor] Warning: cleaned dataframe is empty (all rows dropped due to invalid timestamps).")
        
        return cleaned

    def _generate_issue_list(self, df: pd.DataFrame) -> list:
        """Expects RAW dataframe."""
        issues = []
        null_amounts = pd.to_numeric(df['amount'], errors='coerce').isnull().sum()
        if null_amounts > 0:
            issues.append(f"{null_amounts} null or invalid value(s) in Amount column.")
        if df['transaction_id'].duplicated().any():
            issues.append(f"{df['transaction_id'].duplicated().sum()} duplicate Transaction ID(s) detected.")
        bad_timestamps = pd.to_datetime(df['timestamp'], errors='coerce').isnull().sum()
        if bad_timestamps > 0:
            issues.append(f"{bad_timestamps} row(s) have unparseable timestamps and will be dropped.")
        return issues

    def engineer_anomaly_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Expects CLEANED dataframe from validate_and_clean."""
        features = pd.DataFrame(index=df.index)
        features['amount'] = df['amount']
        features['hour_of_day'] = df['timestamp'].dt.hour
        features['day_of_week'] = df['timestamp'].dt.dayofweek

        vendor_means = df.groupby('destination_entity')['amount'].transform('mean')
        vendor_stds = df.groupby('destination_entity')['amount'].transform('std').fillna(1.0)
        features['vendor_amount_zscore'] = (df['amount'] - vendor_means) / vendor_stds

        self.scaler = StandardScaler()
        scaled = self.scaler.fit_transform(features.fillna(0))
        return pd.DataFrame(scaled, columns=features.columns, index=df.index)