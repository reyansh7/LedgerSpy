# Integration Guide: Going Concern & Industry Benchmarking

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LedgerSpy Backend (FastAPI)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐    ┌─────────────────────────────┐ │
│  │ Going Concern Module │    │ Industry Benchmarking Module│ │
│  ├──────────────────────┤    ├─────────────────────────────┤ │
│  │ • Monte Carlo Engine │    │ • Sector Benchmarks Library │ │
│  │ • Statistics Calc    │    │ • Ratio Analysis            │ │
│  │ • Risk Classification│    │ • Risk Scoring Engine       │ │
│  │ • Percentile Analysis│    │ • Comparison Reports        │ │
│  └──────────────────────┘    └─────────────────────────────┘ │
│                                                               │
│  ┌──────────────────────┐    ┌─────────────────────────────┐ │
│  │  /api/audit/going-   │    │ /api/audit/industry-        │ │
│  │  concern/*           │    │ benchmark/*                 │ │
│  └──────────────────────┘    └─────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
              ▲                                ▲
              │ HTTP/JSON                      │ HTTP/JSON
              │                                │
┌─────────────────────────────────────────────────────────────┐
│              LedgerSpy Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐    ┌─────────────────────────────┐ │
│  │GoingConcernStressTest│    │IndustryBenchmarkComparison  │ │
│  ├──────────────────────┤    ├─────────────────────────────┤ │
│  │ • Probability Chart  │    │ • Comparison Charts         │ │
│  │ • Scenario Bands     │    │ • Risk Score Gauge          │ │
│  │ • Distribution View  │    │ • Metric Details            │ │
│  │ • Key Metrics       │    │ • Radar Chart               │ │
│  │ • Recommendations    │    │ • Recommendations           │ │
│  └──────────────────────┘    └─────────────────────────────┘ │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │         Results.jsx (Results Page)                     │   │
│  │ - Integrates both components                          │   │
│  │ - Displays in sequential sections                     │   │
│  │ - Allows industry selection                           │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Going Concern Analysis Flow

```
Transaction Data (CSV)
         │
         ▼
┌─────────────────────┐
│ Upload & Validate   │
└─────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ LedgerSpy Core Analysis         │
│ (Anomalies, Benford, etc.)      │
└─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ GoingConcernAnalyzer.analyze_cash_flow()     │
│  1. Extract statistics from transactions     │
│  2. Run 10,000 Monte Carlo simulations       │
│  3. Calculate percentiles (P5, P25, P50...)  │
│  4. Classify risk level (SAFE, AT_RISK...)   │
└──────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ /api/audit/going-concern    │
│ Returns JSON Results        │
└─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ React Component Renders          │
│ - Probability gauge              │
│ - Scenario bands pie chart       │
│ - Distribution bar charts        │
│ - Audit recommendation           │
└──────────────────────────────────┘
```

### Industry Benchmarking Flow

```
Company Audit Results
├─ Anomaly Rate (%)
├─ Duplicate Vendor Rate (%)
├─ Benford Violation (bool)
├─ Network Loops (count)
├─ Error Amount ($)
└─ Total Transactions (count)
         │
         ▼
┌───────────────────────────────────┐
│ Industry Selection (Frontend)      │
│ • Technology                       │
│ • Finance                          │
│ • Retail                           │
│ • Manufacturing                    │
│ • Healthcare                       │
│ • Government                       │
└───────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ IndustryBenchmarker.compare_metrics()         │
│ 1. Load sector benchmarks                     │
│ 2. Calculate ratios (company/benchmark)       │
│ 3. Determine percentiles                      │
│ 4. Assess each metric                         │
│ 5. Calculate overall risk score               │
│ 6. Generate recommendations                   │
└──────────────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────┐
│ /api/audit/industry-benchmark     │
│ Returns JSON with:                │
│ • Metric comparisons              │
│ • Risk assessment                 │
│ • Recommendations                 │
└───────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ React Component Renders          │
│ - Overview cards                 │
│ - Comparison bar chart           │
│ - Radar chart                    │
│ - Risk score gauge               │
│ - Recommendations list           │
└──────────────────────────────────┘
```

## API Endpoints

### Going Concern Endpoints

#### POST `/api/audit/going-concern/analyze`
Perform Monte Carlo going concern stress test.

**Request:**
```json
{
  "audit_id": "audit_12345",
  "starting_balance": 100000,
  "min_required_balance": 10000,
  "num_simulations": 10000,
  "forecast_months": 12
}
```

**Response:**
```json
{
  "survival_probability": 92.5,
  "risk_level": "MODERATE",
  "risk_color": "yellow",
  "scenario_bands": {
    "critical": {
      "range": "$5,000 - $25,000",
      "probability": "5.0%",
      "color": "red"
    },
    "danger": { ... },
    "caution": { ... },
    "safe": { ... }
  },
  "ending_balance_stats": {
    "p5": 15000,
    "p25": 45000,
    "p50_median": 95000,
    "p75": 145000,
    "p95": 185000,
    "mean": 105000,
    "std": 32000
  },
  "recommendation": "⚠️ Going concern assumption is REASONABLE with moderate stress..."
}
```

#### GET `/api/audit/going-concern/sample`
Get sample going concern data for demonstration.

### Industry Benchmarking Endpoints

#### POST `/api/audit/industry-benchmark/compare`
Compare company metrics against industry benchmarks.

**Request:**
```json
{
  "audit_id": "audit_12345",
  "industry": "technology",
  "anomaly_rate": 2.5,
  "duplicate_vendor_rate": 1.2,
  "benford_violation": true,
  "network_loops": 1,
  "error_amount": 3000,
  "total_transactions": 5000
}
```

**Response:**
```json
{
  "industry": "technology",
  "metrics": {
    "anomaly_rate": {
      "company": 2.5,
      "benchmark": 2.1,
      "ratio": 1.19,
      "percentile": "⚠️ Below 50% (Concerning)",
      "assessment": "SLIGHTLY ABOVE INDUSTRY",
      "color": "yellow"
    },
    "duplicate_vendor_rate": { ... },
    "benford_violation": { ... },
    "network_loops": { ... },
    "error_amount": { ... }
  },
  "overall_risk": {
    "score": 42.5,
    "level": "ELEVATED",
    "color": "yellow"
  },
  "recommendations": [
    "⚠️ Elevated vendor duplicates: Implement vendor master data cleanup",
    "📊 Benford violation detected: Investigate for potential manipulation..."
  ]
}
```

#### GET `/api/audit/industry-benchmark/sample`
Get sample benchmarking data with optional industry parameter.

**Query Parameters:**
- `industry`: string (default: "technology")

#### GET `/api/audit/industry-benchmark/industries`
List all supported industries.

## Component Integration

### Results Page Structure

```jsx
<Results>
  ├─ Header Section
  │  ├─ Overall Risk Score
  │  └─ File Summary
  │
  ├─ Stat Cards (4-column grid)
  │  ├─ Total Records
  │  ├─ Flagged Records
  │  ├─ Benford Risk
  │  └─ Vendor Match Alerts
  │
  ├─ Main Analysis Charts
  │  ├─ Benford Distribution
  │  ├─ Fuzzy Match Results
  │  ├─ Risk Distribution
  │  └─ Transaction Details
  │
  ├─ Advanced Components
  │  ├─ Data Integrity Dashboard
  │  ├─ Vendor Similarity Detection
  │  ├─ Explainable AI Panel
  │  ├─ Risk Breakdown
  │  └─ Bank Reconciliation
  │
  ├─ **NEW: Going Concern Stress Test** ⭐
  │
  ├─ **NEW: Industry Benchmarking** ⭐
  │  └─ Industry Selector
  │
  └─ Audit Report Generator
```

## Usage Workflow

### For Auditors

**Step 1: Upload Transaction Data**
- User uploads CSV with transaction records
- System validates and processes data

**Step 2: View Initial Results**
- Dashboard shows anomalies, Benford analysis, vendor issues
- Overall risk score displayed

**Step 3: Run Going Concern Analysis**
- Click to view Going Concern Stress Test section
- Review survival probability and scenario bands
- Assess 12-month cash flow forecast

**Step 4: Benchmark Against Industry**
- Select company's industry sector
- Review metric comparisons
- Identify areas of concern vs. peers

**Step 5: Generate Audit Report**
- Use included findings in management letter
- Document conclusions in working papers
- Include recommendations

### For Management

**Step 1: Receive Audit Report**
- Going concern assessment included
- Industry benchmarking results provided

**Step 2: Review Findings**
- Understand cash flow risk
- See how company compares to peers
- Identify control improvement opportunities

**Step 3: Implement Changes**
- Address recommendations from benchmarking
- Improve vendor data quality
- Strengthen controls identified as weak

## Configuration

### Backend Configuration

**File**: `ml/ledgerspy_engine/industry_benchmarking.py`

Modify `INDUSTRY_BENCHMARKS` dictionary to:
- Add new industries
- Update benchmark values based on new data
- Adjust sample sizes

**File**: `ml/ledgerspy_engine/going_concern.py`

Parameters in `GoingConcernAnalyzer`:
- `num_simulations`: Monte Carlo run count (higher = more accurate, slower)
- `forecast_months`: Projection horizon (typically 12 for year-end audits)

### Frontend Configuration

**File**: `frontend/src/pages/Results.jsx`

State management:
```jsx
const [selectedIndustry, setSelectedIndustry] = useState('technology')
const [goingConcernData, setGoingConcernData] = useState(null)
const [industryBenchmarkData, setIndustryBenchmarkData] = useState(null)
```

## Performance Considerations

### Going Concern Analysis
- **Runtime**: ~2-5 seconds (10,000 simulations)
- **Memory**: ~100-200 MB (temporary)
- **Scalability**: Linear with simulation count

### Industry Benchmarking
- **Runtime**: <100 ms (all calculations in-memory)
- **Memory**: ~10 MB (benchmark data cached)
- **Scalability**: O(1) - constant time regardless of dataset size

### Optimization Tips

1. **Cache Benchmark Data**: Pre-load on app startup
2. **Lazy Load**: Fetch going concern data only when section scrolls into view
3. **Batch Simulations**: If running multiple companies, process in parallel
4. **Client-Side Rendering**: Offload chart rendering to browser

## Testing

### Unit Tests

```python
# Test going concern analyzer
def test_going_concern_analysis():
    analyzer = GoingConcernAnalyzer(num_simulations=1000)
    result = analyzer.analyze_cash_flow(
        sample_df,
        starting_balance=100000,
        min_required_balance=10000
    )
    assert 0 <= result['survival_probability'] <= 100
    assert result['risk_level'] in ['SAFE', 'MODERATE', 'AT_RISK', 'CRITICAL']

# Test industry benchmarking
def test_industry_benchmarking():
    benchmarker = IndustryBenchmarker(industry='technology')
    result = benchmarker.compare_metrics({
        'anomaly_rate': 2.5,
        'duplicate_vendor_rate': 1.2,
        ...
    })
    assert 0 <= result['overall_risk']['score'] <= 100
```

## Troubleshooting

### Issue: Going Concern data not loading

**Solution**:
1. Check transaction data has valid timestamps and amounts
2. Verify `/api/audit/going-concern/sample` endpoint returns data
3. Check browser console for API errors

### Issue: Industry Benchmarking shows wrong metrics

**Solution**:
1. Verify industry selector matches company's actual sector
2. Confirm metrics are being passed correctly from parent component
3. Check `INDUSTRY_BENCHMARKS` dictionary has sector data

### Issue: Components not appearing in Results

**Solution**:
1. Verify components are imported in Results.jsx
2. Check advanced_audit router is included in FastAPI app
3. Review browser dev tools for React errors

## Future Enhancements

1. **Custom Benchmarks**: Allow organizations to create private benchmarks
2. **Trend Analysis**: Track company vs. industry over time
3. **Scenario Planning**: Let users adjust parameters for what-if analysis
4. **Export Reports**: Generate PDF audit reports with findings
5. **Integration**: Connect to accounting software APIs (Xero, QuickBooks)
6. **Machine Learning**: Improve anomaly detection using benchmarking data
