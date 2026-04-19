#!/usr/bin/env python3
"""Debug script to trace Monte Carlo simulation step by step."""

import sys
sys.path.insert(0, 'backend')
sys.path.insert(0, 'ml')

import pandas as pd
import numpy as np
from ledgerspy_engine.monte_carlo import (
    calculate_monthly_totals,
    bootstrap_sample_scenarios,
    run_cash_balance_simulation,
    calculate_survival_metrics,
)

# Read the CSV
df = pd.read_csv('ml/synthetic_ledger_data.csv')
print(f"✅ Loaded {len(df)} transactions")

# Step 1: Monthly totals
monthly_flows, metadata = calculate_monthly_totals(df)
print(f"\n=== STEP 1: Monthly Totals ===")
print(f"Has real inflows: {metadata['has_real_inflows']}")
print(f"Real inflow total: ₹{metadata['total_real_inflow']:,.0f}")
print(f"Real outflow total: ₹{metadata['total_real_outflow']:,.0f}")
print(f"Inflow multiplier: {metadata['inflow_multiplier']}")
print(f"Monthly flows count: {len(monthly_flows)}")
print(f"Mean monthly flow: ₹{np.mean(monthly_flows):,.0f}")
print(f"Std monthly flow: ₹{np.std(monthly_flows):,.0f}")
print(f"Min monthly: ₹{np.min(monthly_flows):,.0f}")
print(f"Max monthly: ₹{np.max(monthly_flows):,.0f}")
print(f"First 3 months: {[f'{x:,.0f}' for x in monthly_flows[:3]]}")

# Step 2: Bootstrap scenarios (just 50 for testing)
print(f"\n=== STEP 2: Bootstrap Sampling (50 scenarios) ===")
scenarios = bootstrap_sample_scenarios(monthly_flows, 50, 12)
print(f"Shape: {scenarios.shape}")
print(f"Mean across scenarios: ₹{np.mean(scenarios):,.0f}")
print(f"First scenario, first 3 months: {[f'{x:,.0f}' for x in scenarios[0, :3]]}")
print(f"Scenario 1 total (12 months): ₹{np.sum(scenarios[0]):,.0f}")

# Step 3: Balance simulation
print(f"\n=== STEP 3: Cash Balance Simulation ===")
balance_paths = run_cash_balance_simulation(scenarios, 100000, 0.0)
print(f"Shape: {balance_paths.shape}")
print(f"Starting balance: ₹{balance_paths[0, 0]:,.0f}")
print(f"Scenario 1 ending balance: ₹{balance_paths[0, -1]:,.0f}")
print(f"Scenario 1 all balances: {[f'{x:,.0f}' for x in balance_paths[0]]}")
print(f"P5 ending: ₹{np.percentile(balance_paths[:, -1], 5):,.0f}")
print(f"P50 ending: ₹{np.percentile(balance_paths[:, -1], 50):,.0f}")
print(f"P95 ending: ₹{np.percentile(balance_paths[:, -1], 95):,.0f}")
print(f"Min balance across all scenarios: ₹{np.min(balance_paths):,.0f}")

# Step 4: Survival
print(f"\n=== STEP 4: Survival Metrics ===")
metrics = calculate_survival_metrics(balance_paths, 10000)
print(f"Survival probability: {metrics['survival_probability']:.1f}%")
print(f"% insolvent: {metrics['pct_scenarios_insolvent']:.1f}%")
print(f"P50 min balance: ₹{np.percentile(metrics['min_balances_per_sim'], 50):,.0f}")
print(f"Scenarios went below ₹10k: {np.sum(metrics['min_balances_per_sim'] < 10000)}")
print(f"Total scenarios: {len(metrics['min_balances_per_sim'])}")
