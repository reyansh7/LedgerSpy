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
        vendor_stds = df.groupby('destination_entity')['amount'].transform('std').fillna(1.0) # avoid div by zero
        
        features['vendor_amount_zscore'] = (df['amount'] - vendor_means) / vendor_stds
        
        # Scale the features so the Isolation Forest treats them equally
        scaler = StandardScaler()
        scaled_array = scaler.fit_transform(features.fillna(0))
        
        # Return as a clean DataFrame with the same column names
        return pd.DataFrame(scaled_array, columns=features.columns, index=features.index)