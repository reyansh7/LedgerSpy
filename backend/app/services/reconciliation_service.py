"""
Reconciliation Service

Service layer for bank statement reconciliation.
Handles file uploads, bank statement generation, and reconciliation logic.
"""

import os
import pandas as pd
from io import BytesIO
from typing import Optional, Dict, Tuple
from datetime import datetime

from ledgerspy_engine.modules.bank_reconciliation import (
    BankStatementGenerator,
    TransactionReconciler,
)


class ReconciliationService:
    """
    Service for managing bank reconciliation workflows.
    
    Responsibilities:
    - Parse uploaded files
    - Generate bank statements
    - Run reconciliation
    - Export results
    """

    REQUIRED_LEDGER_COLUMNS = [
        "transaction_id",
        "timestamp",
        "amount",
        "source_entity",
        "destination_entity",
    ]

    REQUIRED_BANK_COLUMNS = [
        "bank_txn_id",
        "date",
        "amount",
        "from_account",
        "to_account",
    ]

    @staticmethod
    def validate_ledger(df: pd.DataFrame) -> Tuple[bool, str]:
        """
        Validate ledger dataframe has required columns.
        
        Args:
            df: DataFrame to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        missing_cols = [col for col in ReconciliationService.REQUIRED_LEDGER_COLUMNS 
                       if col not in df.columns]
        
        if missing_cols:
            return False, f"Missing columns: {', '.join(missing_cols)}"
        
        if len(df) == 0:
            return False, "Ledger is empty"
        
        return True, "Valid"

    @staticmethod
    def validate_bank(df: pd.DataFrame) -> Tuple[bool, str]:
        """
        Validate bank statement dataframe.
        
        Args:
            df: DataFrame to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        missing_cols = [col for col in ReconciliationService.REQUIRED_BANK_COLUMNS 
                       if col not in df.columns]
        
        if missing_cols:
            return False, f"Missing columns: {', '.join(missing_cols)}"
        
        if len(df) == 0:
            return False, "Bank statement is empty"
        
        return True, "Valid"

    @staticmethod
    def prepare_ledger(df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare ledger for reconciliation.
        
        Args:
            df: Raw ledger DataFrame
            
        Returns:
            Cleaned DataFrame
        """
        df = df.copy()
        
        # Ensure numeric columns
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        
        # Remove rows with missing critical data
        df = df.dropna(subset=["transaction_id", "amount", "destination_entity"])
        
        return df

    @staticmethod
    def prepare_bank(df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare bank statement for reconciliation.
        
        Args:
            df: Raw bank statement DataFrame
            
        Returns:
            Cleaned DataFrame
        """
        df = df.copy()
        
        # Ensure numeric columns
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        
        # Remove rows with missing critical data
        df = df.dropna(subset=["bank_txn_id", "amount", "to_account"])
        
        return df

    @staticmethod
    def generate_bank_statement(ledger_df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate synthetic bank statement from ledger.
        
        Args:
            ledger_df: Ledger transactions
            
        Returns:
            Generated bank statement
        """
        ledger_df = ReconciliationService.prepare_ledger(ledger_df)
        is_valid, msg = ReconciliationService.validate_ledger(ledger_df)
        
        if not is_valid:
            raise ValueError(f"Invalid ledger: {msg}")
        
        return BankStatementGenerator.generate(ledger_df)

    @staticmethod
    def reconcile(
        ledger_df: pd.DataFrame,
        bank_df: Optional[pd.DataFrame] = None,
        vendor_threshold: float = 0.85,
        date_tolerance_days: int = 1,
        amount_tolerance_pct: float = 10.0,
    ) -> Dict:
        """
        Run reconciliation between ledger and bank statement.
        
        If bank_df is None, generates one from ledger.
        
        Args:
            ledger_df: Ledger transactions
            bank_df: Bank statement (optional)
            vendor_threshold: Fuzzy match threshold
            date_tolerance_days: Date tolerance in days
            amount_tolerance_pct: Amount tolerance in percent
            
        Returns:
            Reconciliation results dict
        """
        # Prepare ledger
        ledger_df = ReconciliationService.prepare_ledger(ledger_df)
        is_valid, msg = ReconciliationService.validate_ledger(ledger_df)
        
        if not is_valid:
            raise ValueError(f"Invalid ledger: {msg}")
        
        # Generate or prepare bank statement
        if bank_df is None:
            bank_df = ReconciliationService.generate_bank_statement(ledger_df)
            generated = True
        else:
            bank_df = ReconciliationService.prepare_bank(bank_df)
            is_valid, msg = ReconciliationService.validate_bank(bank_df)
            if not is_valid:
                raise ValueError(f"Invalid bank statement: {msg}")
            generated = False
        
        # Run reconciliation
        reconciler = TransactionReconciler(
            vendor_threshold=vendor_threshold,
            date_tolerance_days=date_tolerance_days,
            amount_tolerance_pct=amount_tolerance_pct,
        )
        
        results = reconciler.reconcile(ledger_df, bank_df)
        
        # Add metadata
        results["metadata"] = {
            "reconciliation_date": datetime.now().isoformat(),
            "ledger_rows": len(ledger_df),
            "bank_rows": len(bank_df),
            "bank_generated": generated,
            "parameters": {
                "vendor_threshold": vendor_threshold,
                "date_tolerance_days": date_tolerance_days,
                "amount_tolerance_pct": amount_tolerance_pct,
            },
        }
        
        return results

    @staticmethod
    def export_results_csv(results: Dict) -> BytesIO:
        """
        Export reconciliation results to CSV.
        
        Args:
            results: Reconciliation results dict
            
        Returns:
            BytesIO object with CSV data
        """
        transactions = results.get("transactions", [])
        df = pd.DataFrame(transactions)
        
        # Reorder columns for readability
        column_order = [
            "transaction_id",
            "ledger_date",
            "ledger_amount",
            "ledger_vendor",
            "bank_txn_id",
            "bank_date",
            "bank_amount",
            "bank_vendor",
            "status",
            "reason",
            "amount_diff_pct",
            "date_diff_days",
            "vendor_match_score",
        ]
        
        df = df[[col for col in column_order if col in df.columns]]
        
        # Export to BytesIO
        buffer = BytesIO()
        df.to_csv(buffer, index=False)
        buffer.seek(0)
        
        return buffer
