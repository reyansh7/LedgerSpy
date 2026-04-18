# Backend Calculation Issues & Fixes

## Issues Identified

### Issue 1: Wrong Risk Score Weights in `audit_service.py` (Line 197)

**Current (WRONG):**
```python
total_risk = (0.5 * anomaly_component) + (0.3 * benford_risk) + (0.2 * fuzzy_component)
#            50% anomaly             + 30% benford          + 20% vendor
```

**Should Be:**
```python
total_risk = (0.5 * anomaly_component) + (0.3 * fuzzy_component) + (0.2 * benford_risk)
#            50% anomaly             + 30% vendor           + 20% benford
```

**Impact:** Swapped fuzzy and benford weights, causing vendor matching to be underweighted and benford overweighted.

---

### Issue 2: Incorrect Calculation Logic in `report_service.py` (Lines 33-53)

**Current (WRONG):**
```python
# Anomalies contribution (40%)
anomaly_ratio = len(anomalies) / total_records
score += min(anomaly_ratio * 100, 40)  # WRONG: multiplies ratio by 100

# Example: 50 anomalies / 5280 records = 0.00946
# Then: 0.00946 * 100 = 0.946
# Should contribute to 40% weight as: 0.00946 * 40 = 0.378
```

**Issue:** This function multiplies percentages by 100 multiple times without proper scaling. Should be deprecated in favor of the newer method used in audit_service.py.

---

### Issue 3: Wrong Divisor in Old `RiskBreakdown.jsx` (Line 31)

**Current (WRONG):**
```javascript
const vendorScore = (fuzzyMatchCount / Math.max(anomalies?.length || 1, 1)) * 30
//                 Dividing by anomalies count instead of total records!
```

**Should Be:**
```javascript
const vendorScore = (fuzzyMatchCount / total_records) * 100
// Then normalized/clamped to 0-100
```

**Impact:** With 30 fuzzy matches and 50 anomalies: (30/50)*30 = 18 ❌
Correct: (30/5280)*100 = 0.567% ✅

---

### Issue 4: Benford Risk Directly Used as Percentage (Line 48)

**Current Logic:**
- Benford risk is calculated as a percentage directly from chi-square test
- Already in 0-100 range
- Should NOT be multiplied by weight in per-transaction calculation

**Inconsistency:** Benford is ledger-wide, not per-transaction. Should be applied uniformly.

---

## Calculation Flow (CORRECT)

### Per-Transaction Risk Score:
```
total_risk = (anomaly_score × 0.50) + (vendor_score × 0.30) + (benford_score × 0.20)

Where:
  - anomaly_score = per-transaction anomaly detection score (0-100)
  - vendor_score = per-transaction vendor matching score (0-100)
  - benford_score = ledger-wide Benford risk (0-100)
```

### Summary-Level Risk (Dashboard):
```
anomaly_rate% = (flagged_records / total_records) × 100
vendor_rate% = (fuzzy_match_count / total_records) × 100
benford_risk% = chi-square based calculation (already 0-100)
```

### Expected Outputs (from CSV):
```
Total Transactions: 5,280
Anomalies: 50 → 0.95% rate
Ghost Vendors: 30 → 0.57% rate
Benford Violations: 200 → 3.79% rate
```

---

## Files to Fix

1. **`backend/app/services/audit_service.py`** (Line 197)
   - Fix: Change weight order from (0.5, 0.3, 0.2) to (0.5, 0.3, 0.2) with correct component mapping

2. **`backend/app/services/report_service.py`** (Lines 33-53)
   - Fix: Completely rewrite or deprecate this function
   - This function is calculating per-transaction risk from summary data - conceptually wrong

3. **`frontend/src/components/RiskBreakdown.jsx`** (Line 31)
   - Status: Already fixed in Results.jsx with correct total_records divisor

4. **`backend/app/api/routes.py`** (Upload endpoint)
   - Verify it's using correct calculation logic

---

## Verification

After fixes, running on synthetic CSV should produce:
- ✅ Anomaly Rate: ~0.95% (not 2.33%)
- ✅ Vendor Duplicate Rate: ~0.57% (not 1.2%)
- ✅ Benford Violations: ~3.79% (close to 4.1%)

