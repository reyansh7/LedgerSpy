"""
Report Generation Service
Generates comprehensive fraud analysis reports
"""
from datetime import datetime
import json

def generate_report(file_id, analysis_results):
    """
    Generate a comprehensive report from analysis results
    
    Args:
        file_id: Unique file identifier
        analysis_results: Dict containing analysis results
    
    Returns:
        Report dict with summary and recommendations
    """
    report = {
        'file_id': file_id,
        'generated_at': datetime.now().isoformat(),
        'summary': {
            'total_records': analysis_results.get('total_records', 0),
            'anomalies_found': len(analysis_results.get('anomalies', [])),
            'fuzzy_matches': len(analysis_results.get('fuzzy_matches', [])),
            'risk_score': calculate_risk_score(analysis_results),
        },
        'recommendations': generate_recommendations(analysis_results),
        'details': analysis_results
    }
    return report

def calculate_risk_score(analysis_results):
    """
    Calculate overall risk score (0-100)
    """
    score = 0
    
    # Benford's Law contribution (40%)
    benford = analysis_results.get('benford', {})
    if benford.get('chi_square'):
        score += min(benford['chi_square'] / 10, 40)
    
    # Anomalies contribution (40%)
    anomaly_ratio = len(analysis_results.get('anomalies', [])) / max(
        analysis_results.get('total_records', 1), 1
    )
    score += min(anomaly_ratio * 100, 40)
    
    # Fuzzy matches contribution (20%)
    match_ratio = len(analysis_results.get('fuzzy_matches', [])) / max(
        analysis_results.get('total_records', 1), 1
    )
    score += min(match_ratio * 100, 20)
    
    return round(score, 2)

def generate_recommendations(analysis_results):
    """
    Generate recommendations based on analysis
    """
    recommendations = []
    
    benford = analysis_results.get('benford', {})
    if benford.get('verdict') == 'Suspicious':
        recommendations.append({
            'type': 'benford',
            'priority': 'high',
            'message': 'Benford\'s Law test indicates suspicious digit distribution'
        })
    
    anomalies = analysis_results.get('anomalies', [])
    if len(anomalies) > 0:
        recommendations.append({
            'type': 'anomalies',
            'priority': 'medium',
            'message': f'{len(anomalies)} unusual transactions detected'
        })
    
    fuzzy = analysis_results.get('fuzzy_matches', [])
    if len(fuzzy) > 0:
        recommendations.append({
            'type': 'duplicates',
            'priority': 'low',
            'message': f'{len(fuzzy)} potential duplicate entries found'
        })
    
    return recommendations
