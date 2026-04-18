import pickle
from sklearn.ensemble import IsolationForest
import pandas as pd
import numpy as np

class AnomalyModel:
    def __init__(self, contamination=0.02):
        # contamination=0.02 means we assume 2% of the ledger is suspicious. 
        # 0.1 (10%) is usually too noisy for real audits.
        self.model = IsolationForest(contamination=contamination, random_state=42)
        self.is_trained = False
        self.feature_columns = [] 
    
    def train(self, df_features: pd.DataFrame):
        """
        Train the anomaly detection model on multiple engineered features.
        Expects a Pandas DataFrame.
        """
        self.feature_columns = df_features.columns.tolist()
        self.model.fit(df_features.values)
        self.is_trained = True
    
    def predict(self, df_features: pd.DataFrame):
        """
        Predict anomalies. 
        Converts scikit-learn's standard (-1 for anomaly, 1 for normal) 
        into a clean boolean flag (True for anomaly) for the frontend.
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before calling predict.")
            
        raw_predictions = self.model.predict(df_features.values)
        
        # Convert -1 (anomaly) to True, and 1 (normal) to False
        return [True if x == -1 else False for x in raw_predictions]
    
    def get_scores(self, df_features: pd.DataFrame):
        """
        Get anomaly scores. Lower scores (more negative) mean highly abnormal.
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before calling get_scores.")
            
        return self.model.score_samples(df_features.values)
    
    def save(self, filepath):
        """Save model to file for the offline desktop app"""
        with open(filepath, 'wb') as f:
            pickle.dump({'model': self.model, 'features': self.feature_columns}, f)
    
    def load(self, filepath):
        """Load model from file"""
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
            self.model = data['model']
            self.feature_columns = data['features']
        self.is_trained = True