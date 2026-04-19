import sys
import pandas as pd
sys.path.insert(0, 'backend')
sys.path.insert(0, 'ml')

from ml.ledgerspy_engine.modules.benford_profiler import BenfordProfiler
import math

df_high = pd.read_csv('ml/ledgerspy_highfraud_1500.csv')
profiler = BenfordProfiler()

print('=== HIGH FRAUD - DIGIT DISTRIBUTION ===')
result_high = profiler.analyze(df_high, weighted=False)

print(f'Chi-Square: {result_high["chi_square_stat"]}')
print(f'MAD: {result_high["mad"]}')

print('\nDigit Distribution:')
print('Digit | Expected % | Observed % | Deviation')
for d in range(1, 10):
    if d in result_high["digit_distribution"]:
        info = result_high["digit_distribution"][d]
        exp = info["expected_pct"]
        obs = info["observed_pct"]
        dev = obs - exp
        print(f'  {d}   |   {exp:6.2f}   |   {obs:6.2f}   | {dev:+7.2f}')

# Count significantly over-represented digits
deviation_list = []
for d in range(1, 10):
    info = result_high["digit_distribution"][d]
    dev = info["observed_pct"] - info["expected_pct"]
    if dev > 10:  # significantly over-represented
        deviation_list.append(dev)

print(f'\nSignificantly over-represented digits (>10%): {len(deviation_list)}')
print(f'Deviations: {[f"{d:.1f}" for d in deviation_list]}')

# Test new formula: based on dominant deviation pattern
chi_sq = result_high["chi_square_stat"]
ratio = chi_sq / 15.507
mad = result_high["mad"] / 100  # convert from % to decimal

print(f'\n=== FORMULA COMPARISON ===')
print(f'sqrt(ratio)*10 = {min(math.sqrt(ratio)*10, 100):.1f}%')
print(f'ln(ratio+1)*15 = {min(math.log(ratio+1)*15, 100):.1f}%')
print(f'ratio^0.3*10 = {min((ratio**0.3)*10, 100):.1f}%')

# Test if MAD-based works better for all three
print(f'\n=== MAD-BASED FORMULA TEST ===')
print('Using: min(mad * 100, 100)')
print(f'HIGH: {min(mad*100, 100):.1f}%')

# What if we use chi-square directly divided by a large number?
print(f'\n=== LINEAR RATIO TEST ===')
print(f'ratio / 1.1 = {min(ratio/1.1, 100):.1f}%')
print(f'ratio / 1.5 = {min(ratio/1.5, 100):.1f}%')  
print(f'ratio / 2 = {min(ratio/2, 100):.1f}%')
print(f'ratio / 3 = {min(ratio/3, 100):.1f}%')
print(f'ratio / 4 = {min(ratio/4, 100):.1f}%')
