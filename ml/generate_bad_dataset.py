import pandas as pd
import numpy as np
from datetime import datetime, timedelta

np.random.seed(42)
n_records = 300  # Smaller dataset to penalize record sufficiency

# Create EXTREMELY degraded dataset - target ~50% readiness score
data = {
    'transaction_id': [
        f'TXN{i:05d}' if np.random.random() > 0.60 else np.nan  # 60% missing
        for i in range(n_records)
    ],
    'timestamp': [
        (datetime(2024, 1, 1) + timedelta(days=int(np.random.normal(100, 150)))).strftime('%Y-%m-%d %H:%M:%S') 
        if np.random.random() > 0.55 else  # 55% missing or invalid
        ('2026-13-45 27:70:00' if np.random.random() > 0.5 else np.nan)
        for _ in range(n_records)
    ],
    'source_entity': [
        f'VENDOR_{np.random.randint(1, 5)}' if np.random.random() > 0.65 else np.nan  # 65% missing
        for _ in range(n_records)
    ],
    'destination_entity': [
        f'DEPT_{np.random.choice(["A", "B"])}' if np.random.random() > 0.65 else np.nan  # 65% missing
        for _ in range(n_records)
    ],
    'amount': [
        round(np.random.uniform(-50000, 100000), 2) if np.random.random() > 0.50 else np.nan  # 50% missing
        for _ in range(n_records)
    ],
    'is_fraud': [
        1 if i % 10 == 0 else 0
        for i in range(n_records)
    ]
}

df = pd.DataFrame(data)
df.to_csv('poor_quality_dataset_50pct.csv', index=False)

print('✓ Created poor_quality_dataset_50pct.csv (TARGET: ~50% readiness)')
print(f'  Records: {len(df)} (small dataset penalizes record sufficiency)')
print(f'  Missing transaction_id: {df["transaction_id"].isna().sum()} ({df["transaction_id"].isna().sum()/len(df)*100:.1f}%)')
print(f'  Missing timestamps: {df["timestamp"].isna().sum()} ({df["timestamp"].isna().sum()/len(df)*100:.1f}%)')
print(f'  Missing amounts: {df["amount"].isna().sum()} ({df["amount"].isna().sum()/len(df)*100:.1f}%)')
print(f'  Missing source_entity: {df["source_entity"].isna().sum()} ({df["source_entity"].isna().sum()/len(df)*100:.1f}%)')
print(f'  Missing destination_entity: {df["destination_entity"].isna().sum()} ({df["destination_entity"].isna().sum()/len(df)*100:.1f}%)')
print(f'  Negative amounts: {(df["amount"] < 0).sum()}')
