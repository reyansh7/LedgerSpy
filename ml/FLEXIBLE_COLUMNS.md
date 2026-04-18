# Flexible Column Name Support

## Overview

LedgerSpy now **automatically detects and normalizes column names**. You no longer need to rename your CSV columns to exact names!

## Supported Column Variations

### Transaction ID
Accepts: `transaction_id`, `txn_id`, `tx_id`, `id`, `transaction`, `ref`, `reference`, `Transaction ID`, `TXN ID`, etc.

### Timestamp/Date
Accepts: `timestamp`, `date`, `created_at`, `transaction_date`, `txn_date`, `date_time`, `posted_date`, `posting_date`, `entry_date`, `Date`, `Timestamp`, `DateTime`, etc.

### Amount
Accepts: `amount`, `value`, `transaction_amount`, `txn_amount`, `sum`, `total`, `price`, `qty`, `quantity_amount`, `Amount`, `Value`, etc.

### Source Entity (From)
Accepts: `source_entity`, `source`, `from_entity`, `from`, `sender`, `payer`, `from_account`, `account`, `Source`, `Source_Entity`, `From`, `Sender`, etc.

### Destination Entity (To)
Accepts: `destination_entity`, `destination`, `vendor`, `payee`, `to_entity`, `to`, `recipient`, `to_account`, `counterparty`, `party`, `company`, `business`, `Destination`, `Vendor`, `Payee`, `To`, `Recipient`, etc.

---

## Examples

### Example 1: Credit Card CSV
```csv
transaction_id,date,amount,sender,vendor
TXN-001,2025-01-01,100.50,Main Bank,Apple Inc
TXN-002,2025-01-02,250.75,Main Bank,Amazon LLC
```
✅ **Works!** Automatically maps: `date` → `timestamp`, `sender` → `source_entity`, `vendor` → `destination_entity`

### Example 2: Invoice System
```csv
ref,posting_date,value,from_account,to_account
INV-001,2025-01-01,5000,Company A,Supplier B
INV-002,2025-01-02,3500,Company A,Supplier C
```
✅ **Works!** Automatically maps: `ref` → `transaction_id`, `posting_date` → `timestamp`, `value` → `amount`, etc.

### Example 3: Bank Export
```csv
ID,DateTime,Amount,Source,Destination
12345,2025-01-01 10:30:00,1000.00,Branch 1,Vendor XYZ
12346,2025-01-02 11:45:00,2000.00,Branch 1,Vendor ABC
```
✅ **Works!** Automatically normalizes all columns.

### Example 4: Mixed Case & Underscores
```csv
Transaction_ID,POSTING_DATE,Txn_Amount,SENDER_NAME,Payee_Name
TX001,2025-01-01,500,Account1,Vendor1
TX002,2025-01-02,600,Account1,Vendor2
```
✅ **Works!** Handles underscores, mixed case, and variations.

---

## Disable Auto-Normalization

If you want to use strict column names (for specific requirements):

```python
from ml.ledgerspy_engine.utils.preprocessing import LedgerPreprocessor

# Disable auto-normalization
preprocessor = LedgerPreprocessor(auto_normalize=False)
```

---

## Custom Column Mappings

For very custom column names, you can extend the mappings:

```python
from ml.ledgerspy_engine.utils.preprocessing import normalize_column_names

# Your custom mapping
custom_mapping = {
    'transaction_id': ['custom_txn_id', 'order_id', 'invoice_no'],
    'timestamp': ['booking_date', 'order_date'],
    'amount': ['order_value', 'sale_amount'],
    'source_entity': ['billing_account', 'customer_account'],
    'destination_entity': ['merchant', 'service_provider']
}

# Normalize with custom mapping
df = normalize_column_names(df, mapping=custom_mapping)
```

---

## How It Works

The auto-normalization:
1. **Case-insensitive**: `DATE` = `date` = `Date`
2. **Underscore/hyphen agnostic**: `transaction_id` = `transaction-id` = `transactionid`
3. **Priority-based**: Uses first match found in order of aliases
4. **Logged**: Reports which columns were mapped

---

## Troubleshooting

### Still getting "Missing required columns" error?

1. Check available columns: The error message lists all detected columns
2. Ensure your CSV has at least one variant of each required column:
   - `transaction_id` (or alias)
   - `timestamp` (or alias)
   - `amount` (or alias)
   - `source_entity` (or alias)
   - `destination_entity` (or alias)

3. Check for typos in column names

### Add custom aliases

If your column name isn't recognized, add it to `COLUMN_MAPPINGS` in `preprocessing.py`:

```python
COLUMN_MAPPINGS = {
    'amount': [
        'amount', 'value', 'transaction_amount', 'txn_amount',
        'YOUR_CUSTOM_NAME_HERE',  # Add your column name
        ...
    ]
}
```

---

## Example Code

```python
from ml.ledgerspy_engine.core_engine_enhanced import LedgerSpyEngine
import pandas as pd

# Load CSV with ANY column naming scheme
df = pd.read_csv('my_transactions.csv')

# Initialize engine (auto-normalization enabled by default)
engine = LedgerSpyEngine()

# Run audit - columns are automatically normalized!
results = engine.run_full_audit(df)

print(f"✅ Audit complete: {results['anomaly_detection']['anomalies_detected']} anomalies found")
```

---

## Summary

✨ **No more rename errors!** LedgerSpy now accepts flexible column names and automatically normalizes them.
