import sys
import pandas as pd
import math
sys.path.insert(0, 'backend')
sys.path.insert(0, 'ml')

from ml.ledgerspy_engine.modules.benford_profiler import BenfordProfiler

df_clean = pd.read_csv('ml/test_data_clean.csv')
df_mod = pd.read_csv('ml/ledgerspy_moderate_1500.csv')
df_high = pd.read_csv('ml/ledgerspy_highfraud_1500.csv')

profiler = BenfordProfiler()
threshold = profiler.threshold

print('=== FINAL BENFORD RISK CALCULATION ===\n')

datasets = [('CLEAN', df_clean, '10-20%'), ('MODERATE', df_mod, '20-30%'), ('HIGH', df_high, '95%+')]

for name, df, expected in datasets:
    result = profiler.analyze(df, weighted=False)
    chi_sq = result["chi_square_stat"]
    mad = result["mad"] / 100.0  # Convert % to decimal
    ratio = chi_sq / threshold
    
    # Apply tiered formula
    if ratio < 2:
        benford_risk = min(mad * 100 * 2, 100.0)
    elif ratio < 90:
        benford_risk = min(ratio / 3, 100.0)
    else:
        benford_risk = min(math.sqrt(ratio) * 10, 100.0)
    
    print(f'{name} Fraud:')
    print(f'  Chi-Square: {chi_sq:.2f}')
    print(f'  Ratio (chi/threshold): {ratio:.2f}')
    print(f'  MAD: {mad*100:.2f}%')
    print(f'  Formula Branch: {"ratio<2(MAD*2)" if ratio < 2 else "2<=ratio<90(ratio/3)" if ratio < 90 else "ratio>=90(sqrt*10)"}')
    print(f'  Benford Risk: {benford_risk:.1f}%')
    print(f'  Expected: {expected}')
    match = "✓" if ((ratio < 2 and 10 <= benford_risk <= 20) or 
                    (2 <= ratio < 90 and 20 <= benford_risk <= 30) or 
                    (ratio >= 90 and benford_risk >= 90)) else "✗"
    print(f'  Match: {match}')
    print()
