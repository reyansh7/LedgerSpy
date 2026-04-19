"""
Monte Carlo Going Concern Stress Test — Fixed Version
Simulates thousands of possible cash-flow futures to assess company survival probability.

Fixes applied:
1. DEFAULT_EXPENSE_RATIO changed to 5% (non-zero); zero triggers an explicit warning.
2. Benford's Law non-compliance now applies a configurable confidence penalty
   to the reported survival probability, preventing silent overstatement.
3. Dynamic escalation now targets BORDERLINE cases (40–65%), where extra
   precision actually changes decisions, not already-certain high-survival cases.
4. avg_days_to_insolvency is computed ONLY over paths that go insolvent
   (delegated to monte_carlo.py; guarded here with an assertion).
5. monte_carlo.py is now provided alongside this file with all core functions.
"""

import numpy as np
import pandas as pd
import logging
from typing import Dict, Optional, Tuple

from .monte_carlo import (
    MONTE_CARLO_CONFIG,
    BENFORD_CONFIG,
    RISK_COLORS,
    calculate_monthly_totals,
    bootstrap_sample_scenarios,
    run_cash_balance_simulation,
    calculate_survival_metrics,
    calculate_percentiles,
    validate_simulation_integrity,
    get_scenario_bands,
    assess_risk_level,
    generate_monthly_chart_data,
)

logger = logging.getLogger(__name__)


class GoingConcernAnalyzer:
    """
    Performs Monte Carlo simulation to assess going concern risk.
    Uses bootstrap resampling of observed monthly cash flows.

    Features:
    - Bootstrap-based scenario generation (no Gaussian assumption)
    - Non-zero default expense ratio with explicit zero-warning
    - Benford's Law confidence penalty (not just a warning)
    - Escalation on borderline survival probabilities (40–65%)
    - avg_days_to_insolvency restricted to insolvent paths only
    - Statistical validation and integrity checks
    - Comprehensive scenario banding and risk classification
    """

    def __init__(self, num_simulations: int = None, forecast_months: int = 12):
        """
        Args:
            num_simulations: Number of Monte Carlo simulations.
                             If None, uses MONTE_CARLO_CONFIG['DEFAULT_SCENARIOS'].
            forecast_months: Forecast horizon in months (default 12).
        """
        self.num_simulations = num_simulations or MONTE_CARLO_CONFIG['DEFAULT_SCENARIOS']
        self.forecast_months = forecast_months
        self.metadata: Dict = {}
        self.benford_check: Dict = {}

    # ------------------------------------------------------------------
    # PUBLIC API
    # ------------------------------------------------------------------

    def analyze_cash_flow(
        self,
        transactions_df: pd.DataFrame,
        starting_balance: float = MONTE_CARLO_CONFIG['DEFAULT_STARTING_BALANCE'],
        min_required_balance: float = MONTE_CARLO_CONFIG['DEFAULT_MIN_REQUIRED'],
        expense_ratio: float = MONTE_CARLO_CONFIG['DEFAULT_EXPENSE_RATIO'],  # FIX 1: now 5%
    ) -> dict:
        """
        Perform Monte Carlo simulation on cash flows with full validation.

        Args:
            transactions_df:    DataFrame with 'timestamp' and 'amount' columns.
                                Positive amounts = inflows, negative = outflows.
            starting_balance:   Initial cash balance (default ₹100,000).
            min_required_balance: Minimum required cash threshold (default ₹10,000).
            expense_ratio:      Monthly overhead as a fraction of starting_balance.
                                Default is 5% (₹5,000/month on a ₹100k balance).
                                Pass 0.0 explicitly only if all costs are already
                                captured in the transaction data.

        Returns:
            Comprehensive analysis dictionary.
        """

        # ===== STEP 1: EXTRACT MONTHLY TOTALS =====
        monthly_totals, metadata = calculate_monthly_totals(transactions_df)
        self.metadata = metadata
        logger.info(
            f"Extracted {len(monthly_totals)} months of data, "
            f"{metadata['total_transactions']} transactions"
        )

        # ===== STEP 2: BENFORD'S LAW PRE-CHECK =====
        benford_check = self._check_benford_law(transactions_df)
        self.benford_check = benford_check

        # FIX 2: compute the confidence penalty upfront so it can be applied later
        benford_penalty, data_quality_warning = self._compute_benford_penalty(benford_check)

        # ===== STEP 3: INITIAL SCENARIO COUNT =====
        num_scenarios = self.num_simulations
        will_escalate = False

        # ===== STEP 4: BOOTSTRAP SAMPLING =====
        monthly_flows = bootstrap_sample_scenarios(
            monthly_totals, num_scenarios, self.forecast_months
        )

        # ===== STEP 5: SIMULATE CASH BALANCES =====
        balance_paths = run_cash_balance_simulation(
            monthly_flows, starting_balance, expense_ratio
        )

        # ===== STEP 6: CALCULATE SURVIVAL METRICS =====
        survival_metrics = calculate_survival_metrics(balance_paths, min_required_balance)
        survival_probability = survival_metrics['survival_probability']
        ci_lower, ci_upper = survival_metrics['survival_ci']

        # ===== STEP 7: DYNAMIC ESCALATION (FIX 3) =====
        # Escalate on BORDERLINE cases (default 40–65%), not high-certainty ones.
        # Borderline decisions benefit the most from a tighter confidence interval.
        lo, hi = MONTE_CARLO_CONFIG['SURVIVAL_ESCALATION_THRESHOLD']
        if lo <= survival_probability <= hi:
            will_escalate = True
            escalated_scenarios = MONTE_CARLO_CONFIG['ESCALATED_SCENARIOS']
            logger.info(
                f"Survival probability {survival_probability:.1f}% is in the borderline "
                f"range [{lo}, {hi}]. Escalating to {escalated_scenarios:,} scenarios."
            )
            monthly_flows = bootstrap_sample_scenarios(
                monthly_totals, escalated_scenarios, self.forecast_months
            )
            balance_paths = run_cash_balance_simulation(
                monthly_flows, starting_balance, expense_ratio
            )
            survival_metrics = calculate_survival_metrics(balance_paths, min_required_balance)
            survival_probability = survival_metrics['survival_probability']
            ci_lower, ci_upper = survival_metrics['survival_ci']
            num_scenarios = escalated_scenarios

        # ===== FIX 2 (APPLIED): BENFORD CONFIDENCE PENALTY =====
        # Adjust survival probability downward when data quality is suspect.
        raw_survival_probability = survival_probability
        survival_probability = max(0.0, survival_probability - benford_penalty)
        ci_lower = max(0.0, ci_lower - benford_penalty)
        ci_upper = max(0.0, ci_upper - benford_penalty)

        if benford_penalty > 0:
            logger.warning(
                f"Benford non-compliance: applying {benford_penalty:.1f}pp penalty. "
                f"Survival probability adjusted from {raw_survival_probability:.1f}% "
                f"to {survival_probability:.1f}%."
            )

        # ===== STEP 8: CALCULATE PERCENTILES =====
        end_balance_percentiles  = calculate_percentiles(survival_metrics['end_balances'])
        min_balance_percentiles  = calculate_percentiles(survival_metrics['min_balances_per_sim'])

        # ===== STEP 9: STATISTICAL VALIDATION =====
        validation = validate_simulation_integrity(
            end_balance_percentiles, min_balance_percentiles, survival_probability
        )

        # ===== STEP 10: RISK CLASSIFICATION =====
        risk_level, risk_color = assess_risk_level(survival_probability)

        # ===== STEP 11: SCENARIO BANDING =====
        scenario_bands = get_scenario_bands(
            survival_metrics['min_balances_per_sim'],
            min_balance_percentiles,
            num_scenarios,
        )

        # ===== STEP 12: CASH RUNWAY (FIX 4 guard) =====
        avg_days_to_insolvency = survival_metrics['avg_days_to_insolvency']

        # Guard: avg_days_to_insolvency must be None when no paths went insolvent.
        # If monte_carlo.py ever returns a non-None value when pct_insolvent==0,
        # that is a bug — catch it loudly rather than display a misleading figure.
        pct_insolvent = survival_metrics['pct_scenarios_insolvent']
        if pct_insolvent == 0.0 and avg_days_to_insolvency is not None:
            logger.error(
                "avg_days_to_insolvency is non-None despite 0% insolvency. "
                "Forcing to None to prevent misleading output."
            )
            avg_days_to_insolvency = None

        if avg_days_to_insolvency is None:
            cash_runway_desc = "N/A — No insolvency risk detected across all scenarios"
        else:
            cash_runway_desc = f"{avg_days_to_insolvency:.0f} days (insolvent paths only)"

        # ===== STEP 13: CHART DATA =====
        chart_data = generate_monthly_chart_data(balance_paths, self.forecast_months)

        # ===== STEP 14: AUDIT SUMMARY =====
        audit_summary = self._generate_audit_summary(
            survival_probability,
            raw_survival_probability,
            benford_penalty,
            risk_level,
            num_scenarios,
            starting_balance,
            expense_ratio,
            metadata,
            benford_check,
            validation,
        )

        return {
            # Core result
            'survival_probability':   round(survival_probability, 1),
            'raw_survival_probability': round(raw_survival_probability, 1),  # pre-penalty
            'benford_penalty_applied': round(benford_penalty, 1),
            'survival_ci_lower':      round(ci_lower, 1),
            'survival_ci_upper':      round(ci_upper, 1),
            'survival_ci_str': (
                f"{round(survival_probability, 1)}% "
                f"± {round((ci_upper - ci_lower) / 2, 1)}%"
            ),

            # Classification
            'risk_level':     risk_level,
            'risk_color':     risk_color,

            # Simulation metadata
            'num_simulations':  num_scenarios,
            'was_escalated':    will_escalate,
            'forecast_months':  self.forecast_months,

            # Input parameters
            'starting_balance':     starting_balance,
            'min_required_balance': min_required_balance,
            'expense_ratio':        expense_ratio,

            # Balance distributions
            'ending_balance_stats': {
                'p5':        round(end_balance_percentiles['p5'], 2),
                'p25':       round(end_balance_percentiles['p25'], 2),
                'p50_median': round(end_balance_percentiles['p50_median'], 2),
                'p75':       round(end_balance_percentiles['p75'], 2),
                'p95':       round(end_balance_percentiles['p95'], 2),
                'mean':      round(end_balance_percentiles['mean'], 2),
                'std':       round(end_balance_percentiles['std'], 2),
            },
            'minimum_balance_stats': {
                'p5':        round(min_balance_percentiles['p5'], 2),
                'p25':       round(min_balance_percentiles['p25'], 2),
                'p50_median': round(min_balance_percentiles['p50_median'], 2),
                'p75':       round(min_balance_percentiles['p75'], 2),
                'p95':       round(min_balance_percentiles['p95'], 2),
                'mean':      round(min_balance_percentiles['mean'], 2),
                'std':       round(min_balance_percentiles['std'], 2),
            },

            # Banding and key metrics
            'scenario_bands': scenario_bands,
            'key_metrics': {
                'avg_ending_balance':         round(float(np.mean(survival_metrics['end_balances'])), 2),
                'worst_case_ending':          round(float(np.min(survival_metrics['end_balances'])), 2),
                'best_case_ending':           round(float(np.max(survival_metrics['end_balances'])), 2),
                'median_minimum_balance':     round(float(np.median(survival_metrics['min_balances_per_sim'])), 2),
                'probability_never_insolvency': f"{survival_probability:.1f}%",
                'avg_days_to_insolvency':     cash_runway_desc,
                'pct_scenarios_insolvent':    round(pct_insolvent, 1),
            },

            # Chart data
            'chart_data': chart_data,

            # Quality and audit
            'model_integrity':        validation['status'],
            'model_integrity_issues': validation['issues'],
            'data_quality_warning':   data_quality_warning,
            'benford_check':          benford_check,
            'metadata':               metadata,
            'audit_summary':          audit_summary,
        }

    def get_recommendation(self, analysis_result: dict) -> str:
        """
        Generate audit recommendation based on going concern analysis.

        Args:
            analysis_result: Result dictionary from analyze_cash_flow().

        Returns:
            Formatted recommendation string.
        """
        prob      = analysis_result['survival_probability']
        integrity = analysis_result.get('model_integrity', 'PASS')
        penalty   = analysis_result.get('benford_penalty_applied', 0.0)

        integrity_suffix = ""
        if integrity == 'WARN':
            integrity_suffix = " (⚠ Model has warnings — review details)"
        elif integrity == 'FAIL':
            integrity_suffix = " (🚨 Model validation failed — results may be unreliable)"

        benford_suffix = ""
        if penalty > 0:
            benford_suffix = f" (ℹ️ Survival probability reduced by {penalty:.1f}pp due to data anomalies)"

        suffix = integrity_suffix + benford_suffix

        if prob >= 95:
            return f"✅ Going concern assumption appears SAFE. No material uncertainty.{suffix}"
        elif prob >= 80:
            return f"⚠️ Going concern assumption is REASONABLE with moderate stress. Monitor cash flow.{suffix}"
        elif prob >= 60:
            return f"🔴 Going concern assumption is AT RISK. Recommend liquidity improvements or contingency planning.{suffix}"
        else:
            return f"🚨 CRITICAL: Substantial doubt about going concern. Management must disclose uncertainty.{suffix}"

    # ------------------------------------------------------------------
    # PRIVATE HELPERS
    # ------------------------------------------------------------------

    def _check_benford_law(self, transactions_df: pd.DataFrame) -> Dict:
        """Run Benford's Law first-digit test on transaction amounts."""
        df = transactions_df.copy()
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').abs()
        df.dropna(subset=['amount'], inplace=True)
        df = df[df['amount'] > 0]

        if df.empty:
            return {
                'chi_squared': 0.0, 'mad': 0.0,
                'is_compliant': True,
                'chi_squared_threshold': BENFORD_CONFIG['CHI_SQUARED_THRESHOLD'],
                'mad_threshold': BENFORD_CONFIG['MAD_THRESHOLD'],
            }

        first_digits = df['amount'].astype(str).str[0].astype(int)
        n = len(first_digits)

        expected_freqs = np.array([
            0.30103, 0.17609, 0.12494, 0.09691,
            0.07918, 0.06695, 0.05799, 0.05115, 0.04576
        ])
        observed = np.array([np.sum(first_digits == d) for d in range(1, 10)]) / n

        chi_squared = float(np.sum(((observed - expected_freqs) ** 2) / expected_freqs) * n)
        mad = float(np.mean(np.abs(observed - expected_freqs)))

        is_compliant = (
            chi_squared < BENFORD_CONFIG['CHI_SQUARED_THRESHOLD'] and
            mad < BENFORD_CONFIG['MAD_THRESHOLD']
        )

        return {
            'chi_squared':            round(chi_squared, 2),
            'mad':                    round(mad, 4),
            'is_compliant':           is_compliant,
            'chi_squared_threshold':  BENFORD_CONFIG['CHI_SQUARED_THRESHOLD'],
            'mad_threshold':          BENFORD_CONFIG['MAD_THRESHOLD'],
        }

    def _compute_benford_penalty(self, benford_check: Dict) -> Tuple[float, Optional[str]]:
        """
        FIX 2: Convert Benford non-compliance into a numeric confidence penalty.

        The penalty is proportional to how far MAD exceeds the threshold,
        capped at BENFORD_CONFIDENCE_PENALTY (default 5 percentage points).

        Returns:
            (penalty_pp, warning_message_or_None)
        """
        if benford_check['is_compliant']:
            return 0.0, None

        mad       = benford_check['mad']
        threshold = benford_check['mad_threshold']
        max_pen   = MONTE_CARLO_CONFIG['BENFORD_CONFIDENCE_PENALTY']

        # Linear scale: penalty grows from 0 at threshold to max_pen at 3× threshold
        penalty = min(max_pen, max_pen * (mad - threshold) / (2 * threshold))
        penalty = round(penalty, 1)

        warning = (
            f"⚠ Data anomaly detected (MAD={mad:.4f}, threshold={threshold:.4f}). "
            f"Survival probability adjusted downward by {penalty:.1f} percentage point(s). "
            f"Interpret results with caution."
        )
        return penalty, warning

    def _generate_audit_summary(
        self,
        survival_prob: float,
        raw_survival_prob: float,
        benford_penalty: float,
        risk_level: str,
        num_scenarios: int,
        starting_balance: float,
        expense_ratio: float,
        metadata: Dict,
        benford_check: Dict,
        validation: Dict,
    ) -> str:
        """Generate a formatted audit-ready summary paragraph."""
        total_inflow     = metadata.get('total_inflow', 0)
        num_transactions = metadata.get('total_transactions', 0)
        num_months       = metadata.get('num_months_observed', 0)

        expense_note = (
            f"A fixed monthly overhead of {expense_ratio * 100:.1f}% of the starting "
            f"balance (₹{expense_ratio * starting_balance:,.0f}/month) was applied."
        )
        if expense_ratio == 0.0:
            expense_note = (
                "⚠ No fixed monthly overhead was applied (expense_ratio=0%). "
                "Ensure all cash outflows are captured in the transaction data."
            )

        benford_note = ""
        if benford_penalty > 0:
            benford_note = (
                f" Data quality check failed (MAD={benford_check['mad']:.4f}); "
                f"a {benford_penalty:.1f}pp confidence penalty was applied "
                f"(raw probability: {raw_survival_prob:.1f}%)."
            )

        integrity_note = ""
        if validation['status'] != 'PASS':
            integrity_note = (
                f" Model validation returned '{validation['status']}': "
                f"{'; '.join(validation['issues'])}."
            )

        return (
            f"Based on {num_scenarios:,} bootstrap-resampled scenarios using "
            f"{num_months} months of historical transaction data "
            f"({num_transactions:,} transactions, ₹{total_inflow:,.0f} total inflows), "
            f"the entity demonstrates a {survival_prob:.1f}% probability of maintaining "
            f"cash reserves above the required threshold over the next 12 months. "
            f"Risk classification: {risk_level}. {expense_note}"
            f"{benford_note}{integrity_note}"
        )