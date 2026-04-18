"""
Core LedgerSpy Engine: Orchestrates the full audit pipeline.
"""
import pandas as pd
from .utils.preprocessing import LedgerPreprocessor
from .memo import AuditMemoAssistant


class LedgerSpyEngine:
    """Main engine that orchestrates the audit pipeline."""

    def __init__(self):
        """Initialize the engine with preprocessing and memo generation."""
        self.preprocessor = LedgerPreprocessor()
        self.memo_assistant = AuditMemoAssistant()

    def run_full_audit(self, df: pd.DataFrame) -> dict:
        """
        Run a full audit on the input DataFrame.
        
        Steps:
        1. Calculate readiness score on raw data
        2. Validate and clean the data
        3. Engineer anomaly features
        4. Placeholder metrics (to be wired with actual modules)
        
        Args:
            df: Raw pandas DataFrame from uploaded CSV
            
        Returns:
            Dictionary with keys:
                - readiness_report: Readiness metrics
                - anomaly_count: Number of anomalies (placeholder)
                - loop_count: Number of loops (placeholder)
                - fuzzy_match_count: Number of fuzzy matches (placeholder)
                - memo: Generated audit memo
        """
        # Step 1: Calculate readiness score on raw data
        readiness_report = self.preprocessor.calculate_readiness_score(df)
        readiness_score = readiness_report.get("readiness_score", 0)

        # Step 2: Validate and clean
        clean_df = self.preprocessor.validate_and_clean(df)

        # Step 3: Engineer features (for anomaly detection)
        features = self.preprocessor.engineer_anomaly_features(clean_df)

        # Step 4: Placeholder metrics (to be replaced with actual module calls)
        anomaly_count = 0
        loop_count = 0
        fuzzy_match_count = 0

        # Generate memo from readiness report and metrics
        memo = self.memo_assistant.summarize_results(
            readiness_report, anomaly_count, loop_count, fuzzy_match_count
        )

        return {
            "readiness_report": readiness_report,
            "anomaly_count": anomaly_count,
            "loop_count": loop_count,
            "fuzzy_match_count": fuzzy_match_count,
            "memo": memo,
        }
