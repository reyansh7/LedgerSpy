"""
Benford's Law Analysis Service
Detects fraudulent patterns using Benford's Law on first-digit distribution
"""
import numpy as np
from collections import Counter

BENFORD_DISTRIBUTION = {
    1: 0.301, 2: 0.176, 3: 0.125, 4: 0.097,
    5: 0.079, 6: 0.067, 7: 0.058, 8: 0.051, 9: 0.046
}

def analyze_benford(values):
    """
    Analyze values against Benford's Law
    Returns deviation score (0 = perfect match, 1 = completely different)
    """
    first_digits = [int(str(abs(int(v))).lstrip('-')[0]) for v in values if v != 0]
    
    if not first_digits:
        return None
    
    observed = Counter(first_digits)
    total = len(first_digits)
    
    chi_square = 0
    for digit, expected_prob in BENFORD_DISTRIBUTION.items():
        observed_prob = observed.get(digit, 0) / total
        expected_count = expected_prob * total
        observed_count = observed.get(digit, 0)
        
        if expected_count > 0:
            chi_square += ((observed_count - expected_count) ** 2) / expected_count
    
    return chi_square
