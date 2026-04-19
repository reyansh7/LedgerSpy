import sys
import pandas as pd
sys.path.insert(0, 'backend')
sys.path.insert(0, 'ml')

from ml.ledgerspy_engine.modules.benford_profiler import BenfordProfiler

# Load moderate fraud dataset
df_mod = pd.read_csv('ml/ledgerspy_moderate_1500.csv')

profiler = BenfordProfiler()

print('=== MODERATE FRAUD - DIGIT DISTRIBUTION ===')
result_mod = profiler.analyze(df_mod, weighted=False)

print(f'Chi-Square: {result_mod["chi_square_stat"]}')
print(f'P-Value: {result_mod["p_value"]}')
print(f'MAD: {result_mod["mad"]}')
print(f'Compliance Confidence: {result_mod["compliance_confidence"]}%')

print('\nDigit Distribution:')
print('Digit | Expected % | Observed % | Deviation')
for d in range(1, 10):
    if d in result_mod["digit_distribution"]:
        info = result_mod["digit_distribution"][d]
        exp = info["expected_pct"]
        obs = info["observed_pct"]
        dev = obs - exp
        print(f'  {d}   |   {exp:6.2f}   |   {obs:6.2f}   | {dev:+7.2f}')

# Try alternative calculation
print('\n=== ALTERNATIVE BENFORD RISK CALCULATIONS ===')

# Option 1: Use MAD scaled to 0-100
mad_value = result_mod["mad"] / 100.0  # Convert from % to decimal
print(f'MAD value (decimal): {mad_value}')
print(f'Option 1 - Scale MAD by 10x: {min(mad_value * 10 * 100, 100)}%')

# Option 2: Use chi-square with logarithmic scaling
chi_sq = result_mod["chi_square_stat"]
threshold = 15.507
ratio = chi_sq / threshold
print(f'Option 2 - Log scaling: {min((ratio ** 0.5), 10) * 10}%')

# Option 3: Softmax scaling
import math
softmax_risk = 100 / (1 + math.exp(-0.001 * (ratio - 50)))
print(f'Option 3 - Sigmoid scaling: {softmax_risk:.2f}%')

# Option 4: Use p-value inverted with scaling
p_val = result_mod["p_value"]
print(f'Option 4 - Using p-value: {min((1 - p_val) * 100, 100)}%')

# Option 5: Capped linear (current is 50x multiplier)
print(f'Option 5 - Linear (current 50x): {min((ratio) * 50, 100)}%')
print(f'Option 5a - Linear 10x: {min((ratio) * 10, 100)}%')
print(f'Option 5b - Linear 3x: {min((ratio) * 3, 100)}%')
print(f'Option 5c - Linear 2x: {min((ratio) * 2, 100)}%')
print(f'Option 5d - Linear 1x: {min((ratio) * 1, 100)}%')
