"""
Anomaly Detection Service
Detects unusual transactions using Isolation Forest
"""
from sklearn.ensemble import IsolationForest
import numpy as np

def detect_anomalies(data, contamination=0.1):
    """
    Detect anomalies in transaction amounts
    
    Args:
        data: Array of transaction amounts
        contamination: Expected proportion of anomalies (0-1)
    
    Returns:
        List of anomaly indices and scores
    """
    if len(data) < 10:
        return []
    
    # Reshape for sklearn
    X = np.array(data).reshape(-1, 1)
    
    # Train Isolation Forest
    iso_forest = IsolationForest(contamination=contamination, random_state=42)
    predictions = iso_forest.fit_predict(X)
    scores = iso_forest.score_samples(X)
    
    # Extract anomalies
    anomalies = []
    for idx, (pred, score) in enumerate(zip(predictions, scores)):
        if pred == -1:  # Anomaly
            anomalies.append({
                'index': idx,
                'value': data[idx],
                'score': float(score)
            })
    
    return anomalies
