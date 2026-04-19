import sys
import pandas as pd
sys.path.insert(0, 'backend')
sys.path.insert(0, 'ml')

from ml.ledgerspy_engine.modules.benford_profiler import BenfordProfiler

# Load datasets
df_mod = pd.read_csv('ml/ledgerspy_moderate_1500.csv')
df_high = pd.read_csv('ml/ledgerspy_highfraud_1500.csv')
df_clean = pd.read_csv('ml/test_data_clean.csv')

profiler = BenfordProfiler()

print('=== MODERATE FRAUD ===')
result_mod = profiler.analyze(df_mod, weighted=False)
print(f'Chi-Square: {result_mod["chi_square_stat"]}')
print(f'P-Value: {result_mod["p_value"]}')
print(f'Compliance Confidence: {result_mod["compliance_confidence"]}%')
print(f'MAD: {result_mod["mad"]}')
print(f'Is Compliant: {result_mod["is_compliant"]}')

print('\n=== HIGH FRAUD ===')
result_high = profiler.analyze(df_high, weighted=False)
print(f'Chi-Square: {result_high["chi_square_stat"]}')
print(f'P-Value: {result_high["p_value"]}')
print(f'Compliance Confidence: {result_high["compliance_confidence"]}%')
print(f'MAD: {result_high["mad"]}')

print('\n=== CLEAN DATA ===')
result_clean = profiler.analyze(df_clean, weighted=False)
print(f'Chi-Square: {result_clean["chi_square_stat"]}')
print(f'P-Value: {result_clean["p_value"]}')
print(f'Compliance Confidence: {result_clean["compliance_confidence"]}%')
print(f'MAD: {result_clean["mad"]}')

print('\n=== CALCULATION CHECK ===')
print('Using formula: min((chi_square / 15.507) * 50, 100)')
mod_risk = min((result_mod["chi_square_stat"] / 15.507) * 50, 100)
high_risk = min((result_high["chi_square_stat"] / 15.507) * 50, 100)
clean_risk = min((result_clean["chi_square_stat"] / 15.507) * 50, 100)
print(f'Moderate: {mod_risk}%')
print(f'High: {high_risk}%')
print(f'Clean: {clean_risk}%')

print('\n=== EXPECTED VALUES ===')
print('Moderate should be: ~20-30% (80% compliant means 20% risk)')
print('High should be: ~95%+ (severe fraud)')
print('Clean should be: ~10-20% (mostly compliant)')
