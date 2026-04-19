"""
Monte Carlo Simulation Engine - Core Logic
Separated for modularity and testability.

Provides bootstrap resampling-based cash flow simulation with statistical validation.
"""
import numpy as np
import pandas as pd
from typing import Dict, Tuple, List, Optional
import logging

logger = logging.getLogger(__name__)

# Configuration: Magic numbers centralized here
MONTE_CARLO_CONFIG = {
    'DEFAULT_SCENARIOS': 5000,
    'ESCALATED_SCENARIOS': 50000,
    'SURVIVAL_ESCALATION_THRESHOLD': (95, 100),  # Escalate if survival% in this range
    'FORECAST_MONTHS': 12,
    'DAYS_PER_MONTH': 30.44,
    'DEFAULT_STARTING_BALANCE': 100000,
    'DEFAULT_MIN_REQUIRED': 10000,
    'DEFAULT_EXPENSE_RATIO': 0.0,  # 0% default monthly burn
    'BENFORD_CONFIDENCE_PENALTY': 5.0,  # Max penalty in percentage points for Benford non-compliance
}

# Benford's Law thresholds
BENFORD_CONFIG = {
    'MAD_THRESHOLD': 0.015,  # Mean Absolute Deviation threshold for anomaly detection
    'CHI_SQUARED_THRESHOLD': 15.507,  # Threshold for 9 categories, α=0.05
}

# Color thresholds for risk classification
RISK_COLORS = {
    'SAFE': '#00c896',
    'CAUTION': '#f5a623',
    'DANGER': '#ff6b35',
    'CRITICAL': '#e63946',
    'PRIMARY': '#7c6af7',
}


def calculate_monthly_totals(transactions_df: pd.DataFrame) -> Tuple[np.ndarray, Dict]:
    """
    Extract monthly INFLOWS and OUTFLOWS, calculate net cash flow.
    For synthetic/ledger-only data (no natural inflows), generate synthetic revenue.
    
    Args:
        transactions_df: DataFrame with 'timestamp', 'source_entity', 'destination_entity', 'amount' columns
        
    Returns:
        Tuple of (net_monthly_flows array, metadata dict)
    """
    df = transactions_df.copy()
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['year_month'] = df['timestamp'].dt.to_period('M')
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    
    # Remove NaN amounts
    df = df.dropna(subset=['amount'])
    
    # Identify company entities (sources that appear most frequently = company account)
    source_counts = df['source_entity'].value_counts()
    top_source = source_counts.idxmax()  # The main account
    
    # Classify: outflows are transactions FROM the company account
    df['is_outflow'] = df['source_entity'] == top_source
    
    # Calculate monthly outflows
    all_months = sorted(df['year_month'].unique())
    net_flows = []
    total_outflow_amount = 0
    
    for month in all_months:
        month_df = df[df['year_month'] == month]
        outflow = month_df[month_df['is_outflow']]['amount'].sum()
        total_outflow_amount += outflow
        
        # For synthetic data: generate synthetic INFLOWS (~90-110% of outflows)
        # This represents realistic business revenue that covers most expenses
        inflow_ratio = np.random.uniform(0.90, 1.10)
        inflow = outflow * inflow_ratio
        
        net = inflow - outflow
        net_flows.append(net)
    
    net_flows = np.array(net_flows)
    
    # Add volatility to make flows more realistic (±5-15%)
    volatility = np.abs(net_flows) * np.random.uniform(0.05, 0.15, len(net_flows))
    volatility_direction = np.random.choice([-1, 1], len(net_flows))
    net_flows = net_flows + (volatility * volatility_direction)
    
    metadata = {
        'total_transactions': len(df),
        'date_range': {
            'start': df['timestamp'].min().isoformat(),
            'end': df['timestamp'].max().isoformat(),
        },
        'total_outflow': df[df['is_outflow']]['amount'].sum(),
        'total_synthetic_inflow': df[~df['is_outflow']]['amount'].sum(),  # Note: synthetic for ledger-only data
        'num_months_observed': len(net_flows),
        'net_cash_flow_mean': float(np.mean(net_flows)),
        'net_cash_flow_std': float(np.std(net_flows)),
        'net_cash_flow_min': float(np.min(net_flows)),
        'net_cash_flow_max': float(np.max(net_flows)),
        'note': 'Inflows synthesized as 90-110% of observed outflows for realistic cash flow modeling'
    }
    
    return net_flows, metadata


def bootstrap_sample_scenarios(
    monthly_totals: np.ndarray,
    num_scenarios: int,
    forecast_months: int
) -> np.ndarray:
    """
    Bootstrap resample monthly totals to generate cash flow scenarios.
    Adds realistic volatility and trend variations.
    
    Args:
        monthly_totals: Array of observed monthly net cash flows
        num_scenarios: Number of Monte Carlo scenarios to generate
        forecast_months: Number of months to forecast
        
    Returns:
        Array of shape (num_scenarios, forecast_months) with resampled monthly flows
    """
    # Bootstrap: sample with replacement from observed monthly totals
    scenarios = np.random.choice(
        monthly_totals,
        size=(num_scenarios, forecast_months),
        replace=True
    ).astype(float)
    
    # Add realistic volatility (20-30% variance)
    volatility = np.std(monthly_totals) * np.random.uniform(0.8, 1.2, scenarios.shape)
    noise = np.random.normal(0, volatility * 0.3, scenarios.shape)
    scenarios = scenarios + noise
    
    # Add trend variations (some scenarios grow, some shrink)
    for i in range(num_scenarios):
        trend = np.random.uniform(-0.05, 0.05)  # -5% to +5% trend
        month_trend = np.linspace(0, trend * np.mean(monthly_totals), forecast_months)
        scenarios[i] += month_trend
    
    return scenarios


def run_cash_balance_simulation(
    monthly_flows: np.ndarray,
    starting_balance: float,
    expense_ratio: float = 0.0
) -> np.ndarray:
    """
    Simulate cumulative cash balance across scenarios.
    
    Args:
        monthly_flows: Shape (num_scenarios, num_months) - monthly cash inflows
        starting_balance: Initial cash balance
        expense_ratio: Monthly expense ratio (e.g., 0.05 = 5% of starting balance)
        
    Returns:
        Array of shape (num_scenarios, num_months+1) with cumulative balances
    """
    # Apply monthly expenses
    num_scenarios, num_months = monthly_flows.shape
    monthly_expenses = np.full_like(monthly_flows, starting_balance * expense_ratio)
    net_flows = monthly_flows - monthly_expenses
    
    # Cumsum to get balance trajectory
    cumulative_flows = np.cumsum(net_flows, axis=1)
    
    # Add starting balance
    balance_paths = np.column_stack([
        np.full(num_scenarios, starting_balance),
        starting_balance + cumulative_flows
    ])
    
    return balance_paths


def calculate_survival_metrics(
    balance_paths: np.ndarray,
    min_required_balance: float
) -> Dict:
    """
    Calculate survival probability and related metrics.
    
    Args:
        balance_paths: Shape (num_scenarios, num_months+1)
        min_required_balance: Minimum cash threshold
        
    Returns:
        Dictionary with survival metrics
    """
    num_scenarios = balance_paths.shape[0]
    
    # Minimum balance reached in each scenario
    min_balances_per_sim = np.min(balance_paths, axis=1)
    
    # Survival: never drops below threshold
    survived_mask = min_balances_per_sim >= min_required_balance
    survival_probability = (np.sum(survived_mask) / num_scenarios) * 100
    
    # Ending balances
    end_balances = balance_paths[:, -1]
    
    # Compute confidence interval on survival rate (Wilson score interval)
    z = 1.96  # 95% CI
    p = survival_probability / 100
    n = num_scenarios
    denominator = 1 + (z**2 / n)
    center = (p + (z**2 / (2*n))) / denominator
    margin = z * np.sqrt((p * (1-p) / n) + (z**2 / (4*n**2))) / denominator
    ci_lower = max(0, (center - margin) * 100)
    ci_upper = min(100, (center + margin) * 100)
    
    # Days to insolvency
    insolvent_scenarios = np.any(balance_paths < 0, axis=1)
    if np.any(insolvent_scenarios):
        first_negative = np.argmax(balance_paths[insolvent_scenarios] < 0, axis=1)
        avg_months_to_insolvency = np.mean(first_negative)
        avg_days_to_insolvency = avg_months_to_insolvency * MONTE_CARLO_CONFIG['DAYS_PER_MONTH']
    else:
        avg_days_to_insolvency = None
    
    return {
        'survival_probability': survival_probability,
        'survival_ci': (ci_lower, ci_upper),
        'end_balances': end_balances,
        'min_balances_per_sim': min_balances_per_sim,
        'avg_days_to_insolvency': avg_days_to_insolvency,
        'pct_scenarios_insolvent': (np.sum(insolvent_scenarios) / num_scenarios) * 100,
    }


def calculate_percentiles(data: np.ndarray) -> Dict[str, float]:
    """
    Calculate key percentiles.
    
    Args:
        data: Array of values
        
    Returns:
        Dictionary with P5, P25, P50, P75, P95, mean, std
    """
    return {
        'p5': np.percentile(data, 5),
        'p25': np.percentile(data, 25),
        'p50_median': np.percentile(data, 50),
        'p75': np.percentile(data, 75),
        'p95': np.percentile(data, 95),
        'mean': np.mean(data),
        'std': np.std(data),
    }


def validate_simulation_integrity(
    percentiles_end: Dict,
    percentiles_min: Dict,
    survival_prob: float
) -> Dict:
    """
    Sanity check on simulation results.
    
    Args:
        percentiles_end: Ending balance percentiles
        percentiles_min: Minimum balance percentiles
        survival_prob: Survival probability (0-100)
        
    Returns:
        Dictionary with validation status and warnings
    """
    issues = []
    status = 'PASS'
    
    # Check 1: P5 < P50 < P95
    if not (percentiles_end['p5'] < percentiles_end['p50_median'] < percentiles_end['p95']):
        issues.append("Ending balance percentiles out of order")
        status = 'FAIL'
    
    # Check 2: Skewness (P50 should be close to mean)
    if percentiles_end['mean'] > 0:
        skew_pct = abs(percentiles_end['p50_median'] - percentiles_end['mean']) / percentiles_end['mean']
        if skew_pct > 0.05:
            issues.append(f"High skewness detected ({skew_pct*100:.1f}%). Distribution may be non-normal.")
            status = 'WARN' if status != 'FAIL' else 'FAIL'
    
    # Check 3: Std dev sanity
    if percentiles_end['std'] < 0:
        issues.append("Negative standard deviation (impossible)")
        status = 'FAIL'
    
    # Check 4: Minimum balance stats valid
    if not (percentiles_min['p5'] < percentiles_min['p50_median'] < percentiles_min['p95']):
        issues.append("Minimum balance percentiles out of order")
        status = 'FAIL'
    
    return {
        'status': status,
        'issues': issues,
    }


def get_scenario_bands(
    min_balances: np.ndarray,
    percentiles: Dict,
    num_scenarios: int
) -> Dict:
    """
    Dynamically create scenario bands based on percentiles.
    
    Args:
        min_balances: Array of minimum balances from each scenario
        percentiles: Dict with p5, p25, p50, p75, p95
        num_scenarios: Total number of scenarios
        
    Returns:
        Dictionary with band definitions
    """
    p5, p25, p50, p75, p95 = (
        percentiles['p5'],
        percentiles['p25'],
        percentiles['p50_median'],
        percentiles['p75'],
        percentiles['p95'],
    )
    
    # Count scenarios in each band
    critical_count = np.sum(min_balances <= p25)
    danger_count = np.sum((min_balances > p25) & (min_balances <= p50))
    caution_count = np.sum((min_balances > p50) & (min_balances <= p75))
    safe_count = np.sum(min_balances > p75)
    
    return {
        'critical': {
            'range': f"${p5:,.0f} - ${p25:,.0f}",
            'probability': f"{(critical_count / num_scenarios) * 100:.1f}%",
            'color': RISK_COLORS['CRITICAL'],
            'description': 'Bottom 10th percentile - highest risk'
        },
        'danger': {
            'range': f"${p25:,.0f} - ${p50:,.0f}",
            'probability': f"{(danger_count / num_scenarios) * 100:.1f}%",
            'color': RISK_COLORS['DANGER'],
            'description': '10th-25th percentile - elevated risk'
        },
        'caution': {
            'range': f"${p50:,.0f} - ${p75:,.0f}",
            'probability': f"{(caution_count / num_scenarios) * 100:.1f}%",
            'color': RISK_COLORS['CAUTION'],
            'description': '25th-50th percentile - moderate stress'
        },
        'safe': {
            'range': f"${p75:,.0f} - ${p95:,.0f}",
            'probability': f"{(safe_count / num_scenarios) * 100:.1f}%",
            'color': RISK_COLORS['SAFE'],
            'description': 'Above 50th percentile - comfortable position'
        }
    }


def assess_risk_level(survival_prob: float) -> Tuple[str, str]:
    """
    Classify risk level based on survival probability.
    
    Args:
        survival_prob: Survival probability (0-100)
        
    Returns:
        Tuple of (risk_level, color)
    """
    if survival_prob >= 95:
        return 'SAFE', RISK_COLORS['SAFE']
    elif survival_prob >= 80:
        return 'MODERATE', RISK_COLORS['CAUTION']
    elif survival_prob >= 60:
        return 'AT_RISK', RISK_COLORS['DANGER']
    else:
        return 'CRITICAL', RISK_COLORS['CRITICAL']


def generate_monthly_chart_data(
    balance_paths: np.ndarray,
    num_months: int
) -> List[Dict]:
    """
    Generate month-by-month projections for charting.
    
    Args:
        balance_paths: Shape (num_scenarios, num_months+1)
        num_months: Number of months
        
    Returns:
        List of monthly data dictionaries
    """
    chart_data = []
    
    for month in range(1, num_months + 1):
        # Column index: month corresponds to balance_paths[:, month]
        month_balances = balance_paths[:, month]
        
        chart_data.append({
            'month': month,
            'name': f'Month {month}',
            'p5': np.percentile(month_balances, 5),
            'p25': np.percentile(month_balances, 25),
            'median': np.percentile(month_balances, 50),
            'p75': np.percentile(month_balances, 75),
            'p95': np.percentile(month_balances, 95),
            'mean': np.mean(month_balances),
        })
    
    return chart_data
