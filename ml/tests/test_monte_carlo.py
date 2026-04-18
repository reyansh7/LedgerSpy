"""
Unit tests for Monte Carlo simulation logic
Tests for: percentile calculations, Benford check, scenario banding
"""
import unittest
import numpy as np
import pandas as pd
from ml.ledgerspy_engine.monte_carlo import (
    calculate_percentiles,
    get_scenario_bands,
    BENFORD_CONFIG,
    MONTE_CARLO_CONFIG,
)


class TestPercentileCalculations(unittest.TestCase):
    """Test percentile calculation correctness."""
    
    def test_percentiles_ordered(self):
        """Ensure P5 < P25 < P50 < P75 < P95."""
        data = np.random.normal(100000, 50000, 1000)
        percentiles = calculate_percentiles(data)
        
        self.assertLess(percentiles['p5'], percentiles['p25'])
        self.assertLess(percentiles['p25'], percentiles['p50_median'])
        self.assertLess(percentiles['p50_median'], percentiles['p75'])
        self.assertLess(percentiles['p75'], percentiles['p95'])
    
    def test_median_close_to_mean(self):
        """For symmetric distribution, median should be close to mean."""
        data = np.random.normal(100000, 50000, 10000)
        percentiles = calculate_percentiles(data)
        
        # For normal distribution, median ≈ mean
        diff_pct = abs(percentiles['p50_median'] - percentiles['mean']) / percentiles['mean']
        self.assertLess(diff_pct, 0.05)  # Within 5%
    
    def test_std_dev_positive(self):
        """Standard deviation should be non-negative."""
        data = np.random.normal(100000, 50000, 1000)
        percentiles = calculate_percentiles(data)
        
        self.assertGreaterEqual(percentiles['std'], 0)


class TestScenarioBanding(unittest.TestCase):
    """Test scenario band classification logic."""
    
    def test_bands_cover_full_range(self):
        """All scenario probabilities should sum to 100%."""
        min_balances = np.random.uniform(0, 1000000, 5000)
        percentiles = {
            'p5': np.percentile(min_balances, 5),
            'p25': np.percentile(min_balances, 25),
            'p50_median': np.percentile(min_balances, 50),
            'p75': np.percentile(min_balances, 75),
            'p95': np.percentile(min_balances, 95),
            'mean': np.mean(min_balances),
            'std': np.std(min_balances),
        }
        
        bands = get_scenario_bands(min_balances, percentiles, 5000)
        
        # Extract probabilities
        probs = [float(band['probability'].rstrip('%')) for band in bands.values()]
        total_prob = sum(probs)
        
        # Should be close to 100% (allow small rounding error)
        self.assertAlmostEqual(total_prob, 100.0, places=1)
    
    def test_band_ordering(self):
        """Band thresholds should be monotonically increasing."""
        min_balances = np.random.uniform(0, 1000000, 5000)
        percentiles = {
            'p5': np.percentile(min_balances, 5),
            'p25': np.percentile(min_balances, 25),
            'p50_median': np.percentile(min_balances, 50),
            'p75': np.percentile(min_balances, 75),
            'p95': np.percentile(min_balances, 95),
            'mean': np.mean(min_balances),
            'std': np.std(min_balances),
        }
        
        bands = get_scenario_bands(min_balances, percentiles, 5000)
        
        # Extract min values from ranges
        critical_min = float(bands['critical']['range'].split(' - ')[0].replace('$', '').replace(',', ''))
        danger_min = float(bands['danger']['range'].split(' - ')[0].replace('$', '').replace(',', ''))
        caution_min = float(bands['caution']['range'].split(' - ')[0].replace('$', '').replace(',', ''))
        safe_min = float(bands['safe']['range'].split(' - ')[0].replace('$', '').replace(',', ''))
        
        self.assertLess(critical_min, danger_min)
        self.assertLess(danger_min, caution_min)
        self.assertLess(caution_min, safe_min)


class TestBenfordConfig(unittest.TestCase):
    """Test Benford's Law configuration."""
    
    def test_config_values_reasonable(self):
        """Config thresholds should be reasonable."""
        # MAD should be small
        self.assertLess(BENFORD_CONFIG['MAD_THRESHOLD'], 0.1)
        self.assertGreater(BENFORD_CONFIG['MAD_THRESHOLD'], 0)
        
        # Chi-squared threshold should match 9 categories, α=0.05
        self.assertAlmostEqual(BENFORD_CONFIG['CHI_SQUARED_THRESHOLD'], 15.507, places=2)


class TestMonteCarloConfig(unittest.TestCase):
    """Test Monte Carlo configuration."""
    
    def test_scenario_counts_reasonable(self):
        """Scenario counts should be reasonable."""
        self.assertGreaterEqual(MONTE_CARLO_CONFIG['DEFAULT_SCENARIOS'], 1000)
        self.assertGreater(MONTE_CARLO_CONFIG['ESCALATED_SCENARIOS'],
                          MONTE_CARLO_CONFIG['DEFAULT_SCENARIOS'])
    
    def test_survival_escalation_range(self):
        """Escalation threshold should be in high-certainty range (95-100%)."""
        lower, upper = MONTE_CARLO_CONFIG['SURVIVAL_ESCALATION_THRESHOLD']
        self.assertGreaterEqual(lower, 90)
        self.assertLessEqual(upper, 100)
        self.assertLess(lower, upper)


if __name__ == '__main__':
    unittest.main()
