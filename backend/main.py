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

# Add services to path
sys.path.insert(0, str(Path(__file__).parent))

from database import engine, get_db, SessionLocal
from models import Base, AuditResult, Transaction
from app.services.audit_service import run_full_analysis
from app.services.result_cache import cache_result
from app.api.routes import router as audit_router

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

# Include routes
app.include_router(audit_router, prefix="/api/audit", tags=["audit"])


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
        # Run full audit analysis
        audit_result = run_full_analysis(df, file.filename)
        file_id = audit_result.get("file_id")
        
        # Cache the result for later retrieval
        cache_result(file_id, audit_result)
        
        # Extract results
        readiness_report = audit_result.get("readiness_report", {})
        readiness_score = readiness_report.get("readiness_score", 0)
        anomalies = audit_result.get("anomalies", [])
        fuzzy_matches = audit_result.get("fuzzy_matches", [])
        
        # Save to database
        db_audit = AuditResult(
            readiness_score=readiness_score,
            anomaly_count=len(anomalies),
            loop_count=0,  # Placeholder
            fuzzy_match_count=len(fuzzy_matches),
            memo_text="Audit completed",
        )
        db.add(db_audit)
        db.flush()
        db.commit()
        db.refresh(db_audit)
        
        return {
            "audit_id": db_audit.id,
            "file_id": file_id,
            "readiness_report": readiness_report,
            "summary": audit_result.get("summary", {}),
            "anomalies": anomalies[:10],
            "fuzzy_matches": fuzzy_matches[:10],
        }
        
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Audit failed: {str(exc)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
