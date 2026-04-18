"""
Bank Reconciliation API Routes

FastAPI endpoints for automated bank reconciliation and fraud detection.

Endpoints:
- POST /api/reconciliation/auto-reconcile - Complete auto-reconciliation (ledger only)
- POST /api/reconciliation/reconcile-full - Reconciliation with uploaded bank statement
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
from io import BytesIO
from datetime import datetime
import logging

from app.services.bank_reconciliation_service import (
    BankStatementGenerator,
    TransactionReconciler,
    FraudDetector,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reconciliation", tags=["reconciliation"])


@router.post("/auto-reconcile")
async def auto_reconcile(
    ledger_file: UploadFile = File(...),
    vendor_threshold: float = Form(default=0.85),
    date_tolerance_days: int = Form(default=1),
    amount_tolerance_pct: float = Form(default=10.0),
):
    """
    Complete automated reconciliation with fraud detection.
    
    Only requires ledger CSV upload. Auto-generates bank statement internally.
    
    Args:
        ledger_file: Ledger CSV with columns:
                     transaction_id, timestamp, amount, source_entity, destination_entity
        vendor_threshold: Fuzzy match threshold (0-100), default 0.85
        date_tolerance_days: Date tolerance in days, default 1
        amount_tolerance_pct: Amount tolerance in percent, default 10
    
    Returns:
        JSON with summary, reconciliation results, and fraud analysis
    """
    try:
        # Read ledger CSV
        contents = await ledger_file.read()
        ledger_df = pd.read_csv(BytesIO(contents))
        
        # Validate ledger
        required_columns = ['transaction_id', 'timestamp', 'amount', 'source_entity', 'destination_entity']
        missing_cols = [col for col in required_columns if col not in ledger_df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {', '.join(missing_cols)}")
        
        if len(ledger_df) == 0:
            raise ValueError("Ledger file is empty")
        
        # Prepare ledger
        ledger_df['amount'] = pd.to_numeric(ledger_df['amount'], errors='coerce')
        ledger_df['timestamp'] = pd.to_datetime(ledger_df['timestamp'], errors='coerce')
        ledger_df = ledger_df.dropna(subset=['transaction_id', 'amount', 'destination_entity'])
        
        logger.info(f"Loaded ledger with {len(ledger_df)} transactions")
        
        # Step 1: Generate bank statement
        bank_df = BankStatementGenerator.generate(ledger_df)
        logger.info(f"Generated bank statement with {len(bank_df)} transactions")
        
        # Step 2: Run reconciliation
        reconciler = TransactionReconciler(
            vendor_threshold=vendor_threshold,
            date_tolerance_days=date_tolerance_days,
            amount_tolerance_pct=amount_tolerance_pct,
        )
        reconciliation_results = reconciler.reconcile(ledger_df, bank_df)
        logger.info("Reconciliation complete")
        
        # Step 3: Fraud detection on mismatches
        enhanced_results = FraudDetector.detect_anomalies(
            ledger_df, reconciliation_results['results']
        )
        logger.info("Fraud analysis complete")
        
        # Step 4: Benford analysis
        benford_analysis = FraudDetector.generate_benford_analysis(enhanced_results)
        
        # Identify high-risk transactions
        high_risk_count = len([r for r in enhanced_results if r.get('risk_score', 0) > 50])
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "summary": {
                **reconciliation_results['summary'],
                "high_risk_count": high_risk_count,
                "processing_notes": {
                    "bank_generated": True,
                    "vendor_threshold": vendor_threshold,
                    "date_tolerance_days": date_tolerance_days,
                    "amount_tolerance_pct": amount_tolerance_pct,
                }
            },
            "results": enhanced_results,
            "benford_analysis": benford_analysis,
            "statistics": {
                "total_transactions": len(enhanced_results),
                "high_risk_transactions": high_risk_count,
                "average_risk_score": round(
                    sum(r.get('risk_score', 0) for r in enhanced_results) / len(enhanced_results), 2
                ) if enhanced_results else 0,
                "fraud_flags_breakdown": _count_fraud_flags(enhanced_results),
            }
        }
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
    except Exception as e:
        logger.error(f"Error in auto-reconciliation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.post("/reconcile-full")
async def reconcile_full(
    ledger_file: UploadFile = File(...),
    bank_file: UploadFile = File(...),
    vendor_threshold: float = Form(default=0.85),
    date_tolerance_days: int = Form(default=1),
    amount_tolerance_pct: float = Form(default=10.0),
):
    """
    Reconciliation with user-provided bank statement (no generation).
    
    Args:
        ledger_file: Ledger CSV
        bank_file: Bank statement CSV with columns:
                   bank_txn_id, date, amount, from_account, to_account
        vendor_threshold: Fuzzy match threshold
        date_tolerance_days: Date tolerance in days
        amount_tolerance_pct: Amount tolerance in percent
    
    Returns:
        JSON with reconciliation results and fraud analysis
    """
    try:
        # Read both files
        ledger_contents = await ledger_file.read()
        bank_contents = await bank_file.read()
        
        ledger_df = pd.read_csv(BytesIO(ledger_contents))
        bank_df = pd.read_csv(BytesIO(bank_contents))
        
        # Validate ledger
        ledger_required = ['transaction_id', 'timestamp', 'amount', 'destination_entity']
        missing_ledger = [col for col in ledger_required if col not in ledger_df.columns]
        if missing_ledger:
            raise ValueError(f"Ledger missing columns: {', '.join(missing_ledger)}")
        
        # Validate bank
        bank_required = ['bank_txn_id', 'date', 'amount', 'to_account']
        missing_bank = [col for col in bank_required if col not in bank_df.columns]
        if missing_bank:
            raise ValueError(f"Bank statement missing columns: {', '.join(missing_bank)}")
        
        # Prepare data
        ledger_df['amount'] = pd.to_numeric(ledger_df['amount'], errors='coerce')
        ledger_df['timestamp'] = pd.to_datetime(ledger_df['timestamp'], errors='coerce')
        ledger_df = ledger_df.dropna(subset=['transaction_id', 'amount', 'destination_entity'])
        
        bank_df['amount'] = pd.to_numeric(bank_df['amount'], errors='coerce')
        bank_df['date'] = pd.to_datetime(bank_df['date'], errors='coerce')
        bank_df = bank_df.dropna(subset=['bank_txn_id', 'amount', 'to_account'])
        
        logger.info(f"Loaded ledger: {len(ledger_df)} | Bank: {len(bank_df)}")
        
        # Run reconciliation
        reconciler = TransactionReconciler(
            vendor_threshold=vendor_threshold,
            date_tolerance_days=date_tolerance_days,
            amount_tolerance_pct=amount_tolerance_pct,
        )
        reconciliation_results = reconciler.reconcile(ledger_df, bank_df)
        
        # Fraud detection
        enhanced_results = FraudDetector.detect_anomalies(
            ledger_df, reconciliation_results['results']
        )
        
        benford_analysis = FraudDetector.generate_benford_analysis(enhanced_results)
        high_risk_count = len([r for r in enhanced_results if r.get('risk_score', 0) > 50])
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "summary": {
                **reconciliation_results['summary'],
                "high_risk_count": high_risk_count,
                "processing_notes": {
                    "bank_generated": False,
                    "vendor_threshold": vendor_threshold,
                    "date_tolerance_days": date_tolerance_days,
                    "amount_tolerance_pct": amount_tolerance_pct,
                }
            },
            "results": enhanced_results,
            "benford_analysis": benford_analysis,
            "statistics": {
                "total_transactions": len(enhanced_results),
                "high_risk_transactions": high_risk_count,
                "average_risk_score": round(
                    sum(r.get('risk_score', 0) for r in enhanced_results) / len(enhanced_results), 2
                ) if enhanced_results else 0,
                "fraud_flags_breakdown": _count_fraud_flags(enhanced_results),
            }
        }
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
    except Exception as e:
        logger.error(f"Error in full reconciliation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


def _count_fraud_flags(results: list) -> dict:
    """Count occurrences of each fraud flag."""
    flag_counts = {}
    
    for result in results:
        for flag in result.get('fraud_flags', []):
            flag_counts[flag] = flag_counts.get(flag, 0) + 1
    
    return flag_counts
