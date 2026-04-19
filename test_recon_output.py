import pandas as pd
import sys
import json
sys.path.append('backend')
from app.services.bank_reconciliation_service import BankStatementGenerator, TransactionReconciler
try:
    ledger_df = pd.read_csv('ml/synthetic_ledger_data.csv').head(100)
except:
    ledger_df = pd.read_csv('ml/data/synthetic_ledger_data.csv').head(100)
ledger_df['amount'] = pd.to_numeric(ledger_df['amount'], errors='coerce')
ledger_df['timestamp'] = pd.to_datetime(ledger_df['timestamp'], errors='coerce')
ledger_df = ledger_df.dropna(subset=['transaction_id', 'amount', 'destination_entity'])
bank_df = BankStatementGenerator.generate(ledger_df)
reconciler = TransactionReconciler()
result = reconciler.reconcile(ledger_df, bank_df)
print('Sample Results (first 3):')
for i, r in enumerate(result['results'][:3]):
    print(f'\nTransaction {i+1}:')
    print(json.dumps(r, indent=2, default=str))
print('\nStatus Distribution:')
for status in ['MATCHED', 'PARTIAL', 'MISSING']:
    count = len([res for res in result['results'] if res['status'] == status])
    print(f'  {status}: {count}')
