from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class AuditResult(Base):
    __tablename__ = "audit_results"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    readiness_score = Column(Float, nullable=False)
    anomaly_count = Column(Integer, default=0)
    loop_count = Column(Integer, default=0)
    fuzzy_match_count = Column(Integer, default=0)
    memo_text = Column(Text, nullable=True)

    # Relationship to transactions
    transactions = relationship("Transaction", back_populates="audit_result", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<AuditResult(id={self.id}, readiness_score={self.readiness_score}, created_at={self.created_at})>"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=True)
    amount = Column(Float, nullable=False)
    source_entity = Column(String, nullable=False)
    destination_entity = Column(String, nullable=False)
    audit_id = Column(Integer, ForeignKey("audit_results.id"), nullable=False, index=True)

    # Relationship back to audit result
    audit_result = relationship("AuditResult", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction(id={self.id}, transaction_id={self.transaction_id}, audit_id={self.audit_id})>"
