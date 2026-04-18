import numpy as np
import pandas as pd
from scipy.stats import chi2

class BenfordProfiler:
    def __init__(self):
        # The ideal Benford distribution
        self.expected_dist = {
            1: 0.301, 2: 0.176, 3: 0.125, 4: 0.097, 5: 0.079,
            6: 0.067, 7: 0.058, 8: 0.051, 9: 0.046
        }
        self.threshold = 15.507 # 5% significance level for 8 degrees of freedom

    def extract_first_digits(self, series: pd.Series) -> pd.Series:
        """
        Fast, vectorized extraction of the first non-zero digit.
        Handles decimals correctly (e.g., 0.045 -> 4)
        """
        # Drop zeros and NaNs, take absolute value
        clean_data = series.dropna().abs()
        clean_data = clean_data[clean_data > 0]
        
        # Mathematical extraction: d = floor(10^(log10(x) - floor(log10(x))))
        # This is exponentially faster than converting floats to strings
        log10_vals = np.log10(clean_data)
        first_digits = np.floor(10 ** (log10_vals - np.floor(log10_vals))).astype(int)
        
        return first_digits

    def analyze(self, df: pd.DataFrame, amount_column: str = 'amount'):
        """
        Analyzes a dataset against Benford's Law.
        Expects a Pandas DataFrame.
        """
        if amount_column not in df.columns:
            raise ValueError(f"Column '{amount_column}' not found in dataframe.")

        first_digits = self.extract_first_digits(df[amount_column])
        
        if len(first_digits) == 0:
            return {"error": "No valid numerical data to analyze."}

        # Calculate observed frequencies
        total_count = len(first_digits)
        observed_counts = first_digits.value_counts().to_dict()
        
        chi_square = 0
        distribution_comparison = {}

        # Calculate Chi-Square and build comparison payload for the frontend
        for digit in range(1, 10):
            expected_pct = self.expected_dist[digit]
            expected_count = expected_pct * total_count
            observed_count = observed_counts.get(digit, 0)
            
            # Prevent division by zero if dataset is bizarrely small
            if expected_count > 0:
                chi_square += ((observed_count - expected_count) ** 2) / expected_count
            
            distribution_comparison[digit] = {
                "expected_pct": expected_pct * 100,
                "observed_pct": (observed_count / total_count) * 100 if total_count > 0 else 0
            }

        # Calculate p-value
        p_value = 1 - chi2.cdf(chi_square, 8)
        
        # Return a clean JSON-ready dictionary for the API/Frontend
        return {
            "is_compliant": bool(chi_square < self.threshold),
            "chi_square_stat": float(chi_square),
            "p_value": float(p_value),
            "total_analyzed": int(total_count),
            "digit_distribution": distribution_comparison
        }