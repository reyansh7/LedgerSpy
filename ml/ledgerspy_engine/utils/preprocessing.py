import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

class LedgerPreprocessor:
    def __init__(self):
        # The strict contract we expect from the Backend Developer
        self.required_cols = [
            'transaction_id', 'timestamp', 'amount', 
            'source_entity', 'destination_entity'
        ]

    def calculate_readiness_score(self, df: pd.DataFrame) -> dict:
        """
        Calculate the audit readiness score for the raw DataFrame.
        
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

        total_records = len(df)
        
        # Check column presence
        missing_cols = [col for col in self.required_cols if col not in df.columns]
        if missing_cols:
            return {
                "readiness_score": 0,
                "data_quality": "Critical",
                "completeness": "0%",
                "message": f"Missing required columns: {missing_cols}"
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
        """Ensures the data meets the contract and handles missing values safely"""
        df = df.copy()
        
        # 1. Schema Validation
        missing_cols = [col for col in self.required_cols if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Backend Error: Missing required columns: {missing_cols}")

        # 2. Safe Missing Value Handling
        # Fill missing text with "UNKNOWN" so RapidFuzz doesn't crash on NaNs
        text_cols = ['source_entity', 'destination_entity', 'transaction_id']
        for col in text_cols:
            df[col] = df[col].fillna("UNKNOWN").astype(str)

        # Fill missing amounts with 0.0
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0.0)

        # 3. Standardize Timestamp
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
        df_sorted = df.sort_values('timestamp').copy()
        velocity_list = []
        for idx, row in df_sorted.iterrows():
            recent_txns = df_sorted[
                (df_sorted['source_entity'] == row['source_entity']) &
                (df_sorted['timestamp'] >= row['timestamp'] - np.timedelta64(1, 'h')) &
                (df_sorted['timestamp'] <= row['timestamp'])
            ]
            velocity_list.append(len(recent_txns))
        features['source_velocity_1h'] = velocity_list
        
        # Feature 10: Amount velocity (total $ from source in last 24h)
        amount_velocity_list = []
        for idx, row in df_sorted.iterrows():
            recent_amount = df_sorted[
                (df_sorted['source_entity'] == row['source_entity']) &
                (df_sorted['timestamp'] >= row['timestamp'] - np.timedelta64(24, 'h')) &
                (df_sorted['timestamp'] <= row['timestamp'])
            ]['amount'].sum()
            amount_velocity_list.append(recent_amount)
        features['amount_velocity_24h'] = amount_velocity_list
        
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