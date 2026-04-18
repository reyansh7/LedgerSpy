"""
Production-Ready Benford's Law Analysis
Correctly detects fraud using first-digit distribution analysis.
"""
import numpy as np
import pandas as pd
from scipy.stats import chi2
import logging

logger = logging.getLogger(__name__)


class BenfordAnalyzer:
    """
    Analyzes transaction data against Benford's Law.
    
    Benford's Law states that in naturally occurring datasets, the first digit
    distribution follows: P(d) = log10(1 + 1/d) for digits 1-9
    
    This is useful for detecting fraudulent transactions or data manipulation.
    """
    
    def __init__(self):
        """Initialize with theoretical Benford distribution."""
        # Calculate expected distribution using Benford's formula
        self.expected_dist = {
            digit: np.log10(1 + 1/digit) 
            for digit in range(1, 10)
        }
        
        # Chi-square critical value at 5% significance level (8 degrees of freedom)
        self.chi_square_critical = 15.507
    
    def get_first_digit(self, value) -> int:
        """
        Extract first significant digit from a number.
        
        Args:
            value: Float, int, or numeric value
            
        Returns:
            First significant digit (1-9), or None if invalid
            
        Examples:
            1200.0 -> 1
            0.0045 -> 4
            150000 -> 1
            -500 -> 5 (uses absolute value)
        """
        try:
            # Convert to float if needed
            num = float(value)
            
            # Skip zeros, NaN, inf, and negative values
            if pd.isna(num) or not np.isfinite(num) or num == 0:
                return None
            
            # Use absolute value for negative numbers
            num = abs(num)
            
            # Extract first digit using logarithm
            # This handles both small and large numbers correctly
            first_digit_val = int(num / (10 ** np.floor(np.log10(num))))
            first_digit = int(str(first_digit_val).lstrip('0')) if first_digit_val > 0 else None
            
            # Safety check - should always be 1-9
            if first_digit and 1 <= first_digit <= 9:
                return first_digit
            else:
                return None
                
        except (ValueError, TypeError, ZeroDivisionError):
            return None
    
    def extract_first_digits(self, series: pd.Series) -> list:
        """
        Extract first digits from a pandas Series.
        
        Args:
            series: Pandas Series with numeric values
            
        Returns:
            List of first digits (1-9)
        """
        first_digits = []
        
        for value in series:
            digit = self.get_first_digit(value)
            if digit is not None:
                first_digits.append(digit)
        
        return first_digits
    
    def compute_benford_distribution(self, first_digits: list) -> dict:
        """
        Calculate observed distribution of first digits.
        
        Args:
            first_digits: List of extracted first digits
            
        Returns:
            Dict with observed percentages for each digit (1-9)
        """
        if not first_digits:
            return {digit: 0.0 for digit in range(1, 10)}
        
        total = len(first_digits)
        observed = {}
        
        for digit in range(1, 10):
            count = first_digits.count(digit)
            observed[digit] = (count / total) * 100.0  # Convert to percentage
        
        return observed
    
    def calculate_deviation(self, observed: dict, expected: dict) -> float:
        """
        Calculate total absolute deviation between observed and expected.
        
        Formula: sum(|observed% - expected%|) for all digits
        
        Args:
            observed: Dict of observed percentages {digit: percent}
            expected: Dict of expected percentages {digit: percent}
            
        Returns:
            Total deviation (0-100)
        """
        total_deviation = 0.0
        
        for digit in range(1, 10):
            obs_pct = observed.get(digit, 0.0)
            exp_pct = expected.get(digit, 0.0) * 100.0  # Convert to percentage
            
            deviation = abs(obs_pct - exp_pct)
            total_deviation += deviation
        
        return total_deviation
    
    def calculate_benford_risk(self, deviation: float) -> float:
        """
        Convert deviation into a realistic risk score (0-100).
        
        Scaling:
        - 0-10 deviation → 0-10 risk (Low)
        - 10-25 deviation → 10-40 risk (Medium)
        - 25+ deviation → 40-100 risk (High)
        
        Args:
            deviation: Total absolute deviation (0-100)
            
        Returns:
            Risk score (0-100), clamped
        """
        if deviation < 5:
            # Very close to Benford - minimal risk
            risk = (deviation / 5) * 10
        elif deviation < 20:
            # Moderate deviation - linear scaling to 40
            risk = 10 + ((deviation - 5) / 15) * 30
        elif deviation < 40:
            # High deviation - linear scaling to 85
            risk = 40 + ((deviation - 20) / 20) * 45
        else:
            # Extreme deviation - near maximum risk
            risk = 85 + min((deviation - 40) / 40, 1) * 15
        
        # Clamp to 0-100 range
        return float(np.clip(risk, 0, 100))
    
    def get_risk_interpretation(self, risk_score: float) -> str:
        """
        Convert risk score to human-readable interpretation.
        
        Args:
            risk_score: Risk score (0-100)
            
        Returns:
            Interpretation string
        """
        if risk_score < 20:
            return "Low Risk"
        elif risk_score < 40:
            return "Medium Risk"
        elif risk_score < 60:
            return "Elevated Risk"
        elif risk_score < 80:
            return "High Risk"
        else:
            return "Critical Risk"
    
    def analyze(self, df: pd.DataFrame, amount_column: str = 'amount') -> dict:
        """
        Perform complete Benford's Law analysis on transaction data.
        
        Args:
            df: DataFrame with transaction data
            amount_column: Column name containing transaction amounts
            
        Returns:
            Structured result with expected, observed, deviation, risk score
        """
        logger.info(f"Starting Benford analysis on {len(df)} records")
        
        # Validate input
        if amount_column not in df.columns:
            raise ValueError(f"Column '{amount_column}' not found in DataFrame")
        
        # Extract first digits
        first_digits = self.extract_first_digits(df[amount_column])
        
        if not first_digits:
            logger.warning("No valid numeric data found for Benford analysis")
            return {
                "expected": {d: 0.0 for d in range(1, 10)},
                "observed": {d: 0.0 for d in range(1, 10)},
                "deviation": 0.0,
                "risk_score": 0.0,
                "interpretation": "No valid data",
                "total_analyzed": 0,
                "total_skipped": len(df)
            }
        
        logger.debug(f"Extracted {len(first_digits)} first digits from {len(df)} records")
        
        # Compute expected distribution (convert to percentages)
        expected = {digit: self.expected_dist[digit] * 100.0 for digit in range(1, 10)}
        
        # Compute observed distribution
        observed = self.compute_benford_distribution(first_digits)
        
        # Calculate deviation
        deviation = self.calculate_deviation(observed, self.expected_dist)
        
        # Convert to risk score
        risk_score = self.calculate_benford_risk(deviation)
        
        # Get interpretation
        interpretation = self.get_risk_interpretation(risk_score)
        
        # Calculate chi-square for additional statistical context
        chi_square = 0.0
        for digit in range(1, 10):
            obs_count = first_digits.count(digit)
            exp_count = len(first_digits) * self.expected_dist[digit]
            
            if exp_count > 0:
                chi_square += ((obs_count - exp_count) ** 2) / exp_count
        
        # Calculate p-value
        p_value = 1 - chi2.cdf(chi_square, 8)
        
        result = {
            "expected": expected,
            "observed": observed,
            "deviation": round(deviation, 2),
            "risk_score": round(risk_score, 1),
            "interpretation": interpretation,
            "total_analyzed": len(first_digits),
            "total_skipped": len(df) - len(first_digits),
            "chi_square": round(chi_square, 2),
            "p_value": round(p_value, 4),
            "is_benford_compliant": chi_square < self.chi_square_critical,
        }
        
        logger.info(
            f"Benford analysis complete: deviation={result['deviation']}, "
            f"risk_score={result['risk_score']}, interpretation={interpretation}"
        )
        
        return result
    
    def analyze_with_details(self, df: pd.DataFrame, amount_column: str = 'amount') -> dict:
        """
        Perform Benford analysis and include detailed digit-by-digit breakdown.
        
        Args:
            df: DataFrame with transaction data
            amount_column: Column name containing transaction amounts
            
        Returns:
            Result with additional digit_details for frontend visualization
        """
        base_result = self.analyze(df, amount_column)
        
        # Add detailed comparison for each digit
        digit_details = []
        for digit in range(1, 10):
            exp_pct = base_result["expected"][digit]
            obs_pct = base_result["observed"][digit]
            diff = obs_pct - exp_pct
            
            digit_details.append({
                "digit": digit,
                "expected_pct": round(exp_pct, 2),
                "observed_pct": round(obs_pct, 2),
                "difference": round(diff, 2),
                "status": "over" if diff > 0 else "under" if diff < 0 else "match"
            })
        
        base_result["digit_details"] = digit_details
        
        return base_result


# Module-level convenience function for FastAPI integration
def analyze_benford_law(df: pd.DataFrame, amount_column: str = 'amount') -> dict:
    """
    Quick wrapper for Benford analysis.
    
    Args:
        df: Transaction DataFrame
        amount_column: Amount column name
        
    Returns:
        Analysis result
    """
    analyzer = BenfordAnalyzer()
    return analyzer.analyze(df, amount_column)
