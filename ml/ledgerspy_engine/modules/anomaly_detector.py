import hashlib
import hmac
import logging
import os
import pickle
from collections.abc import Iterable
from sklearn.ensemble import IsolationForest
import pandas as pd
import numpy as np


logger = logging.getLogger(__name__)


class ModelLoadError(RuntimeError):
    """Raised when a saved model file fails integrity or schema checks."""

class AnomalyModel:
    def __init__(self, contamination=0.02):
        # contamination=0.02 means we assume 2% of the ledger is suspicious. 
        # 0.1 (10%) is usually too noisy for real audits.
        self.model = IsolationForest(contamination=contamination, random_state=42)
        self.is_trained = False
        self.feature_columns = []
        self.training_mean = None 

    def _validate_and_align_features(self, df_features: pd.DataFrame) -> pd.DataFrame:
        expected = list(self.feature_columns)
        received = df_features.columns.tolist()

        if received == expected:
            return df_features

        if len(received) == len(expected) and set(received) == set(expected):
            return df_features[expected]

        raise ValueError(
            "Feature columns mismatch. "
            f"Expected columns (in order): {expected}. Received: {received}."
        )

    def _get_signing_key(self) -> bytes:
        key = os.getenv("LEDGERSPY_MODEL_SIGNING_KEY")
        if not key:
            raise ValueError(
                "Missing model signing key. Set LEDGERSPY_MODEL_SIGNING_KEY to save/load model files."
            )
        return key.encode("utf-8")

    def _sign_payload(self, payload: bytes) -> str:
        key = self._get_signing_key()
        return hmac.new(key, payload, hashlib.sha256).hexdigest()
    
    def train(self, df_features: pd.DataFrame):
        """
        Train the anomaly detection model on multiple engineered features.
        Expects a Pandas DataFrame.
        """
        self.feature_columns = df_features.columns.tolist()
        self.model.fit(df_features.values)
        self.training_mean = df_features.mean()
        self.is_trained = True
    
    def predict(self, df_features: pd.DataFrame):
        """
        Predict anomalies. 
        Converts scikit-learn's standard (-1 for anomaly, 1 for normal) 
        into a clean boolean flag (True for anomaly) for the frontend.
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before calling predict.")

        df_features = self._validate_and_align_features(df_features)
            
        raw_predictions = self.model.predict(df_features.values)
        
        # Convert -1 (anomaly) to True, and 1 (normal) to False
        return [True if x == -1 else False for x in raw_predictions]
    
    def get_scores(self, df_features: pd.DataFrame):
        """
        Get anomaly scores. Lower scores (more negative) mean highly abnormal.
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before calling get_scores.")

        df_features = self._validate_and_align_features(df_features)

        return self.model.score_samples(df_features.values)
    
    def explain_anomalies(self, df_original: pd.DataFrame, df_features: pd.DataFrame, anomaly_indices: pd.Index):
        """
        Provide explainable risk insights for flagged anomalies.
        Returns a dictionary mapping transaction_id to feature contribution percentages.
        """
        if not self.is_trained or self.training_mean is None:
            raise ValueError("Model must be trained before explaining anomalies.")
        
        explanations = {}
        for idx in anomaly_indices:
            row = df_features.loc[idx]
            deviations = np.abs(row - self.training_mean)
            total_deviation = deviations.sum()
            if total_deviation == 0:
                # If no deviation, distribute equally (unlikely)
                percentages = {col: 100.0 / len(self.feature_columns) for col in self.feature_columns}
            else:
                percentages = {col: (dev / total_deviation) * 100 for col, dev in zip(self.feature_columns, deviations)}
            transaction_id = df_original.loc[idx, 'transaction_id']
            explanations[transaction_id] = percentages
        return explanations
    
    def save(self, filepath):
        """Save model to file for the offline desktop app"""
        payload = pickle.dumps({'model': self.model, 'features': self.feature_columns})
        signature = self._sign_payload(payload)
        with open(filepath, 'wb') as f:
            f.write(signature.encode("ascii") + b"\n" + payload)
    
    def load(self, filepath):
        """Load model from file"""
        try:
            with open(filepath, 'rb') as f:
                raw = f.read()

            signature_raw, payload = raw.split(b"\n", 1)
            expected_sig = self._sign_payload(payload)
            received_sig = signature_raw.decode("ascii")
            if not hmac.compare_digest(received_sig, expected_sig):
                raise ModelLoadError("Model file signature validation failed.")

            data = pickle.loads(payload)

            if not isinstance(data, dict):
                raise ValueError("Invalid model format: payload must be a dictionary.")
            if 'model' not in data or 'features' not in data:
                raise KeyError("Missing required keys: 'model' and/or 'features'.")
            if not isinstance(data['model'], IsolationForest):
                raise ValueError("Invalid model format: 'model' must be an IsolationForest instance.")
            if not isinstance(data['features'], Iterable) or isinstance(data['features'], (str, bytes)):
                raise ValueError("Invalid model format: 'features' must be an iterable of column names.")

            features = list(data['features'])
            if not all(isinstance(col, str) for col in features):
                raise ValueError("Invalid model format: every feature name must be a string.")

            self.model = data['model']
            self.feature_columns = features
            self.is_trained = True
        except (pickle.UnpicklingError, OSError, ValueError, KeyError, ModelLoadError) as exc:
            logger.exception("Failed to load anomaly model from %s", filepath)
            raise ModelLoadError(f"Unable to load model from '{filepath}': {exc}") from exc