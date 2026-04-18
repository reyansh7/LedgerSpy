"""
Benford's Law Utility Functions
"""
import math
from collections import Counter

BENFORD_DIST = {
    1: 0.301, 2: 0.176, 3: 0.125, 4: 0.097, 5: 0.079,
    6: 0.067, 7: 0.058, 8: 0.051, 9: 0.046
}

def get_first_digit(n):
    """Extract first digit from number"""
    if n == 0:
        return None
    return int(str(abs(int(n)))[0])

def analyze_dataset(data):
    """
    Analyze dataset against Benford's Law
    Returns chi-square statistic and p-value
    """
    first_digits = [get_first_digit(x) for x in data if get_first_digit(x)]
    
    if not first_digits:
        return None, None
    
    observed = Counter(first_digits)
    total = len(first_digits)
    
    chi_square = 0
    for digit in range(1, 10):
        expected = BENFORD_DIST[digit] * total
        observed_count = observed.get(digit, 0)
        chi_square += ((observed_count - expected) ** 2) / expected
    
    # Simple p-value approximation
    from scipy.stats import chi2
    p_value = 1 - chi2.cdf(chi_square, 8)
    
    return chi_square, p_value

def is_benford_compliant(chi_square, threshold=15.5):
    """Check if data is Benford compliant"""
    return chi_square < threshold
