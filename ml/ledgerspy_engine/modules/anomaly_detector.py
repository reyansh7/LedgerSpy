import hashlib
import hmac
import logging
import os
import pickle
from collections.abc import Iterable
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.covariance import EllipticEnvelope
import pandas as pd
import numpy as np


logger = logging.getLogger(__name__)


class ModelLoadError(RuntimeError):
    """Raised when a saved model file fails integrity or schema checks."""

class AnomalyModel:
    def __init__(self, contamination=0.02, use_ensemble=True, ensemble_method='voting'):
        """
        Initialize anomaly detection with optional ensemble approach.
        
        Args:
            contamination: Expected fraction of anomalies (2% = conservative, 5% = moderate)
            use_ensemble: If True, use multiple algorithms and vote
            ensemble_method: 'voting' (majority vote) or 'average' (average scores)
        """
        self.contamination = contamination
        self.use_ensemble = use_ensemble
        self.ensemble_method = ensemble_method
        
        # Primary model: Isolation Forest
        self.iso_forest = IsolationForest(
            contamination=contamination, 
            random_state=42,
            n_estimators=100
        )
        
        # Secondary model: Robust Covariance (catches multivariate outliers)
        self.robust_cov = None
        
        # Ensemble voting weights learned from data
        self.weights = None
        
        self.is_trained = False
        self.feature_columns = []
        self.has_labels = False

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
    
    def train(self, df_features: pd.DataFrame, labels=None):
        """
        Train the anomaly detection model on engineered features.
        Optionally use labels (0=normal, 1=fraud) for supervised refinement.
        
        Args:
            df_features: DataFrame with engineered features
            labels: Optional Series/array of labels (0/1) for supervised training
        """
        self.feature_columns = df_features.columns.tolist()
        
        # Train unsupervised Isolation Forest
        self.iso_forest.fit(df_features.values)
        
        # Train secondary Robust Covariance model for ensemble
        if self.use_ensemble:
            try:
                self.robust_cov = EllipticEnvelope(
                    contamination=self.contamination,
                    random_state=42
                )
                self.robust_cov.fit(df_features.values)
            except Exception as e:
                logger.warning(f"Robust Covariance training failed: {e}. Using Isolation Forest only.")
                self.robust_cov = None
        
        # If labels provided, learn optimal weights
        if labels is not None:
            self._learn_ensemble_weights(df_features, labels)
            self.has_labels = True
        
        self.is_trained = True
    
    def _learn_ensemble_weights(self, df_features: pd.DataFrame, labels: np.ndarray):
        """Learn optimal weights for ensemble models using labeled data."""
        try:
            iso_scores = self.iso_forest.score_samples(df_features.values)
            
            # Normalize scores to 0-1 range
            iso_scores_norm = (iso_scores - iso_scores.min()) / (iso_scores.max() - iso_scores.min() + 1e-8)
            
            # Get scores from robust covariance if available
            if self.robust_cov is not None:
                cov_scores = self.robust_cov.score_samples(df_features.values)
                cov_scores_norm = (cov_scores - cov_scores.min()) / (cov_scores.max() - cov_scores.min() + 1e-8)
                
                # Simple weight optimization: use whichever correlates better with labels
                iso_corr = np.corrcoef(iso_scores_norm, labels)[0, 1]
                cov_corr = np.corrcoef(cov_scores_norm, labels)[0, 1]
                
                total_corr = abs(iso_corr) + abs(cov_corr)
                self.weights = {
                    'iso_forest': abs(iso_corr) / total_corr if total_corr > 0 else 0.7,
                    'robust_cov': abs(cov_corr) / total_corr if total_corr > 0 else 0.3
                }
            else:
                self.weights = {'iso_forest': 1.0}
                
            logger.info(f"Learned ensemble weights: {self.weights}")
        except Exception as e:
            logger.warning(f"Weight learning failed: {e}. Using equal weights.")
            self.weights = {'iso_forest': 0.7, 'robust_cov': 0.3}
    
    def predict(self, df_features: pd.DataFrame) -> list:
        """
        Predict anomalies with optional ensemble voting.
        Returns boolean array (True = anomaly, False = normal).
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before calling predict.")

        df_features = self._validate_and_align_features(df_features)
        
        if not self.use_ensemble or self.robust_cov is None:
            # Single model prediction
            raw_predictions = self.iso_forest.predict(df_features.values)
            return [True if x == -1 else False for x in raw_predictions]
        
        # Ensemble voting
        iso_pred = self.iso_forest.predict(df_features.values)
        cov_pred = self.robust_cov.predict(df_features.values)
        
        # Ensemble decision: vote with weights
        weights = self.weights or {'iso_forest': 0.7, 'robust_cov': 0.3}
        iso_weight = weights.get('iso_forest', 0.7)
        cov_weight = weights.get('robust_cov', 0.3)
        
        # Convert to anomaly scores (higher = more anomalous)
        iso_scores = (iso_pred == -1).astype(float) * iso_weight
        cov_scores = (cov_pred == -1).astype(float) * cov_weight
        
        ensemble_scores = iso_scores + cov_scores
        threshold = (iso_weight + cov_weight) / 2
        
        return [score > threshold for score in ensemble_scores]
    
    def get_scores(self, df_features: pd.DataFrame) -> np.ndarray:
        """
        Get anomaly scores. Lower (more negative) = highly abnormal.
        With ensemble, returns weighted average of model scores.
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before calling get_scores.")

        df_features = self._validate_and_align_features(df_features)
        
        iso_scores = self.iso_forest.score_samples(df_features.values)
        
        if not self.use_ensemble or self.robust_cov is None:
            return iso_scores
        
        # Weighted ensemble scores
        cov_scores = self.robust_cov.score_samples(df_features.values)
        weights = self.weights or {'iso_forest': 0.7, 'robust_cov': 0.3}
        
        iso_weight = weights.get('iso_forest', 0.7)
        cov_weight = weights.get('robust_cov', 0.3)
        
        # Normalize both to same scale
        iso_norm = (iso_scores - iso_scores.min()) / (iso_scores.max() - iso_scores.min() + 1e-8)
        cov_norm = (cov_scores - cov_scores.min()) / (cov_scores.max() - cov_scores.min() + 1e-8)
        
        ensemble_scores = (iso_norm * iso_weight + cov_norm * cov_weight) / (iso_weight + cov_weight)
        
        return ensemble_scores
    
    def save(self, filepath):
        """Save model to file for the offline desktop app"""
        payload = pickle.dumps({
            'iso_forest': self.iso_forest,
            'robust_cov': self.robust_cov,
            'features': self.feature_columns,
            'weights': self.weights,
            'use_ensemble': self.use_ensemble
        })
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
            
            required_keys = ['iso_forest', 'features']
            if not all(key in data for key in required_keys):
                raise KeyError(f"Missing required keys: {required_keys}")
            
            if not isinstance(data['iso_forest'], IsolationForest):
                raise ValueError("Invalid model format: 'iso_forest' must be an IsolationForest instance.")
            
            if not isinstance(data['features'], Iterable) or isinstance(data['features'], (str, bytes)):
                raise ValueError("Invalid model format: 'features' must be an iterable of column names.")

            features = list(data['features'])
            if not all(isinstance(col, str) for col in features):
                raise ValueError("Invalid model format: every feature name must be a string.")

            self.iso_forest = data['iso_forest']
            self.robust_cov = data.get('robust_cov')
            self.feature_columns = features
            self.weights = data.get('weights')
            self.use_ensemble = data.get('use_ensemble', True)
            self.is_trained = True
        except (pickle.UnpicklingError, OSError, ValueError, KeyError, ModelLoadError) as exc:
            logger.exception("Failed to load anomaly model from %s", filepath)
            raise ModelLoadError(f"Unable to load model from '{filepath}': {exc}") from exc