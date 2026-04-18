from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Transaction(BaseModel):
    transaction_id: str
    timestamp: datetime
    amount: float
    source_entity: str
    destination_entity: str
    description: Optional[str] = None

class AuditReport(BaseModel):
    total_transactions: int
    anomalies_detected: int
    benford_compliant: bool
    ghost_vendor_pairs: List[dict]
    circular_loops: List[dict]