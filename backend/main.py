"""
FastAPI Main Entrypoint for LedgerSpy Audit Engine
"""
import sys
from pathlib import Path
from io import BytesIO

import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Add ml module to path
sys.path.insert(0, str(Path(__file__).parent.parent / "ml"))

from ledgerspy_engine.core_engine import LedgerSpyEngine
from database import engine, get_db, SessionLocal
from models import Base, AuditResult, Transaction

# Initialize FastAPI app
app = FastAPI(
    title="LedgerSpy Audit Engine",
    description="Fraud Detection & Audit Ready Assessment System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LedgerSpy engine as singleton
spy_engine = LedgerSpyEngine()


@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.post("/audit/upload")
async def audit_upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a CSV file and run full audit pipeline.
    
    Returns:
        - audit_id: ID of the created audit result
        - memo: Generated audit memo
        - readiness_score: Readiness percentage
        - metrics: anomaly_count, loop_count, fuzzy_match_count
    """
    # Validate file
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    try:
        # Read file as DataFrame
        contents = await file.read()
        df = pd.read_csv(BytesIO(contents))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")
            
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(exc)}")

    try:
        # Run full audit
        audit_result = spy_engine.run_full_audit(df)
        
        # Extract results
        readiness_report = audit_result["readiness_report"]
        readiness_score = readiness_report.get("readiness_score", 0)
        anomaly_count = audit_result["anomaly_count"]
        loop_count = audit_result["loop_count"]
        fuzzy_match_count = audit_result["fuzzy_match_count"]
        memo_text = audit_result["memo"]
        
        # Save to database
        db_audit = AuditResult(
            readiness_score=readiness_score,
            anomaly_count=anomaly_count,
            loop_count=loop_count,
            fuzzy_match_count=fuzzy_match_count,
            memo_text=memo_text,
        )
        db.add(db_audit)
        db.flush()  # Get the ID without committing
        
        # (Optional) Save transactions to database
        # This would populate the Transaction table linked to db_audit.id
        for _, row in df.iterrows():
            db_transaction = Transaction(
                transaction_id=str(row.get("transaction_id", "")),
                timestamp=pd.to_datetime(row.get("timestamp"), errors="coerce"),
                amount=float(row.get("amount", 0)),
                source_entity=str(row.get("source_entity", "UNKNOWN")),
                destination_entity=str(row.get("destination_entity", "UNKNOWN")),
                audit_id=db_audit.id,
            )
            db.add(db_transaction)
        
        db.commit()
        db.refresh(db_audit)
        
        return {
            "audit_id": db_audit.id,
            "memo": memo_text,
            "readiness_score": readiness_score,
            "metrics": {
                "anomaly_count": anomaly_count,
                "loop_count": loop_count,
                "fuzzy_match_count": fuzzy_match_count,
            }
        }
        
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Audit failed: {str(exc)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
