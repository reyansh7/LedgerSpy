# Benford's Law API Response Format

## API Endpoint

```
POST /api/benford
Content-Type: multipart/form-data

Body: 
  file: <CSV file with amount column>
```

## Success Response

### HTTP Status: 200 OK

```json
{
    "status": "success",
    "data": {
        "expected": {
            "1": 30.103,
            "2": 17.609,
            "3": 12.494,
            "4": 9.691,
            "5": 7.918,
            "6": 6.695,
            "7": 5.799,
            "8": 5.115,
            "9": 4.576
        },
        "observed": {
            "1": 28.571,
            "2": 18.367,
            "3": 12.245,
            "4": 10.204,
            "5": 8.163,
            "6": 6.122,
            "7": 5.612,
            "8": 5.306,
            "9": 5.41
        },
        "deviation": 12.45,
        "risk_score": 24.3,
        "interpretation": "Low Risk",
        "total_analyzed": 98,
        "total_skipped": 2,
        "chi_square": 3.456,
        "p_value": 0.9234,
        "is_benford_compliant": true,
        "digit_details": [
            {
                "digit": 1,
                "expected_pct": 30.103,
                "observed_pct": 28.571,
                "difference": -1.532,
                "status": "under"
            },
            {
                "digit": 2,
                "expected_pct": 17.609,
                "observed_pct": 18.367,
                "difference": 0.758,
                "status": "over"
            },
            {
                "digit": 3,
                "expected_pct": 12.494,
                "observed_pct": 12.245,
                "difference": -0.249,
                "status": "under"
            },
            {
                "digit": 4,
                "expected_pct": 9.691,
                "observed_pct": 10.204,
                "difference": 0.513,
                "status": "over"
            },
            {
                "digit": 5,
                "expected_pct": 7.918,
                "observed_pct": 8.163,
                "difference": 0.245,
                "status": "over"
            },
            {
                "digit": 6,
                "expected_pct": 6.695,
                "observed_pct": 6.122,
                "difference": -0.573,
                "status": "under"
            },
            {
                "digit": 7,
                "expected_pct": 5.799,
                "observed_pct": 5.612,
                "difference": -0.187,
                "status": "under"
            },
            {
                "digit": 8,
                "expected_pct": 5.115,
                "observed_pct": 5.306,
                "difference": 0.191,
                "status": "over"
            },
            {
                "digit": 9,
                "expected_pct": 4.576,
                "observed_pct": 5.41,
                "difference": 0.834,
                "status": "over"
            }
        ]
    }
}
```

## Error Response

### HTTP Status: 400 Bad Request / 500 Internal Server Error

```json
{
    "status": "error",
    "message": "Column 'amount' not found in DataFrame"
}
```

Or:

```json
{
    "status": "error",
    "message": "Invalid file format. Expected CSV."
}
```

---

## Response Field Definitions

### Core Metrics

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `risk_score` | float | 0-100 | Fraud risk score. Higher = more suspicious |
| `interpretation` | string | - | Risk level: "Low Risk" to "Critical Risk" |
| `deviation` | float | 0-100 | Total absolute deviation from Benford's Law |
| `chi_square` | float | ≥0 | Chi-square statistic (lower = better fit) |
| `p_value` | float | 0-1 | P-value for chi-square test (higher = more Benford-compliant) |

### Distribution Data

| Field | Type | Description |
|-------|------|-------------|
| `expected` | dict | Benford's theoretical distribution for digits 1-9 (percentages) |
| `observed` | dict | Observed distribution from your data (percentages) |
| `digit_details` | array | Per-digit breakdown with differences |

### Data Quality

| Field | Type | Description |
|-------|------|-------------|
| `total_analyzed` | int | Number of transactions analyzed |
| `total_skipped` | int | Rows with invalid data (NaN, zero, non-numeric) |
| `is_benford_compliant` | bool | Whether chi-square < critical value (true = compliant) |

---

## Risk Score Interpretation Guide

### Risk Level Colors & Actions

```
┌─────────────────────────────────────────────────────────────┐
│ Score  │ Level            │ Color   │ Recommended Action    │
├─────────────────────────────────────────────────────────────┤
│ 0-20   │ Low Risk         │ 🟢 Green│ Process normally      │
│ 20-40  │ Medium Risk      │ 🟡 Yellow│ Monitor & audit      │
│ 40-60  │ Elevated Risk    │ 🟠 Orange│ Review transactions  │
│ 60-80  │ High Risk        │ 🔴 Red   │ Flag for review      │
│ 80-100 │ Critical Risk    │ 🔴 Dark Red│ Manual investigation│
└─────────────────────────────────────────────────────────────┘
```

---

## Example Scenarios

### Scenario 1: Legitimate Business Data
```json
{
    "risk_score": 16.8,
    "interpretation": "Low Risk",
    "deviation": 7.2,
    "chi_square": 2.34,
    "p_value": 0.9678,
    "is_benford_compliant": true,
    "total_analyzed": 250,
    "total_skipped": 1
}
```
**Action**: ✅ Approve - Data looks legitimate

---

### Scenario 2: Suspicious Pattern
```json
{
    "risk_score": 71.4,
    "interpretation": "High Risk",
    "deviation": 35.8,
    "chi_square": 18.92,
    "p_value": 0.0082,
    "is_benford_compliant": false,
    "total_analyzed": 98,
    "total_skipped": 2
}
```
**Action**: 🚨 Alert - Review for fraud

---

### Scenario 3: Clear Manipulation
```json
{
    "risk_score": 94.2,
    "interpretation": "Critical Risk",
    "deviation": 62.5,
    "chi_square": 145.67,
    "p_value": 0.0000,
    "is_benford_compliant": false,
    "total_analyzed": 50,
    "total_skipped": 0
}
```
**Action**: 🚨🚨 Escalate - Likely fraudulent

---

## Digit Details Breakdown

Each digit in `digit_details` array contains:

```json
{
    "digit": 1,                    // First digit (1-9)
    "expected_pct": 30.103,        // Benford's expected percentage
    "observed_pct": 28.571,        // Your data's percentage
    "difference": -1.532,          // observed - expected
    "status": "under"              // "under", "over", or "match"
}
```

### Status Interpretation

| Status | Meaning | Example |
|--------|---------|---------|
| `under` | Fewer occurrences than expected | Suspicious: fewer legitimate transactions starting with 1 |
| `over` | More occurrences than expected | Suspicious: too many transactions starting with 9 |
| `match` | Same as expected | Good: actual matches Benford's prediction |

---

## CSV Input Format Requirements

### Minimum Required
- Column named `amount` containing numeric transaction amounts

### Valid Examples:
```csv
amount
1200.50
1500.75
2100.00
3200.25
5000.00
```

Or with additional columns:
```csv
transaction_id,date,amount,description
TX001,2024-01-01,1200.50,Invoice #001
TX002,2024-01-02,1500.75,Invoice #002
TX003,2024-01-03,2100.00,Invoice #003
```

### Supported Value Types
- ✅ Integers: `1000`
- ✅ Decimals: `1000.50`
- ✅ Scientific notation: `1e6` (1,000,000)
- ✅ Large numbers: `999999999`
- ✅ Small decimals: `0.0045`
- ✅ Negative values: `-500` (uses absolute value)

### Automatically Skipped
- ❌ Empty cells
- ❌ NaN values
- ❌ "Infinity" or infinity
- ❌ Zero values
- ❌ Non-numeric text

---

## Integration Examples

### JavaScript/React
```javascript
async function analyzeTransactions(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/benford', {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
        const { risk_score, interpretation, digit_details } = result.data;
        
        // Display risk level
        console.log(`Risk: ${interpretation} (${risk_score})`);
        
        // Chart data
        const chartData = {
            labels: digit_details.map(d => 'Digit ' + d.digit),
            expected: digit_details.map(d => d.expected_pct),
            observed: digit_details.map(d => d.observed_pct)
        };
        
        // Draw chart...
        drawBenfordChart(chartData);
    }
}
```

### Python/Backend
```python
import requests

with open('transactions.csv', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://api/benford', files=files)
    result = response.json()
    
    if result['status'] == 'success':
        data = result['data']
        print(f"Risk Score: {data['risk_score']}")
        print(f"Interpretation: {data['interpretation']}")
        
        if data['risk_score'] > 60:
            # Alert fraud team
            notify_fraud_team(data)
```

---

## Performance Notes

| Dataset Size | Processing Time |
|---------------|-----------------|
| 50 rows | ~5 ms |
| 100 rows | ~8 ms |
| 500 rows | ~25 ms |
| 1,000 rows | ~50 ms |
| 5,000 rows | ~200 ms |
| 10,000 rows | ~400 ms |

Processing is linear O(n) based on number of rows.

---

## Troubleshooting

### Response has status "error"

**"Column 'amount' not found"**
- CSV must have a column named `amount`
- Or pass `amount_column` parameter if different name

**"Invalid file format"**
- File must be CSV (comma-separated values)
- Not Excel, JSON, or other formats

**"No valid numeric data"**
- `amount` column contains non-numeric values
- Check for text instead of numbers

### Response has unexpected risk_score

**Risk score is 0?**
- Not enough valid data points
- Check for NaN, zero, or non-numeric values

**Risk score is always high?**
- Data distribution very different from Benford's
- Might be legitimate (e.g., salary data, phone numbers)

**Risk score varies between calls?**
- Different sample of data each time?
- Expected variation in sampling

---

## Further Reading

- See [BENFORD_FIXES_DETAILED.md](BENFORD_FIXES_DETAILED.md) for technical details
- See [BENFORD_INTEGRATION_GUIDE.md](BENFORD_INTEGRATION_GUIDE.md) for integration steps
- See [README_BENFORD_COMPLETE.md](README_BENFORD_COMPLETE.md) for complete reference

