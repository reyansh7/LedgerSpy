"""
Enhanced Core LedgerSpy Engine: Orchestrates the full audit pipeline with ML improvements.
Features:
- Advanced feature engineering with 12+ features
- Ensemble anomaly detection
- Weighted Benford analysis
- Phonetic entity matching
- Time-aware network analysis
- Adaptive risk scoring
- Model feedback collection
"""
import pandas as pd
import numpy as np
import logging
from .utils.preprocessing import LedgerPreprocessor
from .modules.anomaly_detector import AnomalyModel
from .modules.benford_profiler import BenfordProfiler
from .modules.entity_matcher import EntityMatcher
from .modules.risk_mapper import RiskMapper
from .risk_scorer import AdaptiveRiskScorer
from .model_feedback import ModelFeedbackCollector
from .memo import AuditMemoAssistant

logger = logging.getLogger(__name__)


class LedgerSpyEngine:
    """Enhanced main engine that orchestrates the complete audit pipeline."""

    def __init__(self, use_ensemble=True, enable_feedback=True):
        """
        Initialize the enhanced engine.
        
        Args:
            use_ensemble: Enable ensemble anomaly detection
            enable_feedback: Enable feedback collection for continuous improvement
        """
        self.preprocessor = LedgerPreprocessor()
        self.anomaly_model = AnomalyModel(contamination=0.02, use_ensemble=use_ensemble)
        self.benford_profiler = BenfordProfiler()
        self.entity_matcher = EntityMatcher(default_threshold=85)
        self.risk_mapper = RiskMapper()
        self.risk_scorer = AdaptiveRiskScorer()
        self.memo_assistant = AuditMemoAssistant()
        self.feedback_collector = ModelFeedbackCollector() if enable_feedback else None
        
        self.is_trained = False

    def train(self, df: pd.DataFrame, labels: np.ndarray = None):
        """
        Train all models on provided data.
        
        Args:
            df: Training DataFrame with transactions
            labels: Optional ground truth labels (0=normal, 1=fraud) for supervised refinement
        """
        # Preprocess data
        clean_df = self.preprocessor.validate_and_clean(df)
        
        # Train anomaly detector
        features = self.preprocessor.engineer_anomaly_features(clean_df)
        self.anomaly_model.train(features, labels=labels)
        
        # Train risk scorer (if labels provided)
        if labels is not None:
            # Get scores from individual models
            anomaly_scores = self.anomaly_model.get_scores(features)
            # Normalize to 0-100
            anomaly_scores_norm = 100 * (1 + anomaly_scores) / (1 + max(abs(anomaly_scores)))
            
            # Train risk scorer
            vendor_scores = np.random.rand(len(df)) * 50  # Placeholder
            benford_scores = np.random.rand(len(df)) * 30  # Placeholder
            
            self.risk_scorer.train_from_feedback(
                labels,
                anomaly_scores_norm,
                vendor_scores,
                benford_scores
            )
        
        self.is_trained = True
        logger.info("LedgerSpy engine training complete")

    def run_full_audit(self, df: pd.DataFrame, collect_feedback: bool = False) -> dict:
        """
        Run a complete, enhanced audit on the input DataFrame.
        
        Steps:
        1. Data quality assessment (readiness score)
        2. Advanced anomaly detection with ensemble
        3. Weighted Benford's Law analysis
        4. Vendor similarity & phonetic matching
        5. Network loop detection with timing analysis
        6. Adaptive risk scoring
        7. Audit memo generation
        
        Args:
            df: Raw pandas DataFrame from uploaded CSV
            collect_feedback: If True, prepare for feedback logging (requires labels later)
            
        Returns:
            Dictionary with comprehensive audit results
        """
        logger.info(f"Starting full audit on {len(df)} transactions")
        
        # ===== STEP 1: READINESS ASSESSMENT =====
        readiness_report = self.preprocessor.calculate_readiness_score(df)
        readiness_score = readiness_report.get("readiness_score", 0)
        
        # ===== STEP 2: DATA VALIDATION & CLEANING =====
        clean_df = self.preprocessor.validate_and_clean(df)
        
        # ===== STEP 3: ADVANCED FEATURE ENGINEERING =====
        features = self.preprocessor.engineer_anomaly_features(clean_df)
        
        # ===== STEP 4: ENSEMBLE ANOMALY DETECTION =====
        if self.is_trained:
            anomaly_predictions = self.anomaly_model.predict(features)
            anomaly_scores = self.anomaly_model.get_scores(features)
        else:
            # Train on-the-fly with minimal data
            self.anomaly_model.train(features)
            anomaly_predictions = self.anomaly_model.predict(features)
            anomaly_scores = self.anomaly_model.get_scores(features)
        
        # Normalize anomaly scores to 0-100
        anomaly_scores_norm = 100 * (1 + anomaly_scores) / (1 + max(abs(anomaly_scores)))
        anomaly_count = sum(anomaly_predictions)
        
        # ===== STEP 5: WEIGHTED BENFORD'S LAW ANALYSIS =====
        try:
            benford_result = self.benford_profiler.analyze(
                clean_df, 
                amount_column='amount',
                weighted=True
            )
            benford_compliance = benford_result.get('is_compliant', True)
            benford_chi_square = benford_result.get('chi_square_stat', 0)
            benford_anomalies = benford_result.get('anomaly_patterns', [])
        except Exception as e:
            logger.error(f"Benford analysis failed: {e}")
            benford_result = {"error": str(e)}
            benford_compliance = True
            benford_chi_square = 0
            benford_anomalies = []
        
        # ===== STEP 6: VENDOR SIMILARITY & PHONETIC MATCHING =====
        try:
            destination_vendors = clean_df['destination_entity'].tolist()
            suspicious_vendors = self.entity_matcher.find_ghost_vendors(
                destination_vendors,
                use_phonetic=True
            )
            fuzzy_match_count = len(suspicious_vendors)
        except Exception as e:
            logger.error(f"Entity matching failed: {e}")
            suspicious_vendors = []
            fuzzy_match_count = 0
        
        # ===== STEP 7: NETWORK LOOP DETECTION WITH TIMING =====
        try:
            self.risk_mapper.build_graph(clean_df)
            circular_loops = self.risk_mapper.find_circular_loops(max_depth=4, min_loop_weight=0)
            high_velocity_edges = self.risk_mapper.find_high_velocity_edges(min_transactions=5)
            loop_count = len(circular_loops)
        except Exception as e:
            logger.error(f"Network analysis failed: {e}")
            circular_loops = []
            high_velocity_edges = []
            loop_count = 0
        
        # ===== STEP 8: ADAPTIVE RISK SCORING =====
        risk_scores = []
        for idx, row in clean_df.iterrows():
            anomaly_score = anomaly_scores_norm[idx] if idx < len(anomaly_scores_norm) else 0
            vendor_score = next(
                (v['risk_score'] for v in suspicious_vendors if v['vendor_1'] == row['destination_entity']),
                0
            )
            benford_score = benford_chi_square
            
            # Apply context factors
            context = {}
            if row['amount'] > clean_df['amount'].quantile(0.99):  # Top 1% amount
                context['unusual_amount'] = 1.3
            
            risk_result = self.risk_scorer.calculate_risk_score(
                anomaly_score,
                vendor_score,
                benford_score,
                context_factors=context
            )
            
            risk_scores.append(risk_result)
        
        # ===== STEP 9: GENERATE AUDIT MEMO =====
        memo = self.memo_assistant.summarize_results(
            readiness_report,
            anomaly_count,
            loop_count,
            fuzzy_match_count
        )
        
        # ===== COMPILE COMPREHENSIVE RESULTS =====
        results = {
            "audit_summary": {
                "total_transactions": len(clean_df),
                "readiness_score": readiness_score,
                "readiness_report": readiness_report,
                "data_quality": readiness_report.get('data_quality', 'Unknown')
            },
            "anomaly_detection": {
                "anomalies_detected": anomaly_count,
                "anomaly_percentage": round(anomaly_count / len(clean_df) * 100, 2) if clean_df.shape[0] > 0 else 0,
                "model_type": "Ensemble (Isolation Forest + Robust Covariance)" if self.anomaly_model.use_ensemble else "Isolation Forest",
                "contamination_assumption": "2%"
            },
            "benford_analysis": benford_result,
            "vendor_matching": {
                "suspicious_pairs": suspicious_vendors[:10],  # Top 10
                "total_suspicious_pairs": fuzzy_match_count,
                "analysis_type": "String Similarity + Phonetic Matching"
            },
            "network_analysis": {
                "circular_loops_detected": len(circular_loops),
                "loops": circular_loops[:5],  # Top 5
                "high_velocity_edges": high_velocity_edges[:5],  # Top 5
                "total_entities": len(self.risk_mapper.graph.nodes)
            },
            "risk_scoring": {
                "learned_weights": self.risk_scorer.get_feature_importance(),
                "is_adaptive": self.risk_scorer.is_trained,
                "component_scores": [rs['component_scores'] for rs in risk_scores[:10]]  # Top 10
            },
            "audit_memo": memo,
            "feedback_ready": collect_feedback
        }
        
        # Log predictions if feedback collection enabled
        if self.feedback_collector and collect_feedback:
            for idx, score in enumerate(risk_scores):
                self.feedback_collector.log_prediction(
                    transaction_id=clean_df.iloc[idx]['transaction_id'],
                    prediction_data={
                        'is_anomaly': anomaly_predictions[idx] if idx < len(anomaly_predictions) else False,
                        'risk_score': score['total_risk_score']
                    }
                )
        
        logger.info(f"Audit complete: {anomaly_count} anomalies, {loop_count} loops, {fuzzy_match_count} vendor matches")
        
        return results
