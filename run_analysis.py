import pandas as pd
import numpy as np
import sys
import os
from scipy.stats import chisquare
from pathlib import Path

# Setup paths
base_path = Path(r'C:\Users\reyan\Downloads\LedgerSpy-main')
csv_path = base_path / 'ml' / 'synthetic_ledger_data.csv'
sys.path.insert(0, str(base_path / 'ml'))

# Load Data
df = pd.read_csv(csv_path)

# 1. Benford's Law Analysis
def calculate_benford(amounts):
    # Filter positive amounts
    amounts = [a for a in amounts if a > 0]
    if not amounts: return 0, 0, 'N/A'
    
    first_digits = [int(str(abs(a)).replace('0.','').lstrip('0')[0]) for a in amounts if str(abs(a)).replace('0.','').lstrip('0')]
    observed_counts = pd.Series(first_digits).value_counts().reindex(range(1, 10), fill_value=0)
    observed_freq = observed_counts / observed_counts.sum()
    
    expected_freq = np.array([0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046])
    expected_counts = expected_freq * observed_counts.sum()
    
    chi_stat, p_val = chisquare(observed_counts, f_obs=expected_counts)
    similarity = 100 * (1 - np.sum(np.abs(observed_freq - expected_freq)) / 2)
    status = 'PASS' if p_val > 0.05 else 'FAIL'
    return chi_stat, similarity, status

chi_val, benford_score, benford_status = calculate_benford(df['amount'])

# 2. Data Integrity
total_records = len(df)
valid_mask = df['amount'].notnull() & df['timestamp'].notnull() & df['source_entity'].notnull() & df['destination_entity'].notnull()
valid_records = valid_mask.sum()
integrity_pct = (valid_records / total_records) * 100

# 3. Flagged Records
flagged_mask = df['fraud_label'].isin(['Anomaly', 'Ghost Vendor', 'Benford Violation'])
total_flagged = flagged_mask.sum()
flagged_pct = (total_flagged / total_records) * 100
anomalies = (df['fraud_label'] == 'Anomaly').sum()
ghost_vendors = (df['fraud_label'] == 'Ghost Vendor').sum()
benford_violations = (df['fraud_label'] == 'Benford Violation').sum()

# 4. Going Concern Analysis
from ledgerspy_engine.going_concern import GoingConcernAnalyzer
# Ensure numeric amount
df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)

analyzer = GoingConcernAnalyzer(num_simulations=5000)
# Use analyze_cash_flow
gc_result = analyzer.analyze_cash_flow(df)

print(f'===== BENFORD\'S LAW ANALYSIS =====')
print(f'Chi-Squared Value: {chi_val:.4f}')
print(f'Benford Compliance Score: {benford_score:.2f}%')
print(f'Status: {benford_status}')
print()
print(f'===== DATA INTEGRITY =====')
print(f'Total Records: {total_records}')
print(f'Valid Records: {valid_records}')
print(f'Data Integrity: {integrity_pct:.2f}%')
print()
print(f'===== FLAGGED RECORDS =====')
print(f'Total Flagged: {total_flagged}')
print(f'Flagged Percentage: {flagged_pct:.2f}%')
print(f'- Anomalies: {anomalies}')
print(f'- Ghost Vendors: {ghost_vendors}')
print(f'- Benford Violations: {benford_violations}')
print()
print(f'===== GOING CONCERN ANALYSIS =====')
print(f'Survival Probability: {gc_result[\'survival_probability\']:.2f}%')
print(f'Risk Level: {gc_result[\'risk_level\']}')
print(f'Median Ending Balance: {gc_result[\'percentiles\'][\'50th\']:.2f}')
print(f'Worst Case (P5): {gc_result[\'percentiles\'][\'5th\']:.2f}')
print()
print(f'===== SUMMARY =====')
print(f'Benford Score: {benford_score:.2f}%')
print(f'Integrity: {integrity_pct:.2f}%')
print(f'Flagged Rate: {flagged_pct:.2f}%')
print(f'Survival Prob: {gc_result[\'survival_probability\']:.2f}%')
assessment = 'HEALTHY' if gc_result['survival_probability'] > 80 and integrity_pct > 95 else 'RISKY'
print(f'Final Assessment: {assessment}')
