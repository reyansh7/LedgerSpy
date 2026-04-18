"""
Adaptive Risk Scoring: Learns optimal weights from historical fraud data.
Replaces hardcoded weights with data-driven approach.
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)


class AdaptiveRiskScorer:
    """
    Learns risk factor weights from historical labeled data.
    Replaces the static 50-30-20 split with optimal weights.
    """
    
    def __init__(self):
        self.model = LogisticRegression(random_state=42, max_iter=1000)
        self.scaler = StandardScaler()
        self.learned_weights = {
            'anomaly': 0.5,
            'vendor_matching': 0.3,
            'benford_law': 0.2
        }
        self.is_trained = False
        self.feature_importance = {}
    
    def train_from_feedback(self, labels: np.ndarray, 
                           anomaly_scores: np.ndarray,
                           vendor_match_scores: np.ndarray,
                           benford_scores: np.ndarray):
        """
        Train optimal weights using labeled historical data.
        
        Args:
            labels: Ground truth (0=normal, 1=fraud)
            anomaly_scores: Anomaly detection scores (0-100)
            vendor_match_scores: Vendor matching scores (0-100)
            benford_scores: Benford's Law scores (0-100)
        """
        # Combine features
        X = np.column_stack([
            anomaly_scores,
            vendor_match_scores,
            benford_scores
        ])
        
        # Normalize features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train logistic regression
        self.model.fit(X_scaled, labels)
        
        # Extract learned weights (coefficients)
        coefficients = self.model.coef_[0]
        abs_coefficients = np.abs(coefficients)
        total = abs_coefficients.sum()
        
        self.learned_weights = {
            'anomaly': abs_coefficients[0] / total,
            'vendor_matching': abs_coefficients[1] / total,
            'benford_law': abs_coefficients[2] / total
        }
        
        self.feature_importance = self.learned_weights.copy()
        self.is_trained = True
        
        logger.info(f"Trained risk scorer weights: {self.learned_weights}")
        
        return self.learned_weights
    
    def calculate_risk_score(self, anomaly_score: float, 
                            vendor_match_score: float,
                            benford_score: float,
                            context_factors: dict = None) -> dict:
        """
        Calculate adaptive risk score with learned weights.
        Optionally apply context factors (blacklist, recurring, etc.)
        
        Args:
            anomaly_score: 0-100 from anomaly detector
            vendor_match_score: 0-100 from entity matcher
            benford_score: 0-100 from Benford analyzer
            context_factors: Optional dict with {factor: multiplier}
                e.g., {'is_blacklisted': 1.5, 'is_recurring': 0.7}
        """
        # Use learned weights if trained, otherwise defaults
        w_anomaly = self.learned_weights.get('anomaly', 0.5)
        w_vendor = self.learned_weights.get('vendor_matching', 0.3)
        w_benford = self.learned_weights.get('benford_law', 0.2)
        
        # Calculate weighted risk score
        base_risk = (
            anomaly_score * w_anomaly +
            vendor_match_score * w_vendor +
            benford_score * w_benford
        )
        
        # Apply context factors
        final_risk = base_risk
        applied_factors = {}
        
        if context_factors:
            for factor, multiplier in context_factors.items():
                if 0.5 <= multiplier <= 2.0:  # Sanity check on multiplier
                    final_risk *= multiplier
                    applied_factors[factor] = multiplier
        
        # Clamp to 0-100
        final_risk = max(0, min(100, final_risk))
        
        # Classify risk level
        if final_risk >= 80:
            risk_level = 'CRITICAL'
        elif final_risk >= 60:
            risk_level = 'HIGH'
        elif final_risk >= 40:
            risk_level = 'MEDIUM'
        elif final_risk >= 20:
            risk_level = 'LOW'
        else:
            risk_level = 'MINIMAL'
        
        return {
            'total_risk_score': round(final_risk, 2),
            'risk_level': risk_level,
            'component_scores': {
                'anomaly_detection': round(anomaly_score * w_anomaly, 2),
                'vendor_matching': round(vendor_match_score * w_vendor, 2),
                'benford_law': round(benford_score * w_benford, 2)
            },
            'applied_context_factors': applied_factors,
            'learned_weights': self.learned_weights
        }
    
    def get_feature_importance(self) -> dict:
        """Return the importance/weight of each risk factor"""
        return self.feature_importance.copy()
