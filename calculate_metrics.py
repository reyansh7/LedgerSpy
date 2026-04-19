#!/usr/bin/env python3
"""
Calculate Benford's Law, Data Integrity, Flagged Records, and Survival Rate
for synthetic_ledger_data.csv
"""
import pandas as pd
import numpy as np
from scipy.stats import chisquare
import sys
from pathlib import Path

# Add ML to path
sys.path.insert(0, str(Path(__file__).parent / "ml"))

# Load dataset
df = pd.read_csv("ml/synthetic_ledger_data.csv")

print("=" * 70)
print("COMPREHENSIVE DATA ANALYSIS - synthetic_ledger_data.csv")
print("=" * 70)

# ============================================================================
# 1. BENFORD'S LAW ANALYSIS
# ============================================================================
print("\n===== BENFORD'S LAW ANALYSIS =====\n")

# Extract amounts and get first digits
amounts = pd.to_numeric(df['amount'], errors='coerce')
amounts = amounts[amounts > 0]  # Only positive values

# Get first digits
first_digits = amounts.astype(str).str.replace('.', '').str[0].astype(int)
first_digits = first_digits[first_digits > 0]  # Ensure valid digits 1-9

# Expected Benford distribution
expected_benford = np.array([
    0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046
])

# Observed frequencies
observed_freq = np.array([
    np.sum(first_digits == d) for d in range(1, 10)
]) / len(first_digits)

# Chi-squared test
expected_counts = expected_benford * len(first_digits)
observed_counts = np.array([np.sum(first_digits == d) for d in range(1, 10)])
chi2_stat, p_value = chisquare(observed_counts, expected_counts)

# Calculate Mean Absolute Deviation (MAD)
mad = np.mean(np.abs(observed_freq - expected_benford))
mad_threshold = 0.015  # Standard threshold

# Benford compliance score (0-100%)
# Based on how close MAD is to threshold
benford_compliance = max(0, 100 * (1 - (mad / mad_threshold)))

print(f"Total amounts analyzed: {len(amounts)}")
print(f"First digit distribution:")
for d in range(1, 10):
    obs = np.sum(first_digits == d) / len(first_digits)
    exp = expected_benford[d-1]
    print(f"  Digit {d}: Observed={obs:.4f}, Expected={exp:.4f}, Diff={abs(obs-exp):.4f}")

print(f"\nChi-Squared Statistic: {chi2_stat:.4f}")
print(f"P-Value: {p_value:.4f}")
print(f"Mean Absolute Deviation (MAD): {mad:.6f}")
print(f"MAD Threshold: {mad_threshold:.6f}")
print(f"Benford Compliance Score: {benford_compliance:.2f}%")
if mad <= mad_threshold:
    print("Status: PASS - Data follows Benford's Law")
else:
    print("Status: FAIL - Data deviates from Benford's Law")

# ============================================================================
# 2. DATA INTEGRITY ANALYSIS
# ============================================================================
print("\n===== DATA INTEGRITY ANALYSIS =====\n")

total_records = len(df)
valid_records = 0

for idx, row in df.iterrows():
    # Check for null/NaN values
    if pd.isna(row['transaction_id']) or pd.isna(row['amount']):
        continue
    
    # Check amount is numeric and positive
    try:
        amt = float(row['amount'])
        if amt <= 0:
            continue
    except:
        continue
    
    # Check timestamp is valid
    try:
        pd.to_datetime(row['timestamp'])
    except:
        continue
    
    # Check entities exist
    if pd.isna(row['source_entity']) or pd.isna(row['destination_entity']):
        continue
    
    if str(row['source_entity']).strip() == '' or str(row['destination_entity']).strip() == '':
        continue
    
    valid_records += 1

data_integrity_pct = (valid_records / total_records) * 100 if total_records > 0 else 0

print(f"Total Records: {total_records}")
print(f"Valid Records: {valid_records}")
print(f"Invalid Records: {total_records - valid_records}")
print(f"Data Integrity: {data_integrity_pct:.2f}%")

# ============================================================================
# 3. FLAGGED RECORDS ANALYSIS
# ============================================================================
print("\n===== FLAGGED RECORDS ANALYSIS =====\n")

# Count by fraud_label
label_counts = df['fraud_label'].value_counts()
print(f"Label Distribution:")
for label, count in label_counts.items():
    pct = (count / total_records) * 100
    print(f"  {label}: {count} ({pct:.2f}%)")

# Count total flagged (non-Normal)
flagged_count = total_records - label_counts.get('Normal', 0)
flagged_pct = (flagged_count / total_records) * 100 if total_records > 0 else 0

print(f"\nTotal Normal Records: {label_counts.get('Normal', 0)}")
print(f"Total Flagged Records: {flagged_count}")
print(f"Flagged Percentage: {flagged_pct:.2f}%")

# Breakdown
anomaly_count = label_counts.get('Anomaly', 0)
ghost_count = label_counts.get('Ghost Vendor', 0)
benford_count = label_counts.get('Benford Violation', 0)

print(f"\nFlagged Breakdown:")
print(f"  Anomalies: {anomaly_count}")
print(f"  Ghost Vendors: {ghost_count}")
print(f"  Benford Violations: {benford_count}")

# ============================================================================
# 4. GOING CONCERN - SURVIVAL RATE
# ============================================================================
print("\n===== GOING CONCERN ANALYSIS =====\n")

try:
    from ledgerspy_engine.going_concern import GoingConcernAnalyzer
    
    # Prepare DataFrame for analysis
    df_analysis = df[['timestamp', 'amount', 'source_entity', 'destination_entity']].copy()
    df_analysis['timestamp'] = pd.to_datetime(df_analysis['timestamp'])
    df_analysis['amount'] = pd.to_numeric(df_analysis['amount'], errors='coerce')
    df_analysis = df_analysis.dropna(subset=['amount', 'timestamp'])
    
    if len(df_analysis) > 0:
        # Calculate dynamic expense ratio from data
        company_departments = {'Finance Dept', 'Operations', 'Admin Dept', 'Sales', 'HR', 'Legal', 'Procurement', 'IT Dept'}
        source_counts = df_analysis['source_entity'].value_counts()
        dest_counts = df_analysis['destination_entity'].value_counts()
        top_sources = set(source_counts.head(3).index)
        top_dests = set(dest_counts.head(3).index)
        company_entities = top_sources | top_dests | company_departments
        
        df_analysis['is_outflow'] = df_analysis['source_entity'].isin(company_entities) & ~df_analysis['destination_entity'].isin(company_entities)
        total_inflow = df_analysis[~df_analysis['is_outflow']]['amount'].sum()
        total_outflow = df_analysis[df_analysis['is_outflow']]['amount'].sum()
        
        if total_inflow > 0:
            expense_ratio = max(0.01, min(total_outflow / total_inflow, 0.5))
        else:
            expense_ratio = 0.1
        
        # Run analysis
        analyzer = GoingConcernAnalyzer(num_simulations=5000, forecast_months=12)
        result = analyzer.analyze_cash_flow(
            df_analysis,
            starting_balance=100000,
            min_required_balance=10000,
            expense_ratio=expense_ratio
        )
        
        survival_prob = result['survival_probability']
        risk_level = result['risk_level']
        median_ending = result['ending_balance_stats']['p50_median']
        worst_case_p5 = result['ending_balance_stats']['p5']
        
        print(f"Total Inflow: ₹{total_inflow:,.2f}")
        print(f"Total Outflow: ₹{total_outflow:,.2f}")
        print(f"Calculated Expense Ratio: {expense_ratio:.2%}")
        print(f"\nSurvival Probability: {survival_prob:.2f}%")
        print(f"Risk Level: {risk_level}")
        print(f"Median Ending Balance (P50): ₹{median_ending:,.2f}")
        print(f"Worst Case Balance (P5): ₹{worst_case_p5:,.2f}")
        print(f"Mean Ending Balance: ₹{result['ending_balance_stats']['mean']:,.2f}")
        print(f"Minimum Median Balance: ₹{result['minimum_balance_stats']['p50_median']:,.2f}")
        print(f"Scenarios Run: {result['num_simulations']}")
        print(f"Was Escalated: {result['was_escalated']}")
        
    else:
        print("ERROR: No valid data for going concern analysis")
        survival_prob = None
        
except Exception as e:
    print(f"ERROR: Going concern analysis failed: {str(e)}")
    import traceback
    traceback.print_exc()
    survival_prob = None

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print("\n" + "=" * 70)
print("FINAL SUMMARY")
print("=" * 70)

print(f"\n📊 KEY METRICS:")
print(f"  Benford Compliance Score: {benford_compliance:.2f}%")
print(f"  Data Integrity: {data_integrity_pct:.2f}%")
print(f"  Flagged Records: {flagged_pct:.2f}%")
if survival_prob is not None:
    print(f"  Survival Rate: {survival_prob:.2f}%")
    survival_category = "HIGH" if survival_prob >= 75 else "MEDIUM" if survival_prob >= 50 else "LOW" if survival_prob >= 25 else "NO"
    print(f"  Survival Category: {survival_category}")
else:
    print(f"  Survival Rate: N/A")

print(f"\n📈 ASSESSMENT:")
print(f"  Total Records Analyzed: {total_records}")
print(f"  Clean Records (Data Integrity): {valid_records}")
print(f"  Suspicious Records: {flagged_count}")
print(f"  Data Quality: {'GOOD' if data_integrity_pct >= 90 else 'FAIR' if data_integrity_pct >= 70 else 'POOR'}")
print(f"  Benford Status: {'COMPLIANT' if benford_compliance >= 70 else 'SUSPECT'}")

print("\n" + "=" * 70)
