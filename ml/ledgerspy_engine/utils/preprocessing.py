import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)


# Column name mappings - Accept common variations
COLUMN_MAPPINGS = {
    'transaction_id': [
        'transaction_id', 'txn_id', 'tx_id', 'id', 'transaction', 'ref', 'reference',
        'Transaction ID', 'TXN ID', 'Txn_Id', 'Transaction_ID'
    ],
    'timestamp': [
        'timestamp', 'date', 'created_at', 'transaction_date', 'txn_date', 'date_time',
        'posted_date', 'posting_date', 'entry_date', 'Date', 'Timestamp', 'Created_At',
        'Transaction_Date', 'Posted_Date', 'datetime', 'DateTime'
    ],
    'amount': [
        'amount', 'value', 'transaction_amount', 'txn_amount', 'sum', 'total',
        'price', 'qty', 'quantity_amount', 'Amount', 'Value', 'Transaction_Amount'
    ],
    'source_entity': [
        'source_entity', 'source', 'from_entity', 'from', 'sender', 'payer',
        'from_account', 'account', 'Source', 'Source_Entity', 'From', 'Sender'
    ],
    'destination_entity': [
        'destination_entity', 'destination', 'vendor', 'payee', 'to_entity', 'to',
        'recipient', 'to_account', 'counterparty', 'party', 'company', 'business',
        'Destination', 'Vendor', 'Payee', 'To', 'Recipient', 'Destination_Entity'
    ]
}


def normalize_column_names(df: pd.DataFrame, mapping: dict = None) -> pd.DataFrame:
    """
    Normalize DataFrame column names to standard format.
    Accepts common variations (case-insensitive, underscores, hyphens, etc.)
    
    Args:
        df: DataFrame with potentially non-standard column names
        mapping: Optional custom mapping dict
        
    Returns:
        DataFrame with normalized column names
    """
    if mapping is None:
        mapping = COLUMN_MAPPINGS
    
    df = df.copy()
    df_cols_lower = {col.lower(): col for col in df.columns}  # Original name lookup
    
    renamed_cols = {}
    for standard_name, aliases in mapping.items():
        # Try to find a match in the DataFrame
        for alias in aliases:
            alias_lower = alias.lower().replace('_', '').replace('-', '')
            
            # Check exact match (case-insensitive)
            for col_lower, col_original in df_cols_lower.items():
                col_normalized = col_lower.replace('_', '').replace('-', '')
                
                if col_normalized == alias_lower:
                    renamed_cols[col_original] = standard_name
                    logger.info(f"Mapped '{col_original}' → '{standard_name}'")
                    break
            
            if standard_name in renamed_cols.values():
                break
    
    # Apply renaming
    if renamed_cols:
        df = df.rename(columns=renamed_cols)
    
    return df


class LedgerPreprocessor:
    def __init__(self, auto_normalize=True):
        """
        Initialize preprocessor.
        
        Args:
            auto_normalize: If True, automatically normalize column names
        """
        self.required_cols = [
            'transaction_id', 'timestamp', 'amount', 
            'source_entity', 'destination_entity'
        ]
        self.auto_normalize = auto_normalize
        self.column_mapping_report = {}

    def calculate_readiness_score(self, df: pd.DataFrame) -> dict:
        """
        Calculate the audit readiness score for the raw DataFrame.
        Auto-normalizes column names if enabled.
        
        Evaluates:
        - Completeness: percentage of non-null values
        - Data Quality: valid timestamps, positive amounts, non-empty entities
        - Record Count: whether we have enough data to analyze
        
        Returns:
            Dictionary with readiness_score (0-100), data_quality, completeness
        """
        if df.empty:
            return {
                "readiness_score": 0,
                "data_quality": "Critical",
                "completeness": "0%",
                "message": "DataFrame is empty"
            }

        # Auto-normalize column names if enabled
        if self.auto_normalize:
            df = normalize_column_names(df)
            self.column_mapping_report = {col: col for col in df.columns}

        total_records = len(df)
        
        # Check column presence
        missing_cols = [col for col in self.required_cols if col not in df.columns]
        if missing_cols:
            available_cols = list(df.columns)
            return {
                "readiness_score": 0,
                "data_quality": "Critical",
                "completeness": "0%",
                "message": f"Missing required columns: {missing_cols}",
                "available_columns": available_cols,
                "hint": "Try renaming your columns to match: " + ", ".join(self.required_cols)
            }

        # Calculate completeness (percentage of non-null values across required columns)
        total_cells = len(self.required_cols) * total_records
        non_null_cells = sum(df[col].notna().sum() for col in self.required_cols)
        completeness_pct = (non_null_cells / total_cells * 100) if total_cells > 0 else 0

        # Calculate data quality
        quality_issues = 0
        
        # Check timestamp validity
        try:
            valid_timestamps = pd.to_datetime(df['timestamp'], errors='coerce').notna().sum()
            timestamp_quality = (valid_timestamps / total_records * 100) if total_records > 0 else 0
        except:
            timestamp_quality = 0
            quality_issues += 1

        # Check amount validity (should be numeric and mostly positive)
        try:
            valid_amounts = pd.to_numeric(df['amount'], errors='coerce').notna().sum()
            amount_quality = (valid_amounts / total_records * 100) if total_records > 0 else 0
        except:
            amount_quality = 0
            quality_issues += 1

        # Check entity fields are not empty
        try:
            valid_source = (df['source_entity'].astype(str).str.len() > 0).sum()
            valid_dest = (df['destination_entity'].astype(str).str.len() > 0).sum()
            entity_quality = ((valid_source + valid_dest) / (2 * total_records) * 100) if total_records > 0 else 0
        except:
            entity_quality = 0
            quality_issues += 1

        # Calculate overall readiness score
        avg_quality = (timestamp_quality + amount_quality + entity_quality) / 3 if not quality_issues else 0
        readiness_score = (completeness_pct * 0.5 + avg_quality * 0.5)
        readiness_score = min(100, max(0, readiness_score))  # Clamp to 0-100

        # Classify data quality
        if readiness_score >= 80:
            data_quality = "Excellent"
        elif readiness_score >= 60:
            data_quality = "Good"
        elif readiness_score >= 40:
            data_quality = "Fair"
        else:
            data_quality = "Poor"

        return {
            "readiness_score": round(readiness_score, 2),
            "data_quality": data_quality,
            "completeness": f"{round(completeness_pct, 1)}%",
            "timestamp_validity": f"{round(timestamp_quality, 1)}%",
            "amount_validity": f"{round(amount_quality, 1)}%",
            "entity_validity": f"{round(entity_quality, 1)}%",
            "total_records": total_records,
        }

    def validate_and_clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Ensures the data meets the contract and handles missing values safely.
        Auto-normalizes column names if enabled.
        """
        df = df.copy()
        
        # 1. Auto-normalize column names if enabled
        if self.auto_normalize:
            df = normalize_column_names(df)
        
        # 2. Schema Validation
        missing_cols = [col for col in self.required_cols if col not in df.columns]
        if missing_cols:
            available = list(df.columns)
            raise ValueError(
                f"Missing required columns: {missing_cols}. "
                f"Available columns: {available}. "
                f"Expected: {self.required_cols}"
            )

        # 3. Safe Missing Value Handling
        # Fill missing text with "UNKNOWN" so RapidFuzz doesn't crash on NaNs
        text_cols = ['source_entity', 'destination_entity', 'transaction_id']
        for col in text_cols:
            df[col] = df[col].fillna("UNKNOWN").astype(str)

        # Fill missing amounts with 0.0
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0.0)

        # 4. Standardize Timestamp
        df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        # Drop rows where the timestamp is completely unreadable
        df = df.dropna(subset=['timestamp']) 

        return df

    def engineer_anomaly_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Transforms raw ledger rows into enhanced features for anomaly detection.
        Includes temporal, statistical, behavioral, and velocity-based features.
        """
        features = pd.DataFrame(index=df.index)
        
        # ===== BASIC FEATURES =====
        # Feature 1: The Amount itself (log-transformed to reduce skew)
        features['log_amount'] = np.log1p(df['amount'])
        features['amount_raw'] = df['amount']
        
        # ===== TEMPORAL FEATURES =====
        # Feature 2-5: Time-based risk (Fraud often happens at odd times)
        features['hour_of_day'] = df['timestamp'].dt.hour
        features['day_of_week'] = df['timestamp'].dt.dayofweek
        features['day_of_month'] = df['timestamp'].dt.day
        features['is_weekend'] = df['timestamp'].dt.dayofweek.isin([5, 6]).astype(int)
        
        # ===== VENDOR BEHAVIORAL FEATURES =====
        # Feature 6: Amount relative to vendor's normal behavior (Z-Score)
        # This catches a $50k invoice from a $500 vendor
        vendor_means = df.groupby('destination_entity')['amount'].transform('mean')
        vendor_stds = df.groupby('destination_entity')['amount'].transform('std')
        vendor_stds = vendor_stds.fillna(1.0).replace(0.0, 1.0)
        features['vendor_amount_zscore'] = (df['amount'] - vendor_means) / vendor_stds
        
        # Feature 7: Vendor transaction frequency (how often do we use this vendor?)
        vendor_txn_count = df.groupby('destination_entity').size()
        features['vendor_frequency'] = df['destination_entity'].map(vendor_txn_count).fillna(1)
        
        # Feature 8: Deviation from vendor's typical hourly pattern
        vendor_hour_pattern = df.groupby(['destination_entity', df['timestamp'].dt.hour]).size()
        hourly_avg = df.groupby(df['timestamp'].dt.hour).size().mean()
        features['vendor_hour_deviation'] = df.apply(
            lambda row: 1.0 if row['destination_entity'] not in vendor_means.index 
            else min(vendor_hour_pattern.get((row['destination_entity'], row['timestamp'].hour), 0) / max(hourly_avg, 1), 10),
            axis=1
        )
        
        # ===== VELOCITY FEATURES =====
        # Feature 9: Transaction velocity (how many txns from this source in last 1 hour?)
        # Sort by timestamp while preserving original indices for correct assignment
        df_sorted_idx = df.sort_values('timestamp').index
        df_sorted = df.loc[df_sorted_idx]
        velocity_dict = {}
        for orig_idx, row in df_sorted.iterrows():
            recent_txns = df_sorted[
                (df_sorted['source_entity'] == row['source_entity']) &
                (df_sorted['timestamp'] >= row['timestamp'] - np.timedelta64(1, 'h')) &
                (df_sorted['timestamp'] <= row['timestamp'])
            ]
            velocity_dict[orig_idx] = len(recent_txns)
        # Map velocities back to original df order
        features['source_velocity_1h'] = [velocity_dict.get(i, 0) for i in df.index]
        
        # Feature 10: Amount velocity (total $ from source in last 24h)
        amount_velocity_dict = {}
        for orig_idx, row in df_sorted.iterrows():
            recent_amount = df_sorted[
                (df_sorted['source_entity'] == row['source_entity']) &
                (df_sorted['timestamp'] >= row['timestamp'] - np.timedelta64(24, 'h')) &
                (df_sorted['timestamp'] <= row['timestamp'])
            ]['amount'].sum()
            amount_velocity_dict[orig_idx] = recent_amount
        # Map velocities back to original df order
        features['amount_velocity_24h'] = [amount_velocity_dict.get(i, 0) for i in df.index]
        
        # ===== STATISTICAL FEATURES =====
        # Feature 11: Percentile of this amount within vendor's distribution
        def amount_percentile(row):
            vendor_amounts = df[df['destination_entity'] == row['destination_entity']]['amount']
            if len(vendor_amounts) > 0:
                return (vendor_amounts <= row['amount']).sum() / len(vendor_amounts) * 100
            return 50
        features['amount_percentile'] = df.apply(amount_percentile, axis=1)
        
        # Feature 12: Unusual entity pair (Source->Destination combo frequency)
        entity_pair_count = df.groupby(['source_entity', 'destination_entity']).size()
        features['entity_pair_frequency'] = df.apply(
            lambda row: entity_pair_count.get((row['source_entity'], row['destination_entity']), 1),
            axis=1
        )
        
        # ===== NORMALIZE =====
        # Scale features so Isolation Forest treats them equally
        scaler = StandardScaler()
        scaled_array = scaler.fit_transform(features.fillna(0))
        
        return pd.DataFrame(scaled_array, columns=features.columns, index=features.index)