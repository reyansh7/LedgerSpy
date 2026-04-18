# Quick Reference: Value Formatting Guide
**For:** LedgerSpy Developers & Maintainers

---

## Golden Rules 🏆

### Rule 1: All Currency in INR (₹)
```javascript
// ❌ WRONG
const display = `$${amount.toFixed(2)}`;
const display = `USD ${amount}`;

// ✅ CORRECT
const display = `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
```

### Rule 2: Always Use en-IN Locale
```javascript
// ❌ WRONG
value.toLocaleString('en-US')        // Results: 1,234.56
value.toLocaleString()               // Browser default (unpredictable)

// ✅ CORRECT
value.toLocaleString('en-IN')        // Results: 1,234 (Indian format)
value.toLocaleString('en-IN', { minimumFractionDigits: 2 })  // ₹1,234.56
```

### Rule 3: Consistent Decimal Places
```javascript
// ❌ WRONG
${amount.toFixed(1)}    // 1000.5
${amount.toFixed(3)}    // 1000.500
${amount}               // 1000 (no decimals)

// ✅ CORRECT
// Amounts: Always 2 decimals
${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

// Percentages: 1 decimal for risk scores
${riskScore.toFixed(1)}%

// Percentages: 2 decimals for Benford
${benfordPercentage.toFixed(2)}%
```

### Rule 4: Safe Null Handling
```javascript
// ❌ WRONG
${row.amount.toLocaleString('en-IN')}  // Error if row.amount is null

// ✅ CORRECT
${(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
${row.amount?.toLocaleString('en-IN') || 'N/A'}
```

---

## Component Formatting Standards 📋

### DataTable - Amount Column
```jsx
<td>
  ₹{typeof row.amount === 'number' 
    ? row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : row.amount}
</td>
```

### Statistics Cards - Large Numbers
```jsx
<StatCard 
  title="Total Records" 
  value={(data.total_records ?? 0).toLocaleString('en-IN')} 
/>
```

### Risk Scores - Percentages
```jsx
<span>{riskScore.toFixed(1)}%</span>
```

### Going Concern - Balances
```jsx
<div>
  ₹{(balance || 0).toLocaleString('en-IN')}
</div>
```

---

## Helper Functions 🛠️

### In frontend/src/utils/helpers.js:

```javascript
// Format Currency (with symbol and decimals)
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
// Usage: formatCurrency(1234.56) → ₹1,234.56

// Format Large Numbers (without currency)
export const formatNumber = (value) => {
  return (value || 0).toLocaleString('en-IN')
}
// Usage: formatNumber(123456) → 1,23,456

// Format Date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
// Usage: formatDate('2024-01-15') → 15 Jan 2024

// Format Percentage
export const formatPercentage = (value) => {
  return `${(value || 0).toFixed(1)}%`
}
// Usage: formatPercentage(85.567) → 85.6%
```

---

## Common Mistakes to Avoid ⚠️

| Mistake | Problem | Solution |
|---------|---------|----------|
| Using `$` symbol | Wrong currency | Use `₹` symbol |
| Using `en-US` locale | Wrong number format (1,234.56 instead of 1,23,456) | Use `en-IN` |
| No decimals on amounts | Loss of precision | Use `minimumFractionDigits: 2` |
| Not handling null | Console errors | Use `value ?? 0` or `value \|\| 0` |
| Mixing formatters | Inconsistent display | Use standard formatter function |

---

## Code Locations Reference 📍

**Formatting Functions:**
- Location: `frontend/src/utils/helpers.js`
- Key function: `formatCurrency()`, `formatDate()`, `formatPercentage()`

**Component Examples:**
- DataTable: `frontend/src/components/DataTable.jsx` (line 113)
- Results: `frontend/src/pages/Results.jsx` (line 392-395)
- Reconciliation: `frontend/src/pages/Reconciliation.jsx` (line 373, 397)
- ExplainableAI: `frontend/src/components/ExplainableAIPanel.jsx` (line 230)
- Going Concern: `frontend/src/components/GoingConcernStressTest.jsx` (line 238)

**Backend Type Definitions:**
- Schema: `backend/app/models/schema.py`
- Type conversion: `backend/app/api/routes.py` (convert_numpy_types function)

**Data Pipeline:**
- Preprocessing: `ml/ledgerspy_engine/utils/preprocessing.py`
- Defaults: `ml/ledgerspy_engine/going_concern.py`

---

## Testing Checklist ✅

When adding new features that display monetary values:

- [ ] Does it use `₹` symbol?
- [ ] Does it use `en-IN` locale?
- [ ] Does it have proper decimal formatting?
- [ ] Does it handle null/undefined safely?
- [ ] Does it match existing component styles?
- [ ] Is it tested with various amount ranges?

---

## Scale References 📊

### Risk Score Scale
- 0-30: Low Risk (✅ Green)
- 30-70: Medium Risk (⚠️ Yellow)
- 70-100: High Risk (❌ Red)

### Benford's Law Probability
- 0-50: Normal (✅)
- 50-80: Suspicious (⚠️)
- 80-100: Highly Suspicious (❌)

### Currency Range Examples
```
₹0.01              (Minimum with decimals)
₹1,000.00          (Standard transaction)
₹1,00,000.00       (100K - Indian format)
₹10,00,000.00      (1M - Indian format)
₹1,00,00,000.00    (10M - Indian format)
```

---

## Indian Number System 🇮🇳

The **en-IN** locale uses the Indian numbering system:

```
English (US):  1,000,000      (Thousand separator every 3 digits)
English (IN):  10,00,000      (Separator pattern: 2-2-3-2...)

Examples:
        100  →  100
      1,000  →  1,000
     10,000  →  10,000
    100,000  →  1,00,000
  1,000,000  →  10,00,000
 10,000,000  →  1,00,00,000
100,000,000  →  10,00,00,000
```

---

## Frontend Run Commands 🚀

```bash
# Start development server (port 5175)
cd frontend
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Backend Run Commands 🔧

```bash
# Install dependencies
pip install -r requirements.txt

# Run FastAPI server (port 8000)
python -m uvicorn app.main:app --reload

# Or from project root
python backend/run.py
```

---

## Support & Resources

**Comprehensive Documentation:**
- See: `COMPLETE_CODE_AUDIT_REPORT.md` (full audit details)
- See: `CODE_AUDIT_AND_FIXES.md` (specific fixes)

**Code Examples:**
- Search for `toLocaleString('en-IN'` in codebase
- Search for `₹` symbol usages
- Review helper functions in `frontend/src/utils/helpers.js`

---

**Last Updated:** April 19, 2026  
**Status:** ✅ All formatting standards implemented and verified

