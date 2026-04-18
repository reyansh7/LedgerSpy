"""
File Handler Utility
Handles file parsing and validation
"""
import pandas as pd
import os
from app.config.settings import settings
from datetime import datetime

async def process_uploaded_file(filename, file_data):
    """
    Process and validate uploaded file
    
    Args:
        filename: Original filename
        file_data: File contents in bytes
    
    Returns:
        Dict with file_id and parsed data
    """
    # Generate unique file ID
    file_id = f"{int(datetime.now().timestamp())}_{filename}"
    
    # Save file temporarily
    upload_path = os.path.join(settings.UPLOAD_DIR, file_id)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    with open(upload_path, 'wb') as f:
        f.write(file_data)
    
    # Parse file
    if filename.endswith('.csv'):
        df = pd.read_csv(upload_path)
    elif filename.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(upload_path)
    else:
        raise ValueError('Unsupported file format')
    
    # Validate required columns
    required_cols = ['amount', 'description', 'date']
    if not all(col.lower() in df.columns for col in required_cols):
        raise ValueError(f'Missing required columns: {required_cols}')
    
    return {
        'file_id': file_id,
        'filename': filename,
        'rows': len(df),
        'upload_path': upload_path
    }

def delete_file(file_path):
    """Delete uploaded file"""
    if os.path.exists(file_path):
        os.remove(file_path)
