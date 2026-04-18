"""
Data Preprocessing Utilities for ML
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler

def standardize_features(X):
    """Standardize features to zero mean and unit variance"""
    scaler = StandardScaler()
    return scaler.fit_transform(X)

def normalize_features(X):
    """Normalize features to 0-1 range"""
    scaler = MinMaxScaler()
    return scaler.fit_transform(X)

def handle_missing_values(df, method='drop'):
    """
    Handle missing values in dataframe
    
    Methods:
    - 'drop': remove rows with missing values
    - 'mean': fill with mean
    - 'median': fill with median
    """
    if method == 'drop':
        return df.dropna()
    elif method == 'mean':
        return df.fillna(df.mean())
    elif method == 'median':
        return df.fillna(df.median())
    return df

def remove_outliers(X, std_threshold=3):
    """Remove outliers using standard deviation"""
    mean = np.mean(X, axis=0)
    std = np.std(X, axis=0)
    
    mask = np.all(np.abs(X - mean) < (std_threshold * std), axis=1)
    return X[mask]
