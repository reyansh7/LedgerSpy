#!/usr/bin/env python3
"""
Benford's Law Implementation - Verification Script

Runs quick checks to verify the implementation is working correctly
before integration into the backend API.
"""

import sys
import pandas as pd
import numpy as np

def check_import():
    """Verify the module can be imported."""
    print("✓ Checking if benford_corrected can be imported...")
    try:
        from benford_corrected import BenfordAnalyzer, analyze_benford_law
        print("  ✅ Import successful")
        return BenfordAnalyzer, analyze_benford_law
    except ImportError as e:
        print(f"  ❌ Import failed: {e}")
        return None, None

def check_class_methods(analyzer_class):
    """Verify the class has all required methods."""
    print("\n✓ Checking class methods...")
    
    required_methods = [
        'analyze',
        'analyze_with_details',
        'get_first_digit',
        'extract_first_digits',
        'compute_benford_distribution',
        'calculate_deviation',
        'calculate_benford_risk',
        'get_risk_interpretation'
    ]
    
    analyzer = analyzer_class()
    missing = []
    
    for method in required_methods:
        if hasattr(analyzer, method):
            print(f"  ✅ {method}")
        else:
            print(f"  ❌ {method} - MISSING")
            missing.append(method)
    
    return len(missing) == 0

def check_basic_analysis():
    """Run a quick analysis on sample data."""
    print("\n✓ Running basic analysis on sample data...")
    try:
        from benford_corrected import BenfordAnalyzer
        
        # Create sample data
        df = pd.DataFrame({
            'amount': [1200, 1500, 2100, 3200, 5000, 6800, 9100, 10500]
        })
        
        analyzer = BenfordAnalyzer()
        result = analyzer.analyze(df)
        
        # Check required fields
        required_fields = [
            'expected', 'observed', 'deviation', 'risk_score', 
            'interpretation', 'chi_square', 'p_value', 
            'is_benford_compliant', 'total_analyzed', 'total_skipped'
        ]
        
        missing_fields = []
        for field in required_fields:
            if field in result:
                print(f"  ✅ {field}: {result[field]}")
            else:
                print(f"  ❌ {field} - MISSING")
                missing_fields.append(field)
        
        return len(missing_fields) == 0
        
    except Exception as e:
        print(f"  ❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_with_details():
    """Check analyze_with_details method."""
    print("\n✓ Checking analyze_with_details method...")
    try:
        from benford_corrected import BenfordAnalyzer
        
        df = pd.DataFrame({
            'amount': [1200, 1500, 2100, 3200, 5000, 6800, 9100, 10500]
        })
        
        analyzer = BenfordAnalyzer()
        result = analyzer.analyze_with_details(df)
        
        if 'digit_details' not in result:
            print("  ❌ digit_details - MISSING")
            return False
        
        if len(result['digit_details']) != 9:
            print(f"  ❌ Expected 9 digits, got {len(result['digit_details'])}")
            return False
        
        print(f"  ✅ digit_details: {len(result['digit_details'])} digits")
        return True
        
    except Exception as e:
        print(f"  ❌ Check failed: {e}")
        return False

def check_edge_cases():
    """Test edge case handling."""
    print("\n✓ Testing edge case handling...")
    try:
        from benford_corrected import BenfordAnalyzer
        
        test_cases = [
            ('Decimals', pd.DataFrame({'amount': [1.5, 2.3, 3.7]})),
            ('Negative', pd.DataFrame({'amount': [-100, -250, -500]})),
            ('Mixed', pd.DataFrame({'amount': [100, -200, 0.5, np.nan]})),
            ('Large', pd.DataFrame({'amount': [1e6, 2e6, 3e6]})),
        ]
        
        analyzer = BenfordAnalyzer()
        
        for name, df in test_cases:
            try:
                result = analyzer.analyze(df)
                print(f"  ✅ {name}: risk_score={result['risk_score']}")
            except Exception as e:
                print(f"  ❌ {name}: {e}")
                return False
        
        return True
        
    except Exception as e:
        print(f"  ❌ Edge case test failed: {e}")
        return False

def check_risk_scoring():
    """Verify risk scoring produces reasonable values."""
    print("\n✓ Checking risk score calculation...")
    try:
        from benford_corrected import BenfordAnalyzer
        
        analyzer = BenfordAnalyzer()
        
        # Test: low risk (normal data)
        normal_data = pd.DataFrame({
            'amount': [1200, 1500, 2100, 3200, 5000, 6800, 9100, 10500,
                      1300, 2200, 3300, 4400, 5500, 6600, 7700]
        })
        normal_result = analyzer.analyze(normal_data)
        normal_risk = normal_result['risk_score']
        
        # Test: high risk (biased data)
        biased_data = pd.DataFrame({
            'amount': [9100, 9200, 9300, 9400, 9500, 9600, 9700, 9800,
                      91000, 92000, 93000, 94000, 95000, 96000, 97000]
        })
        biased_result = analyzer.analyze(biased_data)
        biased_risk = biased_result['risk_score']
        
        print(f"  ✅ Normal data risk: {normal_risk} (expected: 0-30)")
        print(f"  ✅ Biased data risk: {biased_risk} (expected: 50-100)")
        
        # Risk scores should be different
        if abs(normal_risk - biased_risk) < 10:
            print(f"  ⚠️  Warning: Risk scores too similar ({normal_risk} vs {biased_risk})")
            return False
        
        return True
        
    except Exception as e:
        print(f"  ❌ Risk scoring test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_interpretation():
    """Verify risk interpretation function."""
    print("\n✓ Checking risk interpretation...")
    try:
        from benford_corrected import BenfordAnalyzer
        
        analyzer = BenfordAnalyzer()
        
        test_cases = [
            (10, "Low Risk"),
            (30, "Medium Risk"),
            (50, "Elevated Risk"),
            (70, "High Risk"),
            (90, "Critical Risk"),
        ]
        
        for risk_score, expected_interp in test_cases:
            interp = analyzer.get_risk_interpretation(risk_score)
            if interp == expected_interp:
                print(f"  ✅ Score {risk_score}: {interp}")
            else:
                print(f"  ❌ Score {risk_score}: Got '{interp}', expected '{expected_interp}'")
                return False
        
        return True
        
    except Exception as e:
        print(f"  ❌ Interpretation test failed: {e}")
        return False

def check_first_digit_extraction():
    """Verify first digit extraction."""
    print("\n✓ Checking first digit extraction...")
    try:
        from benford_corrected import BenfordAnalyzer
        
        analyzer = BenfordAnalyzer()
        
        test_cases = [
            (1200, 1),
            (0.0045, 4),
            (150000, 1),
            (-500, 5),
            (0, None),
            (np.nan, None),
        ]
        
        for value, expected_digit in test_cases:
            result = analyzer.get_first_digit(value)
            if result == expected_digit:
                print(f"  ✅ {value} → {result}")
            else:
                print(f"  ❌ {value} → Got {result}, expected {expected_digit}")
                return False
        
        return True
        
    except Exception as e:
        print(f"  ❌ First digit extraction test failed: {e}")
        return False

def main():
    """Run all verification checks."""
    print("="*70)
    print("BENFORD'S LAW IMPLEMENTATION - VERIFICATION SCRIPT")
    print("="*70)
    
    checks = [
        ("Module Import", lambda: check_import()[0] is not None),
        ("Class Methods", lambda: check_class_methods(check_import()[0])),
        ("First Digit Extraction", check_first_digit_extraction),
        ("Risk Score Calculation", check_risk_scoring),
        ("Risk Interpretation", check_interpretation),
        ("Basic Analysis", check_basic_analysis),
        ("Detailed Analysis", check_with_details),
        ("Edge Case Handling", check_edge_cases),
    ]
    
    results = []
    
    for check_name, check_func in checks:
        try:
            result = check_func()
            results.append((check_name, result))
        except Exception as e:
            print(f"\n❌ {check_name} crashed: {e}")
            import traceback
            traceback.print_exc()
            results.append((check_name, False))
    
    # Summary
    print("\n" + "="*70)
    print("VERIFICATION SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for check_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {check_name}")
    
    print("="*70)
    print(f"Results: {passed}/{total} checks passed")
    print("="*70)
    
    if passed == total:
        print("\n✅ ALL VERIFICATION CHECKS PASSED!")
        print("The implementation is ready for integration.")
        return 0
    else:
        print(f"\n❌ {total - passed} checks failed.")
        print("Please review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
