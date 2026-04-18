from datetime import datetime

class AuditMemoAssistant:
    def __init__(self, auditor_name: str):
        if not auditor_name.strip():
            raise ValueError("Auditor name cannot be empty")
        self.auditor_name = auditor_name

    def _calculate_risk(self, readiness_score, anomaly_count, loop_count):
        if loop_count > 0 or anomaly_count > 10:
            return "CRITICAL"
        elif anomaly_count > 0 or readiness_score < 70:
            return "ELEVATED"
        return "LOW"

    def generate_summary(
        self,
        readiness_report: dict,
        anomaly_count: int,
        loop_count: int,
        fuzzy_match_count: int = 0,
        benfords_compliant: bool = True,
        risk_insights: dict = None,
    ) -> str:
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        score = readiness_report["readiness_score"]
        risk_level = self._calculate_risk(score, anomaly_count, loop_count)

        recommendation = {
            "CRITICAL": "[ACTION REQUIRED] Immediate investigation into circular flows and outliers is advised.",
            "ELEVATED": "[CAUTION] Anomalies detected. Escalate to senior auditor for review.",
            "LOW": "[MONITOR] No immediate red flags. Routine quarterly review recommended.",
        }[risk_level]

        memo = f"""
=====================================================
          LEDGERSPY EXECUTIVE AUDIT MEMO
=====================================================
DATE        : {now}
AUDITOR     : {self.auditor_name}
RISK LEVEL  : {risk_level}
-----------------------------------------------------
1. DATA INTEGRITY
   Readiness Score : {score}%
   Completeness    : {readiness_report['metrics']['completeness']}%
   Validity        : {readiness_report['metrics']['validity']}%

2. KEY FINDINGS
   - Isolation Forest flagged {anomaly_count} high-risk transaction(s).
   - Circular flow detection found {loop_count} money laundering loop(s).
   - Fuzzy entity matching identified {fuzzy_match_count} suspicious vendor pair(s).
   - Benford's Law distribution: {"NON-COMPLIANT" if not benfords_compliant else "COMPLIANT"}.
"""
        if anomaly_count > 0 and risk_insights:
            # Select the anomaly with the highest risk score (max feature contribution)
            top_anomaly = max(risk_insights, key=lambda a: max(risk_insights[a].values()))
            top_feature = max(risk_insights[top_anomaly], key=risk_insights[top_anomaly].get)
            top_pct = risk_insights[top_anomaly][top_feature]
            memo += f"   - Primary driver for top anomalies: {top_pct:.0f}% due to {top_feature.replace('_', ' ')}.\n"

        memo += f"""
3. RECOMMENDATION
   {recommendation}
-----------------------------------------------------
Generated locally by LedgerSpy ML Engine (Offline)
No financial data was transmitted externally.
=====================================================
"""
        return memo