"""
Monte Carlo Going Concern Stress Test - Enhanced Version
Simulates thousands of possible cash-flow futures to assess company survival probability.

Improvements:
1. Bootstrap resampling instead of Gaussian assumption
2. Correct monthly std dev calculation
3. Accurate minimum balance tracking
4. Dynamic scenario escalation
5. Benford's Law pre-check
6. Statistical validation layer
7. Accurate scenario banding
8. Proper cash runway metrics
9. All magic numbers in CONFIG
"""
import numpy as np
import pandas as pd
from datetime import datetime
import logging
from typing import Dict, Tuple, Optional

# Import our separated monte carlo logic
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
    - Dynamic scenario escalation for high-certainty cases
    - Statistical validation and integrity checks
    - Benford's Law anomaly detection
    - Comprehensive scenario banding and risk classification
    """
    
    def __init__(self, num_simulations: int = None, forecast_months: int = 12):
        """
        Initialize analyzer with optional scenario override.
        
        Args:
            num_simulations: Number of Monte Carlo simulations. 
                           If None, uses DEFAULT_SCENARIOS.
            forecast_months: Forecast horizon (default 12 months)
        """
        self.num_simulations = num_simulations or MONTE_CARLO_CONFIG['DEFAULT_SCENARIOS']
        self.forecast_months = forecast_months
        self.metadata = {}
        self.benford_check = {}
    
    def analyze_cash_flow(
        self,
        transactions_df: pd.DataFrame,
        starting_balance: float = MONTE_CARLO_CONFIG['DEFAULT_STARTING_BALANCE'],
        min_required_balance: float = MONTE_CARLO_CONFIG['DEFAULT_MIN_REQUIRED'],
        expense_ratio: float = MONTE_CARLO_CONFIG['DEFAULT_EXPENSE_RATIO'],
    ) -> dict:
        """
        Perform Monte Carlo simulation on cash flows with full validation.
        
        Args:
            transactions_df: DataFrame with 'timestamp' and 'amount' columns
            starting_balance: Initial cash balance (default ₹100,000)
            min_required_balance: Minimum required cash threshold (default ₹10,000)
            expense_ratio: Monthly expense ratio as fraction of starting balance (default 0%)
            
        Returns:
            Comprehensive analysis dictionary with all metrics and metadata
        """
        # ===== STEP 1: EXTRACT MONTHLY TOTALS =====
        monthly_totals, metadata = calculate_monthly_totals(transactions_df)
        self.metadata = metadata
        
        logger.info(f"Extracted {len(monthly_totals)} months of data, {metadata['total_transactions']} transactions")
        
        # ===== STEP 2: BENFORD'S LAW PRE-CHECK =====
        benford_check = self._check_benford_law(transactions_df)
        self.benford_check = benford_check
        
        data_quality_warning = None
        if benford_check['mad'] > BENFORD_CONFIG['MAD_THRESHOLD']:
            data_quality_warning = (
                f"⚠ Input data may contain anomalies (MAD={benford_check['mad']:.4f}). "
                f"Simulation results should be interpreted with caution."
            )
            logger.warning(data_quality_warning)
        
        # ===== STEP 3: DETERMINE SCENARIO COUNT =====
        num_scenarios = self.num_simulations
        will_escalate = False
        
        # We'll run initial sim to check survival rate, then decide on escalation
        
        # ===== STEP 4: BOOTSTRAP SAMPLING =====
        monthly_flows = bootstrap_sample_scenarios(
            monthly_totals,
            num_scenarios,
            self.forecast_months
        )
        
        # ===== STEP 5: SIMULATE CASH BALANCES =====
        balance_paths = run_cash_balance_simulation(
            monthly_flows,
            starting_balance,
            expense_ratio
        )
        
        # ===== STEP 6: CALCULATE SURVIVAL METRICS =====
        survival_metrics = calculate_survival_metrics(balance_paths, min_required_balance)
        survival_probability = survival_metrics['survival_probability']
        ci_lower, ci_upper = survival_metrics['survival_ci']
        
        # ===== STEP 7: DYNAMIC ESCALATION CHECK =====
        if (MONTE_CARLO_CONFIG['SURVIVAL_ESCALATION_THRESHOLD'][0] <= survival_probability <=
            MONTE_CARLO_CONFIG['SURVIVAL_ESCALATION_THRESHOLD'][1]):
            # High certainty case - re-run with more scenarios for tighter CI
            will_escalate = True
            escalated_scenarios = MONTE_CARLO_CONFIG['ESCALATED_SCENARIOS']
            logger.info(f"Escalating to {escalated_scenarios} scenarios for tighter confidence interval")
            
            monthly_flows = bootstrap_sample_scenarios(
                monthly_totals,
                escalated_scenarios,
                self.forecast_months
            )
            balance_paths = run_cash_balance_simulation(
                monthly_flows,
                starting_balance,
                expense_ratio
            )
            survival_metrics = calculate_survival_metrics(balance_paths, min_required_balance)
            survival_probability = survival_metrics['survival_probability']
            ci_lower, ci_upper = survival_metrics['survival_ci']
            num_scenarios = escalated_scenarios
        
        # ===== STEP 8: CALCULATE PERCENTILES =====
        end_balance_percentiles = calculate_percentiles(survival_metrics['end_balances'])
        min_balance_percentiles = calculate_percentiles(survival_metrics['min_balances_per_sim'])
        
        # ===== STEP 9: STATISTICAL VALIDATION =====
        validation = validate_simulation_integrity(
            end_balance_percentiles,
            min_balance_percentiles,
            survival_probability
        )
        
        # ===== STEP 10: RISK CLASSIFICATION =====
        risk_level, risk_color = assess_risk_level(survival_probability)
        
        # ===== STEP 11: SCENARIO BANDING (DYNAMIC) =====
        scenario_bands = get_scenario_bands(
            survival_metrics['min_balances_per_sim'],
            min_balance_percentiles,
            num_scenarios
        )
        
        # ===== STEP 12: CASH RUNWAY =====
        avg_days_to_insolvency = survival_metrics['avg_days_to_insolvency']
        if avg_days_to_insolvency is None:
            cash_runway_desc = "N/A — No insolvency risk detected across all scenarios"
        else:
            cash_runway_desc = f"{avg_days_to_insolvency:.0f} days"
        
        # ===== STEP 13: CHART DATA =====
        chart_data = generate_monthly_chart_data(balance_paths, self.forecast_months)
        
        # ===== STEP 14: GENERATE AUDIT SUMMARY =====
        audit_summary = self._generate_audit_summary(
            survival_probability,
            risk_level,
            num_scenarios,
            starting_balance,
            metadata,
            benford_check,
            validation,
        )
        
        return {
            'survival_probability': round(survival_probability, 1),
            'survival_ci_lower': round(ci_lower, 1),
            'survival_ci_upper': round(ci_upper, 1),
            'survival_ci_str': f"{round(survival_probability, 1)}% ± {round((ci_upper - ci_lower) / 2, 1)}%",
            'risk_level': risk_level,
            'risk_color': risk_color,
            'num_simulations': num_scenarios,
            'was_escalated': will_escalate,
            'forecast_months': self.forecast_months,
            'starting_balance': starting_balance,
            'min_required_balance': min_required_balance,
            'expense_ratio': expense_ratio,
            
            'ending_balance_stats': {
                'p5': round(end_balance_percentiles['p5'], 2),
                'p25': round(end_balance_percentiles['p25'], 2),
                'p50_median': round(end_balance_percentiles['p50_median'], 2),
                'p75': round(end_balance_percentiles['p75'], 2),
                'p95': round(end_balance_percentiles['p95'], 2),
                'mean': round(end_balance_percentiles['mean'], 2),
                'std': round(end_balance_percentiles['std'], 2),
            },
            'minimum_balance_stats': {
                'p5': round(min_balance_percentiles['p5'], 2),
                'p25': round(min_balance_percentiles['p25'], 2),
                'p50_median': round(min_balance_percentiles['p50_median'], 2),
                'p75': round(min_balance_percentiles['p75'], 2),
                'p95': round(min_balance_percentiles['p95'], 2),
                'mean': round(min_balance_percentiles['mean'], 2),
                'std': round(min_balance_percentiles['std'], 2),
            },
            'scenario_bands': scenario_bands,
            'key_metrics': {
                'avg_ending_balance': round(np.mean(survival_metrics['end_balances']), 2),
                'worst_case_ending': round(np.min(survival_metrics['end_balances']), 2),
                'best_case_ending': round(np.max(survival_metrics['end_balances']), 2),
                'median_minimum_balance': round(np.median(survival_metrics['min_balances_per_sim']), 2),
                'probability_never_insolvency': f"{survival_probability:.1f}%",
                'avg_days_to_insolvency': cash_runway_desc,
                'pct_scenarios_insolvent': round(survival_metrics['pct_scenarios_insolvent'], 1),
            },
            'chart_data': chart_data,
            
            # Metadata and quality flags
            'model_integrity': validation['status'],
            'model_integrity_issues': validation['issues'],
            'data_quality_warning': data_quality_warning,
            'benford_check': benford_check,
            'metadata': metadata,
            'audit_summary': audit_summary,
        }
    
    def _check_benford_law(self, transactions_df: pd.DataFrame) -> Dict:
        """
        Run Benford's Law test on transaction amounts.
        
        Args:
            transactions_df: Transaction dataframe
            
        Returns:
            Dictionary with Benford test results
        """
        df = transactions_df.copy()
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').abs()
        df = df.dropna(subset=['amount'])
        df = df[df['amount'] > 0]  # Only positive amounts for Benford
        
        # Extract first digit
        first_digits = (df['amount'].astype(str).str[0]).astype(int)
        
        # Expected Benford frequencies
        expected_freqs = np.array([
            0.30103, 0.17609, 0.12494, 0.09691, 0.07918, 0.06695, 0.05799, 0.05115, 0.04576
        ])
        
        # Observed frequencies
        observed = np.array([np.sum(first_digits == d) for d in range(1, 10)]) / len(first_digits)
        
        # Chi-squared
        chi_squared = np.sum(((observed - expected_freqs) ** 2) / expected_freqs) * len(first_digits)
        
        # MAD (Mean Absolute Deviation)
        mad = np.mean(np.abs(observed - expected_freqs))
        
        # Is compliant?
        is_compliant = (chi_squared < BENFORD_CONFIG['CHI_SQUARED_THRESHOLD'] and
                       mad < BENFORD_CONFIG['MAD_THRESHOLD'])
        
        return {
            'chi_squared': round(chi_squared, 2),
            'mad': round(mad, 4),
            'is_compliant': is_compliant,
            'chi_squared_threshold': BENFORD_CONFIG['CHI_SQUARED_THRESHOLD'],
            'mad_threshold': BENFORD_CONFIG['MAD_THRESHOLD'],
        }
    
    def _generate_audit_summary(
        self,
        survival_prob: float,
        risk_level: str,
        num_scenarios: int,
        starting_balance: float,
        metadata: Dict,
        benford_check: Dict,
        validation: Dict,
    ) -> str:
        """
        Generate auto-formatted audit summary paragraph.
        
        Args:
            survival_prob: Survival probability percentage
            risk_level: Risk classification
            num_scenarios: Number of scenarios run
            starting_balance: Starting cash balance
            metadata: Metadata about transactions
            benford_check: Benford's Law results
            validation: Model validation results
            
        Returns:
            Multi-line audit summary string
        """
        total_inflow = metadata.get('total_inflow', 0)
        num_transactions = metadata.get('total_transactions', 0)
        num_months = metadata.get('num_months_observed', 0)
        
        benford_note = ""
        if not benford_check['is_compliant']:
            benford_note = (
                f" However, the data exhibits {benford_check['mad']:.4f} MAD (threshold: "
                f"{benford_check['mad_threshold']:.4f}), indicating potential anomalies. "
            )
        
        integrity_note = ""
        if validation['status'] != 'PASS':
            integrity_note = f" Model validation returned '{validation['status']}' status. "
        
        summary = (
            f"Based on {num_scenarios:,} bootstrap-resampled scenarios using {num_months} months of "
            f"historical transaction data ({num_transactions:,} transactions, ₹{total_inflow:,.0f} total inflows), "
            f"the entity demonstrates a {survival_prob:.1f}% probability of maintaining cash reserves "
            f"above the required threshold over the next 12 months. Risk classification: {risk_level}."
            f"{benford_note}{integrity_note}"
        )
        
        return summary
    
    def get_recommendation(self, analysis_result: dict) -> str:
        """
        Generate audit recommendation based on going concern analysis.
        
        Args:
            analysis_result: Result dictionary from analyze_cash_flow()
            
        Returns:
            Formatted recommendation string
        """
        prob = analysis_result['survival_probability']
        integrity = analysis_result.get('model_integrity', 'PASS')
        
        # Build integrity note
        integrity_suffix = ""
        if integrity == 'WARN':
            integrity_suffix = " (⚠ Model has warnings - review details)"
        elif integrity == 'FAIL':
            integrity_suffix = " (🚨 Model validation failed - results may be unreliable)"
        
        if prob >= 95:
            return f"✅ Going concern assumption appears SAFE. No material uncertainty.{integrity_suffix}"
        elif prob >= 80:
            return f"⚠️ Going concern assumption is REASONABLE with moderate stress. Monitor cash flow.{integrity_suffix}"
        elif prob >= 60:
            return f"🔴 Going concern assumption is AT RISK. Recommend liquidity improvements or contingency planning.{integrity_suffix}"
        else:
            return f"🚨 CRITICAL: Substantial doubt about going concern. Management must disclose uncertainty.{integrity_suffix}"