import sys
import pandas as pd
sys.path.insert(0, 'backend')
sys.path.insert(0, 'ml')

from ml.ledgerspy_engine.modules.benford_profiler import BenfordProfiler

df_mod = pd.read_csv('ml/ledgerspy_moderate_1500.csv')
df_high = pd.read_csv('ml/ledgerspy_highfraud_1500.csv')
df_clean = pd.read_csv('ml/test_data_clean.csv')

profiler = BenfordProfiler()

print('=== DATASET COMPARISON ===\n')

for name, df in [('CLEAN', df_clean), ('MODERATE', df_mod), ('HIGH', df_high)]:
    result = profiler.analyze(df, weighted=False)
    chi_sq = result["chi_square_stat"]
    mad = result["mad"]
    
    print(f'{name} Fraud:')
    print(f'  Chi-Square: {chi_sq}')
    print(f'  MAD: {mad}%')
    print(f'  Expected Risk: {"10-20%" if name == "CLEAN" else "20-30%" if name == "MODERATE" else "95%+"}')
    print()

print('=== FORMULA TESTING ===\n')

# Test all formulas for each dataset
results = []
for name, df in [('CLEAN', df_clean), ('MODERATE', df_mod), ('HIGH', df_high)]:
    result = profiler.analyze(df, weighted=False)
    chi_sq = result["chi_square_stat"]
    mad = result["mad"]
    ratio = chi_sq / 15.507
    
    # Formula options
    f1 = min(mad * 1, 100)  # MAD * 1
    f2 = min(mad * 2, 100)  # MAD * 2
    f3 = min(mad * 0.5, 100)  # MAD * 0.5
    f4 = min((ratio ** 0.5) * 10, 100)  # Sqrt ratio scaled
    f5 = min(ratio * 0.5, 100)  # Ratio * 0.5
    f6 = min(ratio * 0.25, 100)  # Ratio * 0.25
    
    print(f'{name}:')
    print(f'  MAD: {mad}%')
    print(f'  Chi/Threshold ratio: {ratio:.2f}')
    print(f'  MAD*1: {f1:.1f}%')
    print(f'  MAD*2: {f2:.1f}%')  
    print(f'  MAD*0.5: {f3:.1f}%')
    print(f'  sqrt(ratio)*10: {f4:.1f}%')
    print(f'  ratio*0.5: {f5:.1f}%')
    print(f'  ratio*0.25: {f6:.1f}%')
    print()
