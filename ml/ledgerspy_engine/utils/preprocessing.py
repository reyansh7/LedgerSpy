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
        Transforms raw ledger rows into the mathematical features 
        required by the Isolation Forest.
        """
        features = pd.DataFrame(index=df.index)
        
        # Feature 1: The Amount itself
        features['amount'] = df['amount']
        
        # Feature 2 & 3: Time-based risk (Fraud often happens at weird hours/days)
        features['hour_of_day'] = df['timestamp'].dt.hour
        features['day_of_week'] = df['timestamp'].dt.dayofweek
        
        # Feature 4: Amount relative to the vendor's normal behavior (Z-Score)
        # This is how we catch a $50k invoice from a $500 vendor
        vendor_means = df.groupby('destination_entity')['amount'].transform('mean')
        vendor_stds = df.groupby('destination_entity')['amount'].transform('std')
        vendor_stds = vendor_stds.fillna(1.0).replace(0.0, 1.0)
        
        features['vendor_amount_zscore'] = (df['amount'] - vendor_means) / vendor_stds
        
        # Scale the features so the Isolation Forest treats them equally
        scaler = StandardScaler()
        scaled_array = scaler.fit_transform(features.fillna(0))
        
        # Return as a clean DataFrame with the same column names
        return pd.DataFrame(scaled_array, columns=features.columns, index=features.index)