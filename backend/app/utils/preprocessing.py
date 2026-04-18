"""
Backend Preprocessing Utilities
"""
import pandas as pd
import numpy as np

def parse_file(file_path):
    """Parse CSV or Excel file"""
    if file_path.endswith('.csv'):
        return pd.read_csv(file_path)
    else:
        return pd.read_excel(file_path)

def clean_data(df):
    """
    Clean financial data
    - Remove rows with missing required fields
    - Standardize column names
    - Convert types
    """
    df.columns = df.columns.str.lower().str.strip()
    
    # Drop rows with missing critical fields
    critical_cols = ['amount', 'description', 'date']
    df = df.dropna(subset=critical_cols)
    
    # Convert amount to float
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    
    # Convert date to datetime
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    
    return df.dropna()

def extract_amounts(df):
    """Extract amounts for analysis"""
    return df['amount'].astype(float).values

def extract_descriptions(df):
    """Extract descriptions for fuzzy matching"""
    return df['description'].astype(str).values
