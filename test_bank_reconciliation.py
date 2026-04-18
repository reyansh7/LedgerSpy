"""
Bank Reconciliation Test Script

Demonstrates how to use the bank reconciliation system with real data.

Run: python test_bank_reconciliation.py
"""

import sys
from pathlib import Path
import pandas as pd
import json

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))
sys.path.insert(0, str(Path(__file__).parent / "ml"))

from app.services.bank_reconciliation_service import (
    BankStatementGenerator,
    TransactionReconciler,
    FraudDetector,
)


def test_bank_reconciliation():
    """Test the complete bank reconciliation workflow."""
    
    print("=" * 80)
    print("🏦 BANK RECONCILIATION TEST")
    print("=" * 80)
    
    # Step 1: Load synthetic ledger data
    print("\n[1] Loading ledger data...")
    ledger_df = pd.read_csv("ml/synthetic_ledger_data.csv")
    print(f"✓ Loaded {len(ledger_df)} transactions")
    print(f"  Columns: {list(ledger_df.columns)}")
    print(f"  Amount range: ₹{ledger_df['amount'].min():.2f} - ₹{ledger_df['amount'].max():.2f}")
    
    # Prepare data
    ledger_df['amount'] = pd.to_numeric(ledger_df['amount'], errors='coerce')
    ledger_df['timestamp'] = pd.to_datetime(ledger_df['timestamp'], errors='coerce')
    ledger_df = ledger_df.dropna(subset=['transaction_id', 'amount', 'destination_entity'])
    
    # Step 2: Generate synthetic bank statement
    print("\n[2] Generating synthetic bank statement...")
    bank_df = BankStatementGenerator.generate(ledger_df)
    print(f"✓ Generated {len(bank_df)} bank transactions")
    print(f"  Original: {len(ledger_df)} | Generated: {len(bank_df)}")
    print(f"  Missing: {len(ledger_df) - len(bank_df)} ({(len(ledger_df) - len(bank_df)) / len(ledger_df) * 100:.1f}%)")
    print(f"  Bank columns: {list(bank_df.columns)}")
    
    # Step 3: Run reconciliation
    print("\n[3] Running reconciliation...")
    reconciler = TransactionReconciler(
        vendor_threshold=0.85,
        date_tolerance_days=1,
        amount_tolerance_pct=10.0
    )
    reconciliation_results = reconciler.reconcile(ledger_df, bank_df)
    
    summary = reconciliation_results['summary']
    print(f"✓ Reconciliation complete")
    print(f"  Total transactions: {summary['total_transactions']}")
    print(f"  Matched: {summary['matched']} ({summary['matched']/summary['total_transactions']*100:.1f}%)")
    print(f"  Partial Match: {summary['partial_match']} ({summary['partial_match']/summary['total_transactions']*100:.1f}%)")
    print(f"  Missing/Extra: {summary['missing_or_extra']} ({summary['missing_or_extra']/summary['total_transactions']*100:.1f}%)")
    print(f"  Reconciliation Rate: {summary['reconciliation_rate']:.1f}%")
    
    # Step 4: Fraud detection
    print("\n[4] Running fraud detection...")
    enhanced_results = FraudDetector.detect_anomalies(ledger_df, reconciliation_results['results'])
    
    high_risk = [r for r in enhanced_results if r.get('risk_score', 0) > 50]
    print(f"✓ Fraud analysis complete")
    print(f"  High risk (>50): {len(high_risk)}")
    print(f"  Average risk score: {sum(r.get('risk_score', 0) for r in enhanced_results) / len(enhanced_results):.1f}/100")
    
    # Count fraud flags
    flag_counts = {}
    for result in enhanced_results:
        for flag in result.get('fraud_flags', []):
            flag_counts[flag] = flag_counts.get(flag, 0) + 1
    
    print(f"  Fraud flags breakdown:")
    for flag, count in sorted(flag_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"    - {flag}: {count}")
    
    # Step 5: Benford's Law analysis
    print("\n[5] Benford's Law analysis...")
    benford_analysis = FraudDetector.generate_benford_analysis(enhanced_results)
    
    distribution = benford_analysis['first_digit_distribution']
    print(f"✓ First digit distribution:")
    print(f"\n{'Digit':<10} {'Count':<10} {'Actual %':<12} {'Expected %':<12} {'Deviation'}")
    print("-" * 60)
    
    for digit in range(1, 10):
        data = distribution[str(digit)]
        deviation = abs(data['percentage'] - data['benford_expected'])
        print(f"{digit:<10} {data['count']:<10} {data['percentage']:<12.1f} {data['benford_expected']:<12.1f} {deviation:+.1f}%")
    
    # Step 6: Sample high-risk transactions
    print("\n[6] Sample HIGH-RISK transactions...")
    print(f"\n{'TX ID':<15} {'Status':<15} {'Risk':<8} {'Flags':<40}")
    print("-" * 80)
    
    for result in enhanced_results[:5]:
        if result.get('risk_score', 0) > 30:
            flags = ', '.join(result.get('fraud_flags', [])[:2])
            tx_id = result.get('transaction_id', result.get('bank_txn_id', '-'))
            print(f"{str(tx_id):<15} {result['status']:<15} {result.get('risk_score', 0):<8.0f} {flags:<40}")
    
    # Step 7: Sample matched transactions
    print("\n[7] Sample MATCHED transactions...")
    print(f"\n{'TX ID':<15} {'Ledger Amt':<15} {'Bank Amt':<15} {'Vendor':<30}")
    print("-" * 75)
    
    matched = [r for r in enhanced_results if r['status'] == 'Matched']
    for result in matched[:5]:
        vendor = result.get('ledger_vendor', '-')[:28]
        print(f"{result['transaction_id']:<15} ₹{result['ledger_amount']:<14.2f} ₹{result['bank_amount']:<14.2f} {vendor:<30}")
    
    # Step 8: Sample missing transactions
    print("\n[8] Sample MISSING transactions...")
    print(f"\n{'TX ID':<15} {'Ledger Amt':<15} {'Vendor':<40}")
    print("-" * 75)
    
    missing = [r for r in enhanced_results if r['status'] == 'Missing']
    for result in missing[:5]:
        vendor = result.get('ledger_vendor', '-')[:38]
        print(f"{result['transaction_id']:<15} ₹{result['ledger_amount']:<14.2f} {vendor:<40}")
    
    # Step 9: Export sample results
    print("\n[9] Exporting sample results...")
    
    # Export high-risk to JSON
    high_risk_export = [
        {
            'transaction_id': r.get('transaction_id', r.get('bank_txn_id')),
            'ledger_amount': r.get('ledger_amount'),
            'bank_amount': r.get('bank_amount'),
            'status': r['status'],
            'risk_score': r.get('risk_score', 0),
            'fraud_flags': r.get('fraud_flags', []),
            'explanation': r.get('explanation', ''),
        }
        for r in enhanced_results if r.get('risk_score', 0) > 50
    ]
    
    with open('high_risk_transactions.json', 'w') as f:
        json.dump(high_risk_export[:10], f, indent=2, default=str)
    
    print(f"✓ Exported {len(high_risk_export)} high-risk transactions to high_risk_transactions.json")
    
    # Step 10: Summary statistics
    print("\n" + "=" * 80)
    print("📊 FINAL SUMMARY")
    print("=" * 80)
    print(f"\nReconciliation Metrics:")
    print(f"  • Total Transactions: {summary['total_transactions']}")
    print(f"  • Successfully Matched: {summary['matched'] + summary['partial_match']} ({summary['reconciliation_rate']:.1f}%)")
    print(f"  • High Risk Transactions: {len(high_risk)}")
    print(f"  • Average Risk Score: {sum(r.get('risk_score', 0) for r in enhanced_results) / len(enhanced_results):.1f}/100")
    
    print(f"\nFraud Flags:")
    for flag, count in sorted(flag_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  • {flag}: {count} transactions")
    
    print(f"\nBenford's Law:")
    print(f"  • Transactions Analyzed: {benford_analysis['total_transactions_analyzed']}")
    print(f"  • Most Common First Digit: {max(distribution, key=lambda k: distribution[k]['count'])}")
    
    print("\n✅ Test completed successfully!")
    print("=" * 80)
    
    return enhanced_results


def demonstrate_api_usage():
    """Show how to use via API."""
    print("\n\n" + "=" * 80)
    print("📡 API USAGE EXAMPLE")
    print("=" * 80)
    
    curl_example = """
# Using the auto-reconcile endpoint (ledger only)
curl -X POST "http://localhost:8000/api/reconciliation/auto-reconcile" \\
  -F "ledger_file=@ml/synthetic_ledger_data.csv" \\
  -F "vendor_threshold=0.85" \\
  -F "date_tolerance_days=1" \\
  -F "amount_tolerance_pct=10.0"

# Python client example
import requests

with open('ml/synthetic_ledger_data.csv', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/reconciliation/auto-reconcile',
        files={'ledger_file': f},
        data={
            'vendor_threshold': 0.85,
            'date_tolerance_days': 1,
            'amount_tolerance_pct': 10.0
        }
    )

result = response.json()
print(f"Reconciliation Rate: {result['summary']['reconciliation_rate']}%")
print(f"High Risk Count: {result['summary']['high_risk_count']}")
    """
    
    print(curl_example)
    print("=" * 80)


if __name__ == "__main__":
    # Run tests
    results = test_bank_reconciliation()
    
    # Show API usage
    demonstrate_api_usage()
