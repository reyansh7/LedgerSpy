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
        Returns a Series with preserved indices for proper alignment.
        """
        # Drop zeros and NaNs, take absolute value
        clean_data = series.dropna().abs()
        clean_data = clean_data[clean_data > 0]
        
        if len(clean_data) == 0:
            return pd.Series(dtype=int)
        
        # Mathematical extraction: d = floor(10^(log10(x) - floor(log10(x))))
        # This is exponentially faster than converting floats to strings
        log10_vals = np.log10(clean_data.values)
        first_digits_vals = np.floor(10 ** (log10_vals - np.floor(log10_vals)))
        first_digits_vals = np.clip(first_digits_vals, 1, 9).astype(int)
        
        # Return as Series with original indices preserved
        return pd.Series(first_digits_vals, index=clean_data.index)

    def analyze(self, df: pd.DataFrame, amount_column: str = 'amount', weighted: bool = True):
        """
        Analyzes a dataset against Benford's Law.
        Can weight by transaction amount (more realistic for fraud detection).
        
        Args:
            df: Pandas DataFrame with transaction data
            amount_column: Column to analyze
            weighted: If True, weight distribution by transaction amount
        """
        if amount_column not in df.columns:
            raise ValueError(f"Column '{amount_column}' not found in dataframe.")

        first_digits = self.extract_first_digits(df[amount_column])
        
        if len(first_digits) == 0:
            return {"error": "No valid numerical data to analyze."}

        total_count = len(first_digits)
        
        # ===== WEIGHTED ANALYSIS =====
        if weighted:
            # Get the amounts corresponding to each first digit (using preserved indices)
            amounts_for_digits = df[amount_column].loc[first_digits.index]
            
            # Create weighted distribution
            weighted_amount_by_digit = {}
            for digit in range(1, 10):
                mask = first_digits == digit
                if mask.sum() > 0:
                    weighted_amount_by_digit[digit] = amounts_for_digits[mask].sum()
                else:
                    weighted_amount_by_digit[digit] = 0
            
            total_weighted = sum(weighted_amount_by_digit.values())
            observed_counts_weighted = {
                digit: weighted_amount_by_digit[digit] / total_weighted if total_weighted > 0 else 0
                for digit in range(1, 10)
            }
        
        # ===== UNWEIGHTED ANALYSIS =====
        observed_counts = first_digits.value_counts().to_dict()
        
        chi_square = 0
        distribution_comparison = {}
        anomaly_patterns = []

        # Calculate Chi-Square and build comparison payload for the frontend
        for digit in range(1, 10):
            expected_pct = self.expected_dist[digit]
            expected_count = expected_pct * total_count
            
            if weighted:
                observed_pct = observed_counts_weighted.get(digit, 0)
            else:
                observed_count = observed_counts.get(digit, 0)
                observed_pct = (observed_count / total_count) * 100 if total_count > 0 else 0
                observed_count_for_chi = observed_count
            
            if not weighted:
                # Prevent division by zero if dataset is bizarrely small
                if expected_count > 0:
                    chi_square += ((observed_count_for_chi - expected_count) ** 2) / expected_count
            else:
                observed_pct_for_chi = observed_pct * 100
                if expected_pct > 0:
                    chi_square += ((observed_pct_for_chi - (expected_pct * 100)) ** 2) / (expected_pct * 100)
            
            expected_pct_display = expected_pct * 100
            observed_pct_display = observed_pct * 100 if weighted else (
                (observed_counts.get(digit, 0) / total_count * 100) if total_count > 0 else 0
            )
            
            distribution_comparison[digit] = {
                "expected_pct": expected_pct_display,
                "observed_pct": observed_pct_display,
                "deviation": abs(observed_pct_display - expected_pct_display)
            }
            
            # ===== PATTERN DETECTION =====
            # Flag suspiciously LOW or HIGH first digits
            if observed_pct_display < expected_pct_display * 0.5:  # Significantly under-represented
                anomaly_patterns.append({
                    'digit': digit,
                    'pattern': 'UNDER_REPRESENTED',
                    'reason': f'Digit {digit} appears {observed_pct_display:.1f}% vs expected {expected_pct_display:.1f}%',
                    'fraud_risk': 'HIGH'  # Under-representation suggests artificial data
                })
            elif observed_pct_display > expected_pct_display * 1.5:  # Over-represented
                anomaly_patterns.append({
                    'digit': digit,
                    'pattern': 'OVER_REPRESENTED',
                    'reason': f'Digit {digit} appears {observed_pct_display:.1f}% vs expected {expected_pct_display:.1f}%',
                    'fraud_risk': 'MEDIUM'  # Could indicate rounding
                })

        # Calculate p-value
        p_value = 1 - chi2.cdf(chi_square, 8)
        
        # Return a clean JSON-ready dictionary for the API/Frontend
        result = {
            "is_compliant": bool(chi_square < self.threshold),
            "chi_square_stat": float(chi_square),
            "p_value": float(p_value),
            "total_analyzed": int(total_count),
            "digit_distribution": distribution_comparison,
            "anomaly_patterns": anomaly_patterns,
            "weighted_analysis": weighted,
            "compliance_confidence": float(max(0, min(100, 100 * (1 - p_value))))  # 0-100% confidence
        }
        
        return result
    
    def analyze_multiple_fields(self, df: pd.DataFrame, amount_fields: list = None):
        """
        Analyze Benford's Law across multiple numerical fields.
        Useful for comprehensive fraud detection.
        
        Args:
            df: Pandas DataFrame
            amount_fields: List of column names to analyze (or None for all numeric columns)
        
        Returns:
            Dictionary mapping field names to analysis results
        """
        if amount_fields is None:
            amount_fields = df.select_dtypes(include=[np.number]).columns.tolist()
            # Remove obvious non-amount fields
            amount_fields = [f for f in amount_fields if f not in ['id', 'count', 'index']]
        
        results = {}
        for field in amount_fields:
            if field in df.columns:
                try:
                    results[field] = self.analyze(df, field, weighted=True)
                except Exception as e:
                    results[field] = {"error": str(e)}
        
        return results
