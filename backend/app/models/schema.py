from pydantic import BaseModel
from typing import Any, Optional, List
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
    summary: dict[str, Any] | None = None


class RiskScore(BaseModel):
    transaction_id: str
    risk_score: float


class TransactionResult(BaseModel):
    transaction_id: str
    timestamp: Optional[str] = None
    amount: float
    source_entity: str
    destination_entity: str
    risk_score: float
    is_anomaly: bool
    explanation: List[str]


class AnalysisResponse(BaseModel):
    file_id: str
    status: str
    summary: dict[str, Any]
    anomalies: List[TransactionResult]
    benford: dict[str, Any]
    fuzzy_matches: List[dict[str, Any]]
    risk_scores: List[RiskScore]
    transactions: List[TransactionResult]
