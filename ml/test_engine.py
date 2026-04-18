"""
Test script to run the enhanced LedgerSpy engine on sample transaction data.
Tests all improvements: anomaly detection, vendor matching, network analysis, etc.
"""
import pandas as pd
import json
import sys
from pathlib import Path

# Add ML module to path
sys.path.insert(0, str(Path(__file__).parent))

from ledgerspy_engine.core_engine_enhanced import LedgerSpyEngine

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def test_ledger_spy():
    """Run full test of LedgerSpy on sample data"""
    
    # Load test data
    test_file = Path(__file__).parent / 'test_data.csv'
    print(f"📂 Loading test data from: {test_file}")
    
    df = pd.read_csv(test_file)
    print(f"✅ Loaded {len(df)} transactions\n")
    print(df.head(10))
    
    # Initialize engine
    print_section("🚀 INITIALIZING LEDGERSPY ENGINE")
    engine = LedgerSpyEngine(use_ensemble=True, enable_feedback=True)
    print("✅ Engine initialized with ensemble anomaly detection enabled")
    print("✅ Feedback collection enabled")
    
    # Run full audit
    print_section("🔍 RUNNING FULL AUDIT")
    print("Analyzing transactions for:")
    print("  • Anomalies (ensemble: Isolation Forest + Robust Covariance)")
    print("  • Vendor duplicates (string + phonetic matching)")
    print("  • Benford's Law violations")
    print("  • Network loops & unusual patterns")
    print("  • Adaptive risk scoring")
    print()
    
    results = engine.run_full_audit(df, collect_feedback=True)
    
    # ===== AUDIT SUMMARY =====
    print_section("📊 AUDIT SUMMARY")
    audit_summary = results['audit_summary']
    print(f"Total Transactions:   {audit_summary['total_transactions']}")
    print(f"Readiness Score:      {audit_summary['readiness_score']}%")
    print(f"Data Quality:         {audit_summary['data_quality']}")
    print(f"Completeness:         {audit_summary['readiness_report']['completeness']}")
    
    # ===== ANOMALY DETECTION RESULTS =====
    print_section("🚨 ANOMALY DETECTION RESULTS")
    anomalies = results['anomaly_detection']
    print(f"Anomalies Detected:   {anomalies['anomalies_detected']}")
    print(f"Anomaly Rate:         {anomalies['anomaly_percentage']}%")
    print(f"Model Type:           {anomalies['model_type']}")
    print(f"Contamination Assumption: {anomalies['contamination_assumption']}")
    
    # ===== VENDOR MATCHING =====
    print_section("🏢 SUSPICIOUS VENDOR MATCHING")
    vendors = results['vendor_matching']
    print(f"Total Suspicious Pairs: {vendors['total_suspicious_pairs']}")
    print(f"Analysis Type:         {vendors['analysis_type']}\n")
    
    if vendors['suspicious_pairs']:
        print("TOP SUSPICIOUS VENDOR PAIRS:")
        for i, pair in enumerate(vendors['suspicious_pairs'][:5], 1):
            print(f"\n{i}. {pair['vendor_1']} ↔ {pair['vendor_2']}")
            print(f"   Similarity Score:  {pair['risk_score']}%")
            print(f"   String Similarity: {pair['base_string_similarity']}%")
            if pair['phonetic_similarity'] is not None:
                print(f"   Phonetic Match:    {pair['phonetic_similarity']}%")
            print(f"   Risk Level:        {pair['fraud_risk']}")
    
    # ===== BENFORD'S LAW ANALYSIS =====
    print_section("📈 BENFORD'S LAW ANALYSIS")
    benford = results['benford_analysis']
    if 'error' not in benford:
        print(f"Compliance Status:     {'✅ COMPLIANT' if benford['is_compliant'] else '⚠️ VIOLATION'}")
        print(f"Chi-Square Statistic:  {benford['chi_square_stat']:.4f}")
        print(f"P-Value:              {benford['p_value']:.4f}")
        print(f"Total Analyzed:       {benford['total_analyzed']}")
        print(f"Confidence:           {benford['compliance_confidence']:.1f}%")
        
        if benford['anomaly_patterns']:
            print(f"\n⚠️ DETECTED PATTERNS:")
            for pattern in benford['anomaly_patterns'][:3]:
                print(f"  • Digit {pattern['digit']}: {pattern['pattern']}")
                print(f"    {pattern['reason']}")
                print(f"    Fraud Risk: {pattern['fraud_risk']}")
        
        print(f"\nFIRST DIGIT DISTRIBUTION:")
        for digit in range(1, 10):
            dist = benford['digit_distribution'][digit]
            expected = dist['expected_pct']
            observed = dist['observed_pct']
            bar = '█' * int(observed / 5)
            print(f"  {digit}: Expected {expected:5.1f}% | Observed {observed:5.1f}% | {bar}")
    
    # ===== NETWORK ANALYSIS =====
    print_section("🕸️ NETWORK ANALYSIS - CIRCULAR LOOPS")
    network = results['network_analysis']
    print(f"Total Entities:       {network['total_entities']}")
    print(f"Circular Loops:       {network['circular_loops_detected']}")
    
    if network['loops']:
        print(f"\n🔴 TOP SUSPICIOUS LOOPS:")
        for i, loop in enumerate(network['loops'][:3], 1):
            print(f"\n{i}. Entities: {' → '.join(loop['entities_involved'])} → {loop['entities_involved'][0]}")
            print(f"   Hop Count:     {loop['hop_count']}")
            print(f"   Risk Level:    {loop['risk_level']}")
            print(f"   Total Amount:  ${loop['total_loop_amount']:,.2f}")
            if loop.get('loop_time_span_hours'):
                print(f"   Time Span:     {loop['loop_time_span_hours']} hours")
            if loop.get('is_rapid_cycle'):
                print(f"   ⚠️ RAPID CYCLE DETECTED (< 24 hours)")
            print(f"   Fraud Probability: {loop.get('fraud_probability', 'N/A')}%")
    
    print(f"\nHIGH-VELOCITY EDGES (Shell Company Network):")
    if network['high_velocity_edges']:
        for i, edge in enumerate(network['high_velocity_edges'][:3], 1):
            print(f"\n{i}. {edge['source']} → {edge['destination']}")
            print(f"   Transaction Count: {edge['transaction_count']}")
            print(f"   Total Amount:      ${edge['total_amount']:,.2f}")
            print(f"   Average Amount:    ${edge['average_amount']:,.2f}")
            print(f"   Risk Level:        {edge['risk_level']}")
    
    # ===== RISK SCORING =====
    print_section("⚙️ ADAPTIVE RISK SCORING")
    risk_scoring = results['risk_scoring']
    print(f"Adaptive Mode:        {'✅ YES (trained on data)' if risk_scoring['is_adaptive'] else '❌ NO (hardcoded weights)'}")
    
    weights = risk_scoring['learned_weights']
    print(f"\nLEARNED RISK WEIGHTS:")
    print(f"  • Anomaly Detection:  {weights.get('anomaly', 'N/A')}")
    print(f"  • Vendor Matching:    {weights.get('vendor_matching', 'N/A')}")
    print(f"  • Benford's Law:      {weights.get('benford_law', 'N/A')}")
    
    # ===== SUMMARY STATISTICS =====
    print_section("📋 SUMMARY STATISTICS")
    print(f"✅ Total Anomalies:           {anomalies['anomalies_detected']}/{len(df)} ({anomalies['anomaly_percentage']:.1f}%)")
    print(f"🏢 Duplicate Vendors:         {vendors['total_suspicious_pairs']} pairs")
    print(f"🕸️  Circular Loops:           {network['circular_loops_detected']}")
    print(f"📊 Benford Compliance:        {'✅ PASS' if benford.get('is_compliant', True) else '❌ FAIL'}")
    print(f"💾 Feedback Collected:        {'✅ YES' if results.get('feedback_ready') else '❌ NO'}")
    
    # ===== RECOMMENDATIONS =====
    print_section("🎯 AUDIT RECOMMENDATIONS")
    recommendations = []
    
    if anomalies['anomalies_detected'] > 0:
        recommendations.append(f"🚨 {anomalies['anomalies_detected']} anomalous transactions detected - REVIEW IMMEDIATELY")
    
    if vendors['total_suspicious_pairs'] > 0:
        recommendations.append(f"🏢 {vendors['total_suspicious_pairs']} suspicious vendor pairs - potential shell companies")
    
    if network['circular_loops_detected'] > 0:
        recommendations.append(f"🕸️  {network['circular_loops_detected']} circular money flows - potential money laundering")
    
    if benford.get('anomaly_patterns'):
        recommendations.append(f"📈 Benford's Law violations - possible data manipulation")
    
    if recommendations:
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec}")
    else:
        print("✅ No major anomalies detected - transactions appear normal")
    
    print_section("✅ AUDIT COMPLETE")
    print(f"Test data file: {test_file}")
    print(f"Model: LedgerSpy Enhanced with Ensemble Detection")
    print(f"Processed: {len(df)} transactions")
    print()

if __name__ == "__main__":
    try:
        test_ledger_spy()
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
