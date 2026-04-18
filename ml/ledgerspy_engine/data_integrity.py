"""
Data Integrity & Readiness Scoring Service
Comprehensive algorithms for assessing ledger data quality and cleanliness
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple


class DataIntegrityScorer:
    """
    Calculates data readiness score using multiple quality dimensions:
    - Completeness (null values, missing fields)
    - Format Validity (valid dates, numeric amounts, entity names)
    - Consistency (duplicates, range violations)
    - Statistical Properties (distribution, outliers)
    """
    
    def __init__(self):
        self.required_columns = ['timestamp', 'amount', 'source_entity', 'destination_entity']
        self.weights = {
            'completeness': 0.30,      # Most critical: need complete data
            'format_validity': 0.25,   # Date/amount/entity formats
            'consistency': 0.20,       # No duplicates, valid ranges
            'statistical': 0.15,       # Normal distribution patterns
            'record_count': 0.10,      # Sufficient volume
        }
    
    def calculate_overall_readiness(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Main entry point: Calculate complete readiness assessment
        
        Returns dict with:
        - readiness_score: 0-100 overall score
        - data_quality: "Excellent"/"Good"/"Fair"/"Poor"/"Critical"
        - component_scores: individual dimension scores
        - issues: list of identified problems
        - recommendations: improvement suggestions
        """
        if df.empty:
            return self._critical_failure("DataFrame is empty")
        
        # Check required columns
        missing_cols = [c for c in self.required_columns if c not in df.columns]
        if missing_cols:
            return self._critical_failure(f"Missing required columns: {missing_cols}")
        
        # Calculate component scores
        completeness_score = self._score_completeness(df)
        format_score = self._score_format_validity(df)
        consistency_score = self._score_consistency(df)
        statistical_score = self._score_statistical_properties(df)
        record_score = self._score_record_count(df)
        
        # Weighted composite score
        overall_score = (
            completeness_score * self.weights['completeness'] +
            format_score * self.weights['format_validity'] +
            consistency_score * self.weights['consistency'] +
            statistical_score * self.weights['statistical'] +
            record_score * self.weights['record_count']
        )
        overall_score = round(min(100, max(0, overall_score)), 1)
        
        # Identify issues
        issues = self._identify_issues(df, {
            'completeness': completeness_score,
            'format': format_score,
            'consistency': consistency_score,
            'statistical': statistical_score,
        })
        
        # Generate recommendations
        recommendations = self._generate_recommendations(issues, overall_score)
        
        # Classify data quality
        data_quality = self._classify_quality(overall_score)
        
        return {
            'readiness_score': overall_score,
            'data_quality': data_quality,
            'completeness': round(completeness_score, 1),
            'format_validity': round(format_score, 1),
            'consistency': round(consistency_score, 1),
            'statistical_health': round(statistical_score, 1),
            'record_sufficiency': round(record_score, 1),
            'total_records': len(df),
            'null_values': self._count_nulls(df),
            'duplicate_records': self._count_duplicates(df),
            'issues': issues,
            'recommendations': recommendations,
        }
    
    def _score_completeness(self, df: pd.DataFrame) -> float:
        """
        Score: Percentage of non-null values in required columns
        
        Formula:
        - 100% if all cells filled
        - Penalize by % of missing values
        """
        total_cells = len(df) * len(self.required_columns)
        non_null = sum(df[col].notna().sum() for col in self.required_columns)
        completeness_pct = (non_null / total_cells * 100) if total_cells > 0 else 0
        
        # Soft penalty for minor gaps, hard penalty for major gaps
        if completeness_pct >= 95:
            return 100
        elif completeness_pct >= 85:
            return 90 + (completeness_pct - 85) / 10 * 10
        elif completeness_pct >= 70:
            return 75 + (completeness_pct - 70) / 15 * 15
        else:
            return max(0, completeness_pct * 0.7)  # Heavy penalty for <70%
    
    def _score_format_validity(self, df: pd.DataFrame) -> float:
        """
        Score: Validity of data formats
        
        Checks:
        - Timestamps: Can be parsed as datetime (95%+ valid)
        - Amounts: Numeric values with reasonable bounds
        - Entities: Non-empty strings
        
        Formula: Average of component validity scores
        """
        scores = []
        
        # Timestamp validity
        try:
            valid_ts = pd.to_datetime(df['timestamp'], errors='coerce').notna().sum()
            ts_score = (valid_ts / len(df) * 100) if len(df) > 0 else 0
            # Penalize if < 90% valid
            ts_score = ts_score if ts_score >= 90 else ts_score * 0.8
            scores.append(ts_score)
        except:
            scores.append(0)
        
        # Amount validity
        try:
            valid_amt = pd.to_numeric(df['amount'], errors='coerce').notna().sum()
            amt_score = (valid_amt / len(df) * 100) if len(df) > 0 else 0
            # Penalize if < 95% valid
            amt_score = amt_score if amt_score >= 95 else amt_score * 0.7
            scores.append(amt_score)
        except:
            scores.append(0)
        
        # Entity validity (non-empty strings)
        try:
            src_valid = (df['source_entity'].astype(str).str.len() > 0).sum()
            dst_valid = (df['destination_entity'].astype(str).str.len() > 0).sum()
            entity_score = ((src_valid + dst_valid) / (2 * len(df)) * 100) if len(df) > 0 else 0
            scores.append(entity_score)
        except:
            scores.append(0)
        
        return np.mean(scores) if scores else 0
    
    def _score_consistency(self, df: pd.DataFrame) -> float:
        """
        Score: Data consistency checks
        
        Checks:
        - Duplicate records (should be < 5%)
        - Amount ranges (positive values, reasonable bounds)
        - Date ranges (no future dates beyond acceptable threshold)
        
        Formula: 100 - penalties for violations
        """
        score = 100
        
        # Duplicate check: penalize if > 5% duplicates
        total = len(df)
        if total > 0:
            dup_subset = df[['timestamp', 'amount', 'source_entity', 'destination_entity']].duplicated().sum()
            dup_pct = (dup_subset / total) * 100
            if dup_pct > 5:
                score -= min(30, dup_pct * 2)  # Max -30 points
        
        # Amount range check: should be mostly positive
        try:
            amounts = pd.to_numeric(df['amount'], errors='coerce')
            negative_pct = (amounts < 0).sum() / len(df) * 100 if len(df) > 0 else 0
            if negative_pct > 10:  # Allow up to 10% negative
                score -= min(15, negative_pct)
        except:
            score -= 5
        
        # Date range check: reject future dates (> 30 days in future)
        try:
            dates = pd.to_datetime(df['timestamp'], errors='coerce')
            today = pd.Timestamp.now()
            future_dates = (dates > today + pd.Timedelta(days=30)).sum()
            future_pct = (future_dates / len(df) * 100) if len(df) > 0 else 0
            if future_pct > 1:
                score -= min(10, future_pct * 5)
        except:
            pass
        
        return max(0, score)
    
    def _score_statistical_properties(self, df: pd.DataFrame) -> float:
        """
        Score: Statistical health of amounts
        
        Checks:
        - Distribution normality (using skewness)
        - Outlier detection (values > 3 std from mean)
        - Concentration (top 10% shouldn't account for >90% of value)
        """
        try:
            amounts = pd.to_numeric(df['amount'], errors='coerce').dropna()
            if len(amounts) < 10:  # Need minimum sample
                return 50
            
            score = 100
            
            # Check skewness (ideally |skew| < 2)
            skewness = amounts.skew()
            if abs(skewness) > 3:
                score -= 15
            elif abs(skewness) > 2:
                score -= 8
            
            # Outlier detection (% of values > 3 std)
            mean = amounts.mean()
            std = amounts.std()
            if std > 0:
                outliers_pct = ((amounts - mean).abs() > 3 * std).sum() / len(amounts) * 100
                score -= min(15, outliers_pct * 2)
            
            # Concentration check (Gini coefficient-like)
            sorted_amt = np.sort(amounts)
            top_10_pct = int(len(sorted_amt) * 0.1)
            if top_10_pct > 0:
                top_10_sum = sorted_amt[-top_10_pct:].sum()
                total_sum = sorted_amt.sum()
                concentration = (top_10_sum / total_sum) if total_sum > 0 else 0
                if concentration > 0.9:
                    score -= 20
                elif concentration > 0.75:
                    score -= 10
            
            return max(0, score)
        except:
            return 50  # Default if calculation fails
    
    def _score_record_count(self, df: pd.DataFrame) -> float:
        """
        Score: Sufficiency of record volume
        
        Formula:
        - < 100 records: 50% score
        - 100-1000 records: 75% score
        - 1000-10000 records: 90% score
        - > 10000 records: 100% score
        """
        count = len(df)
        if count < 100:
            return max(30, count / 100 * 50)
        elif count < 1000:
            return 75
        elif count < 10000:
            return 90
        else:
            return 100
    
    def _count_nulls(self, df: pd.DataFrame) -> Dict[str, int]:
        """Count null values by column"""
        return {col: int(df[col].isna().sum()) for col in self.required_columns}
    
    def _count_duplicates(self, df: pd.DataFrame) -> int:
        """Count duplicate records"""
        return int(df[self.required_columns].duplicated().sum())
    
    def _identify_issues(self, df: pd.DataFrame, scores: Dict[str, float]) -> List[str]:
        """Identify specific data quality issues"""
        issues = []
        
        if scores['completeness'] < 80:
            null_count = sum(df[col].isna().sum() for col in self.required_columns)
            issues.append(f"Missing values detected ({null_count} cells)")
        
        if scores['format'] < 85:
            issues.append("Invalid data formats in timestamp or amount fields")
        
        if scores['consistency'] < 80:
            dup_count = df[self.required_columns].duplicated().sum()
            if dup_count > 0:
                issues.append(f"Duplicate records found ({dup_count} rows)")
        
        if scores['statistical'] < 70:
            issues.append("Unusual statistical distribution detected")
        
        return issues
    
    def _generate_recommendations(self, issues: List[str], score: float) -> List[str]:
        """Generate actionable improvement recommendations"""
        recommendations = []
        
        if not issues:
            recommendations.append("Data quality is excellent - ready for audit")
            return recommendations
        
        if any('Missing' in issue for issue in issues):
            recommendations.append("Review and fill null values in required fields")
            recommendations.append("Consider removing rows with >50% missing data")
        
        if any('Invalid' in issue for issue in issues):
            recommendations.append("Validate timestamp format (YYYY-MM-DD or similar)")
            recommendations.append("Ensure amounts are numeric values")
        
        if any('Duplicate' in issue for issue in issues):
            recommendations.append("Investigate duplicate transactions")
            recommendations.append("Remove or consolidate identified duplicates")
        
        if any('Unusual' in issue for issue in issues):
            recommendations.append("Review outliers and extreme values")
            recommendations.append("Verify data entry accuracy")
        
        if score < 60:
            recommendations.append("Consider manual data review before proceeding with audit")
        
        return recommendations
    
    def _classify_quality(self, score: float) -> str:
        """Classify overall data quality level"""
        if score >= 90:
            return "Excellent"
        elif score >= 75:
            return "Good"
        elif score >= 60:
            return "Fair"
        elif score >= 40:
            return "Poor"
        else:
            return "Critical"
    
    def _critical_failure(self, message: str) -> Dict[str, Any]:
        """Return failure response"""
        return {
            'readiness_score': 0,
            'data_quality': 'Critical',
            'completeness': 0,
            'format_validity': 0,
            'consistency': 0,
            'statistical_health': 0,
            'record_sufficiency': 0,
            'total_records': 0,
            'null_values': {},
            'duplicate_records': 0,
            'issues': [message],
            'recommendations': ['Please check your data and try again'],
        }
