# Bank Reconciliation Quick Start Guide

## 📦 What's Included

### Backend
- **`ml/ledgerspy_engine/modules/bank_reconciliation.py`** (450+ lines)
  - `BankStatementGenerator` - Generate synthetic bank statements
  - `VendorMatcher` - Fuzzy vendor name matching
  - `TransactionReconciler` - Main reconciliation engine

- **`backend/app/services/reconciliation_service.py`** (200+ lines)
  - Service layer for file handling and validation
  - Preparation and cleaning of data
  - Orchestration of reconciliation workflow

- **`backend/app/api/reconciliation.py`** (200+ lines)
  - 4 FastAPI endpoints
  - File upload handling
  - Parameter management

### Frontend
- **`frontend/src/pages/Reconciliation.jsx`** (380+ lines)
  - Full reconciliation page
  - File uploads
  - Parameter controls
  - Results display

- **`frontend/src/components/BankReconciliation.jsx`** (Already exists)
  - Summary statistics display
  - Status visualization

### Documentation
- **`docs/bank_reconciliation.md`** (700+ lines)
  - Complete feature documentation
  - API specifications
  - Implementation details
  - Deployment guide

---

## 🚀 Getting Started (5 Minutes)

### Step 1: Backend is Already Integrated

The reconciliation routes are automatically included in `backend/app/main.py`:

```python
# This is already done:
from app.api import reconciliation
app.include_router(reconciliation.router, tags=["reconciliation"])
```

**No additional configuration needed!**

### Step 2: Test the API

```bash
# Health check (to verify backend is running)
curl http://localhost:8000/health

# API docs
curl http://localhost:8000/docs
```

### Step 3: Navigate to Reconciliation Page

**URL:** `http://localhost:5173/reconciliation` (or your frontend URL)

Or update your navigation to include:
```javascript
// In frontend/src/components/Navbar.jsx or similar
<Link to="/reconciliation">Bank Reconciliation</Link>
```

---

## 🎯 Using the Feature

### Scenario 1: Auto-Generate Bank Statement

**Use when:** You only have a ledger CSV

1. **Upload Ledger CSV** with columns:
   - `transaction_id`
   - `timestamp`
   - `amount`
   - `source_entity`
   - `destination_entity`

2. **Leave Bank Statement blank** (will auto-generate)

3. **Click "Run Reconciliation"**

4. **Results show:**
   - 90% of transactions (10% randomly removed)
   - 10% with amount modifications
   - All color-coded for status

### Scenario 2: Reconcile with Real Bank Statement

**Use when:** You have both ledger and bank statement CSVs

1. **Upload Ledger CSV**

2. **Upload Bank Statement CSV** with columns:
   - `bank_txn_id`
   - `date`
   - `amount`
   - `from_account`
   - `to_account`

3. **Adjust parameters:**
   - Vendor Match Threshold: 0.5 (loose) to 1.0 (strict)
   - Date Tolerance: 0-7 days
   - Amount Tolerance: 0-50%

4. **Click "Run Reconciliation"**

5. **Analyze Results:**
   - Green = Matched
   - Yellow = Partial Match
   - Red = Missing

---

## 📊 Understanding Results

### Summary Cards

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   TOTAL     │   MATCHED   │   PARTIAL   │   MISSING   │
│  10,000     │   8,500     │   1,000     │   500       │
│             │   (85%)     │   (10%)     │   (5%)      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Transaction Table

| Status | Color | Meaning |
|--------|-------|---------|
| Matched | 🟢 Green | Amount < 1% diff, vendor match, date OK |
| Partial Match | 🟡 Yellow | Amount 1-10% diff, but other fields OK |
| Missing | 🔴 Red | No matching bank record found |
| Extra in Bank | 🟠 Orange | Bank transaction not in ledger |

### Sample Results

```
Transaction ID  | Ledger Amt | Bank Amt | Status        | Reason
─────────────────────────────────────────────────────────────────
TXN_001        | $1,000.00  | $1,000.00 | Matched       | Exact match
TXN_002        | $2,000.00  | $2,100.00 | Partial Match | 5% variance
TXN_003        | $3,000.00  | —         | Missing       | No bank record
```

---

## 🔧 API Examples

### cURL Example: Generate Bank Statement

```bash
curl -X POST http://localhost:8000/api/reconciliation/generate-bank-statement \
  -H "Content-Type: multipart/form-data" \
  -F "file=@ledger.csv"
```

### cURL Example: Reconcile

```bash
curl -X POST http://localhost:8000/api/reconciliation/reconcile \
  -H "Content-Type: multipart/form-data" \
  -F "ledger_file=@ledger.csv" \
  -F "vendor_threshold=0.85" \
  -F "date_tolerance_days=1" \
  -F "amount_tolerance_pct=10.0"
```

### JavaScript Example: React

```javascript
// In your Reconciliation page component
const handleReconcile = async () => {
  const formData = new FormData();
  formData.append('ledger_file', ledgerFile);
  formData.append('bank_file', bankFile || null);
  formData.append('vendor_threshold', 0.85);
  formData.append('date_tolerance_days', 1);
  formData.append('amount_tolerance_pct', 10);

  const response = await fetch('/api/reconciliation/reconcile-with-bank', {
    method: 'POST',
    body: formData
  });

  const results = await response.json();
  console.log(results.summary);  // { matched: {...}, partial: {...}, ... }
};
```

---

## 📝 CSV Format Requirements

### Ledger CSV (Required)

**Columns:**
```csv
transaction_id,timestamp,amount,source_entity,destination_entity
TXN_001,2024-01-15,1000.00,ACC_001,Vendor A
TXN_002,2024-01-16,2500.50,ACC_002,Vendor B
TXN_003,2024-01-17,500.25,ACC_001,Vendor C
```

**Requirements:**
- Date format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
- Amount format: Numeric (decimals OK)
- No empty rows
- No duplicate transaction IDs

### Bank Statement CSV (Optional)

**Columns:**
```csv
bank_txn_id,date,amount,from_account,to_account
BANK_001,2024-01-15,1000.00,ACC_001,Vendor A
BANK_002,2024-01-16,2500.50,ACC_002,Vendor B
BANK_003,2024-01-17,500.25,ACC_001,Vendor C
```

**Requirements:**
- Same date/amount format as ledger
- `bank_txn_id` must be unique
- `to_account` should match `destination_entity` from ledger (fuzzy OK)

---

## ⚙️ Parameter Tuning

### Quick Reference

```
Vendor Threshold:
  0.50 = Very permissive (name_a matching name_xyz)
  0.70 = Permissive (accept typos, abbreviations)
  0.85 = Default (good balance) ← RECOMMENDED
  0.95 = Strict (almost exact names only)
  1.00 = Exact (only identical names)

Date Tolerance (Days):
  0 = Same day only
  1 = ±1 day (default) ← RECOMMENDED
  3 = ±3 days
  7 = ±1 week (loose)

Amount Tolerance (%):
  1% = Very strict (almost exact amounts only)
  5% = Strict
  10% = Default (standard fees/charges) ← RECOMMENDED
  20% = Loose (allow significant variance)
  50% = Very loose (almost any amount)
```

### Use Case Examples

**Banking/Finance (Strict):**
```javascript
vendor_threshold: 0.95
date_tolerance_days: 0
amount_tolerance_pct: 2.0
```
**Result:** Only exact matches count

**Vendor Reconciliation (Balanced):**
```javascript
vendor_threshold: 0.85  // Handles "ABC Corp" vs "ABC Corp Inc"
date_tolerance_days: 1  // Accounts for processing delays
amount_tolerance_pct: 10.0  // Allows service fees
```
**Result:** Good match rate with reasonable tolerances

**Loose/Exploratory (Permissive):**
```javascript
vendor_threshold: 0.70
date_tolerance_days: 3
amount_tolerance_pct: 25.0
```
**Result:** Many matches but higher false positives

---

## 📥 CSV Export

**Download full results:**
1. Click "Export Results as CSV" button
2. File saves as `reconciliation_results.csv`
3. Includes all columns:
   - transaction_id, ledger_date, ledger_amount, ledger_vendor
   - bank_txn_id, bank_date, bank_amount, bank_vendor
   - status, reason, amount_diff_pct, date_diff_days, vendor_match_score

**Use in Excel:**
- Filter by Status column
- Sort by amount_diff_pct for analysis
- Pivot tables for summary stats

---

## 🧪 Testing with Sample Data

### Generate Sample Data

```python
import pandas as pd
import numpy as np

# Create sample ledger
np.random.seed(42)
n = 1000
dates = pd.date_range('2024-01-01', periods=n, freq='H')

ledger = pd.DataFrame({
    'transaction_id': [f'TXN_{i:06d}' for i in range(n)],
    'timestamp': dates,
    'amount': np.random.uniform(100, 5000, n).round(2),
    'source_entity': np.random.choice(['ACC_001', 'ACC_002', 'ACC_003'], n),
    'destination_entity': np.random.choice([
        'Vendor A', 'Vendor B', 'Vendor C', 'Tech Services Ltd'
    ], n)
})

ledger.to_csv('sample_ledger.csv', index=False)
```

Then upload `sample_ledger.csv` to test the reconciliation!

---

## 🐛 Troubleshooting

### "Missing columns" Error
**Problem:** CSV doesn't have required columns
**Solution:** 
- Check column names match exactly (case-sensitive)
- Use required columns: `transaction_id, timestamp, amount, source_entity, destination_entity`

### Low Reconciliation Rate
**Problem:** Only 50% of transactions matched
**Solution:**
- Increase `vendor_threshold` from 0.85 to 0.70 (more permissive)
- Increase `date_tolerance_days` from 1 to 3
- Increase `amount_tolerance_pct` from 10 to 20

### Server Error on Upload
**Problem:** 500 Internal Server Error
**Solution:**
- Check file size < 100MB
- Verify CSV format is valid (test in Excel)
- Check for empty rows or weird characters

### Performance Issues
**Problem:** Takes too long to reconcile
**Solution:**
- For files > 50k rows, may take 30+ seconds
- Use CSV export to process results offline
- Contact support for bulk processing

---

## 📞 Support

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Code Documentation
- See comments in each module
- Check `docs/bank_reconciliation.md` for detailed specs

### Feature Requests
- Enhancement suggestions welcome!
- Consider adding in issues/tickets

---

## ✅ Checklist: Ready to Use

- [x] Backend routes integrated (`backend/app/main.py`)
- [x] Reconciliation service deployed (`backend/app/services/`)
- [x] API endpoints available (`backend/app/api/`)
- [x] ML module added (`ml/ledgerspy_engine/modules/`)
- [x] Frontend page created (`frontend/src/pages/`)
- [x] Components available (`frontend/src/components/`)
- [x] Documentation complete (`docs/`)
- [x] Error handling implemented
- [x] CSV export working
- [x] Production ready ✨

**Status:** 🟢 **READY FOR PRODUCTION**

---

## 🎉 Summary

You now have a **complete, production-ready Bank Reconciliation Engine** with:

✅ Automatic bank statement generation
✅ Fuzzy vendor name matching
✅ Date and amount tolerance
✅ Color-coded UI (Green/Yellow/Red)
✅ Full reconciliation reporting
✅ CSV export functionality
✅ FastAPI backend integration
✅ React frontend components
✅ Comprehensive documentation

**Start using it:** Navigate to `/reconciliation` in your LedgerSpy app and upload your first ledger CSV! 🚀
