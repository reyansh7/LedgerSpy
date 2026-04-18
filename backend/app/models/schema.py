from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TransactionBase(BaseModel):
    amount: float
    description: str
    date: datetime

class Transaction(TransactionBase):
    id: int
    
    class Config:
        from_attributes = True

class AnalysisResult(BaseModel):
    file_id: str
    benford_score: float
    anomaly_count: int
    fuzzy_matches: int
    created_at: datetime

class UploadResponse(BaseModel):
    status: str
    file_id: str
    message: str
