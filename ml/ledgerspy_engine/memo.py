"""
AuditMemoAssistant: Generates audit memos from analysis results.
"""


class AuditMemoAssistant:
    """Assistant for generating audit memos based on readiness report."""

    def __init__(self):
        self.model = None  # Can be configured to use Ollama or other LLM

    def generate_memo(self, readiness_report: dict) -> str:
        """
        Generate an audit memo based on readiness report and analysis metrics.
        
        Args:
            readiness_report: Dictionary containing readiness metrics
            
        Returns:
            A string containing the audit memo
        """
        if not readiness_report:
            return "No readiness data available for memo generation."

        readiness_score = readiness_report.get("readiness_score", 0)
        data_quality = readiness_report.get("data_quality", "Unknown")
        completeness = readiness_report.get("completeness", "Unknown")
        
        memo = f"""
AUDIT MEMO
==========
Generated from Ledger Analysis

Readiness Score: {readiness_score:.1f}%
Data Quality: {data_quality}
Completeness: {completeness}

Summary:
The uploaded ledger has been analyzed for fraud detection readiness. 
The readiness score reflects data quality, completeness, and structure compliance.
"""
        return memo.strip()

    def summarize_results(self, readiness_report: dict, anomaly_count: int, 
                         loop_count: int, fuzzy_match_count: int) -> str:
        """
        Create a detailed summary of all analysis results.
        
        Args:
            readiness_report: Readiness metrics
            anomaly_count: Number of detected anomalies
            loop_count: Number of network loops found
            fuzzy_match_count: Number of fuzzy vendor matches
            
        Returns:
            Summary string
        """
        memo = self.generate_memo(readiness_report)
        
        summary = f"""{memo}

ANALYSIS RESULTS
================
Anomalies Detected: {anomaly_count}
Circular Loops Found: {loop_count}
Fuzzy Vendor Matches: {fuzzy_match_count}

These findings should be reviewed by audit personnel for potential fraud indicators.
"""
        return summary.strip()
