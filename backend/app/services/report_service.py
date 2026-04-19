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
    ✅ FIXED: Use consistent formula with audit_service.py
    
    Formula: (50% × anomaly_rate) + (30% × vendor_rate) + (20% × benford_risk)
    """
    total_records = max(analysis_results.get('total_records', 1), 1)
    
    # Calculate percentage rates
    anomaly_count = len(analysis_results.get('anomalies', []))
    anomaly_rate = (anomaly_count / total_records) * 100  # Convert to 0-100 scale
    
    fuzzy_count = len(analysis_results.get('fuzzy_matches', []))
    vendor_rate = (fuzzy_count / total_records) * 100  # Convert to 0-100 scale
    
    # Benford risk is already 0-100 scale (from summary, calculated using p-value)
    benford_risk = analysis_results.get('summary', {}).get('benford_risk', 0)
    benford_risk = max(0, min(benford_risk, 100))  # Ensure 0-100 range
    
    # Weighted calculation: 50% anomaly + 30% vendor + 20% benford
    score = (anomaly_rate * 0.50) + (vendor_rate * 0.30) + (benford_risk * 0.20)
    
    return round(min(score, 100), 2)

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
