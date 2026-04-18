"""
Reconciliation API Routes

FastAPI endpoints for bank statement reconciliation.

Endpoints:
- POST /api/reconciliation/generate-bank-statement - Generate bank statement from ledger
- POST /api/reconciliation/reconcile - Run reconciliation
- POST /api/reconciliation/reconcile-with-bank - Reconcile with uploaded bank statement
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import pandas as pd
from io import BytesIO
from typing import Optional

from app.services.reconciliation_service import ReconciliationService

router = APIRouter(prefix="/api/reconciliation", tags=["reconciliation"])


@router.post("/generate-bank-statement")
async def generate_bank_statement(file: UploadFile = File(...)):
    """
    Generate a synthetic bank statement from a ledger CSV.
    
    Args:
        file: Ledger CSV file (columns: transaction_id, timestamp, amount, 
              source_entity, destination_entity)
    
    Returns:
        Generated bank statement as JSON
    """
    try:
        # Read uploaded CSV
        contents = await file.read()
        ledger_df = pd.read_csv(BytesIO(contents))
        
        # Generate bank statement
        bank_df = ReconciliationService.generate_bank_statement(ledger_df)
        
        return {
            "status": "success",
            "message": f"Generated bank statement with {len(bank_df)} transactions",
            "data": bank_df.to_dict(orient="records"),
            "summary": {
                "original_transactions": len(ledger_df),
                "generated_transactions": len(bank_df),
                "missing_transactions": len(ledger_df) - len(bank_df),
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error generating bank statement: {str(e)}")


@router.post("/reconcile")
async def reconcile(
    ledger_file: UploadFile = File(...),
    vendor_threshold: float = Form(default=0.85),
    date_tolerance_days: int = Form(default=1),
    amount_tolerance_pct: float = Form(default=10.0),
):
    """
    Reconcile ledger with auto-generated bank statement.
    
    Args:
        ledger_file: Ledger CSV file
        vendor_threshold: Fuzzy match threshold (0-1)
        date_tolerance_days: Allow dates within ±N days
        amount_tolerance_pct: Allow amount differences within ±N%
    
    Returns:
        Reconciliation results with summary and transaction details
    """
    try:
        # Read ledger
        contents = await ledger_file.read()
        ledger_df = pd.read_csv(BytesIO(contents))
        
        # Run reconciliation (bank will be auto-generated)
        results = ReconciliationService.reconcile(
            ledger_df,
            bank_df=None,
            vendor_threshold=vendor_threshold,
            date_tolerance_days=date_tolerance_days,
            amount_tolerance_pct=amount_tolerance_pct,
        )
        
        return {
            "status": "success",
            "summary": results["summary"],
            "metadata": results["metadata"],
            "transactions": results["transactions"][:100],  # Return first 100 for preview
            "total_transactions": len(results["transactions"]),
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Reconciliation error: {str(e)}")


@router.post("/reconcile-with-bank")
async def reconcile_with_bank(
    ledger_file: UploadFile = File(...),
    bank_file: UploadFile = File(...),
    vendor_threshold: float = Form(default=0.85),
    date_tolerance_days: int = Form(default=1),
    amount_tolerance_pct: float = Form(default=10.0),
):
    """
    Reconcile ledger with provided bank statement.
    
    Args:
        ledger_file: Ledger CSV file
        bank_file: Bank statement CSV file
        vendor_threshold: Fuzzy match threshold (0-1)
        date_tolerance_days: Allow dates within ±N days
        amount_tolerance_pct: Allow amount differences within ±N%
    
    Returns:
        Reconciliation results
    """
    try:
        # Read files
        ledger_contents = await ledger_file.read()
        bank_contents = await bank_file.read()
        
        ledger_df = pd.read_csv(BytesIO(ledger_contents))
        bank_df = pd.read_csv(BytesIO(bank_contents))
        
        # Run reconciliation
        results = ReconciliationService.reconcile(
            ledger_df,
            bank_df=bank_df,
            vendor_threshold=vendor_threshold,
            date_tolerance_days=date_tolerance_days,
            amount_tolerance_pct=amount_tolerance_pct,
        )
        
        return {
            "status": "success",
            "summary": results["summary"],
            "metadata": results["metadata"],
            "transactions": results["transactions"][:100],  # Return first 100 for preview
            "total_transactions": len(results["transactions"]),
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Reconciliation error: {str(e)}")


@router.post("/export-results")
async def export_results(
    ledger_file: UploadFile = File(...),
    bank_file: Optional[UploadFile] = File(default=None),
    vendor_threshold: float = Form(default=0.85),
    date_tolerance_days: int = Form(default=1),
    amount_tolerance_pct: float = Form(default=10.0),
):
    """
    Reconcile and export full results as CSV.
    
    Args:
        ledger_file: Ledger CSV file
        bank_file: Bank statement CSV file (optional)
        vendor_threshold: Fuzzy match threshold
        date_tolerance_days: Date tolerance in days
        amount_tolerance_pct: Amount tolerance in percent
    
    Returns:
        CSV file download
    """
    try:
        # Read ledger
        ledger_contents = await ledger_file.read()
        ledger_df = pd.read_csv(BytesIO(ledger_contents))
        
        # Read bank (if provided)
        bank_df = None
        if bank_file:
            bank_contents = await bank_file.read()
            bank_df = pd.read_csv(BytesIO(bank_contents))
        
        # Run reconciliation
        results = ReconciliationService.reconcile(
            ledger_df,
            bank_df=bank_df,
            vendor_threshold=vendor_threshold,
            date_tolerance_days=date_tolerance_days,
            amount_tolerance_pct=amount_tolerance_pct,
        )
        
        # Export to CSV
        csv_buffer = ReconciliationService.export_results_csv(results)
        
        return FileResponse(
            path=csv_buffer,
            media_type="text/csv",
            filename="reconciliation_results.csv"
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Export error: {str(e)}")
