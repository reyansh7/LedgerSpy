import pandas as pd
from .utils.preprocessing import LedgerPreprocessor
from .modules.benford_profiler import BenfordProfiler
from .modules.anomaly_detector import AnomalyModel
from .modules.entity_matcher import EntityMatcher
from .modules.risk_mapper import RiskMapper

class LedgerSpyEngine:
    def __init__(self):
        self.preprocessor = LedgerPreprocessor()
        self.benford = BenfordProfiler()
        self.anomaly_detector = AnomalyModel()
        self.entity_matcher = EntityMatcher()
        self.risk_mapper = RiskMapper()

    def run_full_audit(self, raw_data: pd.DataFrame):
        # 1. Clean and Prepare
        clean_df = self.preprocessor.validate_and_clean(raw_data)
        features = self.preprocessor.engineer_anomaly_features(clean_df)

        # 2. Run All Analysis Modules
        self.anomaly_detector.train(features)
        anomalies = self.anomaly_detector.predict(features)
        
        # 3. Explain Anomalies
        anomaly_indices = pd.Index([i for i, is_anom in enumerate(anomalies) if is_anom])
        risk_insights = self.anomaly_detector.explain_anomalies(clean_df, features, anomaly_indices) if len(anomaly_indices) > 0 else {}
        
        return {
            "benford_results": self.benford.analyze(clean_df),
            "anomalies": anomalies,
            "ghost_vendors": self.entity_matcher.find_ghost_vendors(clean_df['destination_entity'].tolist()),
            "network_loops": self._find_network_loops(clean_df),
            "risk_insights": risk_insights
        }

    def _find_network_loops(self, clean_df: pd.DataFrame):
        self.risk_mapper.build_graph(clean_df)
        try:
            return self.risk_mapper.find_circular_loops()
        except ValueError as exc:
            if "Graph is empty" in str(exc):
                return []
            raise