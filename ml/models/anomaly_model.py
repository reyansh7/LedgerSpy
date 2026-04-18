"""
Anomaly Detection Model
Trains and uses Isolation Forest for anomaly detection
"""
import pickle
from sklearn.ensemble import IsolationForest
import numpy as np

class AnomalyModel:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.is_trained = False
    
    def train(self, data):
        """Train the anomaly detection model"""
        X = np.array(data).reshape(-1, 1)
        self.model.fit(X)
        self.is_trained = True
    
    def predict(self, data):
        """Predict anomalies: 1 = normal, -1 = anomaly"""
        X = np.array(data).reshape(-1, 1)
        return self.model.predict(X)
    
    def get_scores(self, data):
        """Get anomaly scores for data"""
        X = np.array(data).reshape(-1, 1)
        return self.model.score_samples(X)
    
    def save(self, filepath):
        """Save model to file"""
        with open(filepath, 'wb') as f:
            pickle.dump(self.model, f)
    
    def load(self, filepath):
        """Load model from file"""
        with open(filepath, 'rb') as f:
            self.model = pickle.load(f)
        self.is_trained = True
