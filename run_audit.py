import pandas as pd
import sys
import os
import json
import numpy as np

# Setup paths
sys.path.append(os.path.abspath('c:\\Users\\reyan\\Downloads\\LedgerSpy-main\\ml'))
sys.path.append(os.path.abspath('c:\\Users\\reyan\\Downloads\\LedgerSpy-main\\backend'))

# Load CSV
csv_path = 'c:\\Users\\reyan\\Downloads\\LedgerSpy-main\\ml\\fraud_test_dataset_10k.csv'
if not os.path.exists(csv_path):
    print('Error: File not found')
    sys.exit(1)

df = pd.read_csv(csv_path)

# Run analysis
from ledgerspy_engine.modules.benford_profiler import BenfordProfiler
from ledgerspy_engine.modules.anomaly_detector import AnomalyModel
from ledgerspy_engine.utils.preprocessing import LedgerPreprocessor

# 1. Benford Analysis
benford = BenfordProfiler()
benford_result = benford.analyze(df, 'amount', weighted=False)

print('=== BENFORD\'S LAW ANALYSIS ===')
print('Is Compliant: %s' % benford_result['is_compliant'])
print('Chi-Square: %.4f (threshold: 15.507)' % benford_result['chi_square_stat'])
print('P-value: %.6f' % benford_result['p_value'])
print('MAD: %.6f' % benford_result['mad'])
print('Compliance Confidence: %s%%' % benford_result['compliance_confidence'])
print('Risk Level: %s' % benford_result['mad_risk_level'])
print('')

# 2. Preprocessing & Features
preprocessor = LedgerPreprocessor()
# Simulate the transformation that audit_service does
clean_df = df.copy()
clean_df['timestamp'] = pd.to_datetime(clean_df['timestamp'])
clean_df['amount'] = pd.to_numeric(clean_df['amount'])

# 3. Get first digit distribution
from numpy import log10, floor
clean = clean_df['amount'].dropna().abs()
clean = clean[clean > 0]
log_vals = log10(clean.values)
digits = floor(10 ** (log_vals - floor(log_vals)))
digits = (digits).astype(int)
digit_counts = pd.Series(digits).value_counts().sort_index()

print('=== FIRST DIGIT DISTRIBUTION ===')
for d in range(1, 10):
    count = digit_counts.get(d, 0)
    pct = (count / len(digits)) * 100
    expected_pct = (log10(1 + 1/d)) * 100
    print('Digit %d: %6.2f%% (observed) vs %6.2f%% (expected)' % (d, pct, expected_pct))
print('')

# 4. Benford Risk Calculation
chi_square = float(benford_result['chi_square_stat'])
benford_risk = min((chi_square / 15.507) * 100, 100)
print('=== CALCULATED BENFORD RISK ===')
print('Chi-Square Risk = (chi / 15.507) x 100 = (%.2f / 15.507) x 100 = %.2f%%' % (chi_square, benford_risk))
print('')

# 5. Anomaly Detection
try:
    features = preprocessor.engineer_anomaly_features(clean_df[['transaction_id', 'timestamp', 'amount', 'source_entity', 'destination_entity']])
    model = AnomalyModel(contamination=0.05)
    model.train(features)
    anomaly_flags = model.predict(features)
    anomaly_scores = model.get_scores(features)
    
    # Normalize anomaly scores
    min_val = min(anomaly_scores)
    max_val = max(anomaly_scores)
    if max_val != min_val:
        normalized = ((max_val - anomaly_scores) / (max_val - min_val)) * 100
    else:
        normalized = [0] * len(anomaly_scores)
    
    anomaly_count = sum(anomaly_flags)
    avg_anomaly_score = sum(normalized) / len(normalized) if len(normalized) > 0 else 0
    
    print('=== ANOMALY DETECTION ===')
    print('Anomalies Detected: %d' % anomaly_count)
    print('Average Anomaly Score: %.2f%%' % avg_anomaly_score)
    print('')
    
    # 6. Risk Distribution
    high_risk_count = len([s for s in normalized if s >= 70])
    medium_risk_count = len([s for s in normalized if 40 <= s < 70])
    low_risk_count = len([s for s in normalized if s < 40])

    print('=== RISK DISTRIBUTION ===')
    print('High Risk (>=70): %d' % high_risk_count)
    print('Medium Risk (40-70): %d' % medium_risk_count)
    print('Low Risk (<40): %d' % low_risk_count)
    print('Total: %d' % (high_risk_count + medium_risk_count + low_risk_count))
    print('')
except Exception as e:
    print('Anomaly detection error: %s' % e)

# 7. Actual fraud ground truth
actual_fraud = len(df[df['is_fraud'] == 1])
print('=== GROUND TRUTH ===')
print('Actual Fraud Cases: %d out of %d (%.2f%%)' % (actual_fraud, len(df), actual_fraud/len(df)*100))
