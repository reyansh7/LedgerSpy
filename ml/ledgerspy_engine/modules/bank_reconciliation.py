"""
Bank Statement Reconciliation Engine

Compares ledger transactions with bank statements and classifies matches.
Supports fuzzy matching for vendor names and date tolerance.

Author: LedgerSpy Team
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Optional
from difflib import SequenceMatcher
from datetime import datetime, timedelta


class BankStatementGenerator:
    """
    Generate realistic bank statement data from ledger transactions.
    
    Simulates:
    - ~10% missing transactions (not shown in bank)
    - ~10% partial matches (amount discrepancies)
    - Shuffled order
    - Banking-format columns
    """

    @staticmethod
    def generate(
        ledger_df: pd.DataFrame,
        missing_pct: float = 0.10,
        partial_match_pct: float = 0.10,
        amount_variance_pct: float = 5.0,
        random_seed: int = 42,
    ) -> pd.DataFrame:
        """
        Generate a bank statement from ledger data.

        Args:
            ledger_df: DataFrame with columns [transaction_id, timestamp, amount, 
                       source_entity, destination_entity]
            missing_pct: Fraction of rows to randomly drop (~missing from bank)
            partial_match_pct: Fraction of rows to modify amounts
            amount_variance_pct: Max % variation for partial matches
            random_seed: Seed for reproducibility

        Returns:
            Bank statement DataFrame with columns:
            [bank_txn_id, date, amount, from_account, to_account, orig_txn_id]
        """
        np.random.seed(random_seed)
        bank_df = ledger_df.copy()

        # Step 1: Remove ~10% of rows (missing transactions)
        n_missing = int(len(bank_df) * missing_pct)
        missing_indices = np.random.choice(bank_df.index, size=n_missing, replace=False)
        bank_df = bank_df.drop(missing_indices)

        # Step 2: Modify ~10% of amounts (partial matches)
        n_partial = int(len(bank_df) * partial_match_pct)
        partial_indices = np.random.choice(bank_df.index, size=n_partial, replace=False)
        
        for idx in partial_indices:
            variance = np.random.uniform(-amount_variance_pct, amount_variance_pct) / 100.0
            bank_df.loc[idx, "amount"] = bank_df.loc[idx, "amount"] * (1 + variance)

        # Step 3: Round amounts to cents (realistic banking)
        bank_df["amount"] = bank_df["amount"].round(2)

        # Step 4: Rename columns to banking format
        bank_df = bank_df.rename(
            columns={
                "transaction_id": "bank_txn_id",
                "timestamp": "date",
                "source_entity": "from_account",
                "destination_entity": "to_account",
            }
        )

        # Step 5: Keep original txn_id for reconciliation reference
        bank_df["orig_txn_id"] = bank_df["bank_txn_id"]
        bank_df["bank_txn_id"] = [f"BANK_{i:06d}" for i in range(len(bank_df))]

        # Step 6: Shuffle order (banks don't return in same order)
        bank_df = bank_df.sample(frac=1, random_state=random_seed).reset_index(drop=True)

        # Step 7: Select and reorder columns
        return bank_df[["bank_txn_id", "date", "amount", "from_account", "to_account", "orig_txn_id"]]


class VendorMatcher:
    """
    Fuzzy matching for vendor/account names.
    Uses sequence matching to handle slight name variations.
    """

    @staticmethod
    def similarity_ratio(str1: str, str2: str) -> float:
        """
        Calculate similarity between two strings (0.0 to 1.0).
        
        Args:
            str1: First string
            str2: Second string
            
        Returns:
            Similarity ratio (0-1)
        """
        if not str1 or not str2:
            return 0.0
        
        # Normalize: lowercase, strip whitespace
        s1 = str(str1).lower().strip()
        s2 = str(str2).lower().strip()
        
        # Exact match
        if s1 == s2:
            return 1.0
        
        # Sequence matching
        return SequenceMatcher(None, s1, s2).ratio()

    @staticmethod
    def fuzzy_match(
        ledger_vendor: str,
        bank_vendor: str,
        threshold: float = 0.85,
    ) -> bool:
        """
        Check if vendor names are similar enough.
        
        Args:
            ledger_vendor: Vendor name from ledger
            bank_vendor: Account name from bank
            threshold: Minimum similarity ratio (0-1)
            
        Returns:
            True if similarity >= threshold
        """
        ratio = VendorMatcher.similarity_ratio(ledger_vendor, bank_vendor)
        return ratio >= threshold


class TransactionReconciler:
    """
    Match and reconcile ledger transactions with bank statements.
    
    Matching logic:
    1. Match on date (exact or ±1 day) + vendor name (fuzzy match)
    2. Check amount difference (exact or within 10%)
    3. Classify as: Matched, Partial Match, or Missing
    """

    # Status classifications
    STATUS_MATCHED = "Matched"
    STATUS_PARTIAL = "Partial Match"
    STATUS_MISSING = "Missing"
    
    # Colors
    COLOR_MATCHED = "#00e676"  # Green
    COLOR_PARTIAL = "#FFAC1C"  # Orange/Yellow
    COLOR_MISSING = "#FF3131"  # Red

    def __init__(
        self,
        vendor_threshold: float = 0.85,
        date_tolerance_days: int = 1,
        amount_tolerance_pct: float = 10.0,
    ):
        """
        Initialize reconciler.
        
        Args:
            vendor_threshold: Fuzzy match threshold for vendor names
            date_tolerance_days: Allow dates within ±N days
            amount_tolerance_pct: Allow amount differences within ±N%
        """
        self.vendor_threshold = vendor_threshold
        self.date_tolerance_days = date_tolerance_days
        self.amount_tolerance_pct = amount_tolerance_pct

    def reconcile(
        self,
        ledger_df: pd.DataFrame,
        bank_df: pd.DataFrame,
    ) -> Dict[str, any]:
        """
        Reconcile ledger against bank statement.
        
        Args:
            ledger_df: Ledger transactions
            bank_df: Bank statement
            
        Returns:
            Dictionary with:
            - transactions: List of reconciliation records
            - summary: Summary statistics
        """
        # Ensure date columns are datetime
        ledger_df["timestamp"] = pd.to_datetime(ledger_df["timestamp"])
        bank_df["date"] = pd.to_datetime(bank_df["date"])

        reconciliation_results = []
        matched_bank_txns = set()

        # For each ledger transaction, find matching bank transaction
        for _, ledger_row in ledger_df.iterrows():
            result = self._match_transaction(
                ledger_row,
                bank_df,
                matched_bank_txns,
            )
            reconciliation_results.append(result)
            
            # Track matched bank transactions
            if result["status"] != self.STATUS_MISSING:
                matched_bank_txns.add(result.get("bank_txn_id"))

        # Add any bank transactions not matched (extra in bank)
        for _, bank_row in bank_df.iterrows():
            if bank_row["bank_txn_id"] not in matched_bank_txns:
                reconciliation_results.append({
                    "transaction_id": None,
                    "ledger_date": None,
                    "ledger_amount": None,
                    "ledger_vendor": None,
                    "bank_txn_id": bank_row["bank_txn_id"],
                    "bank_date": bank_row["date"].isoformat() if pd.notna(bank_row["date"]) else None,
                    "bank_amount": float(bank_row["amount"]),
                    "bank_vendor": bank_row["to_account"],
                    "status": "Extra in Bank",
                    "color": "#FFC107",  # Amber
                    "reason": "Transaction in bank statement but not in ledger",
                    "amount_diff": None,
                    "date_diff_days": None,
                    "vendor_match_score": None,
                })

        # Calculate summary statistics
        summary = self._calculate_summary(reconciliation_results)

        return {
            "transactions": reconciliation_results,
            "summary": summary,
        }

    def _match_transaction(
        self,
        ledger_row: pd.Series,
        bank_df: pd.DataFrame,
        already_matched: set,
    ) -> Dict[str, any]:
        """
        Find best matching bank transaction for a ledger transaction.
        
        Args:
            ledger_row: Single ledger transaction
            bank_df: All bank transactions
            already_matched: Set of already-matched bank txn IDs
            
        Returns:
            Reconciliation record
        """
        ledger_date = pd.to_datetime(ledger_row["timestamp"])
        ledger_amount = float(ledger_row["amount"])
        ledger_vendor = str(ledger_row["destination_entity"])
        ledger_txn_id = str(ledger_row["transaction_id"])

        best_match = None
        best_score = 0.0

        # Find candidates within date tolerance
        for _, bank_row in bank_df.iterrows():
            if bank_row["bank_txn_id"] in already_matched:
                continue

            bank_date = pd.to_datetime(bank_row["date"])
            bank_amount = float(bank_row["amount"])
            bank_vendor = str(bank_row["to_account"])
            bank_txn_id = str(bank_row["bank_txn_id"])

            # Date matching (within tolerance)
            date_diff = abs((bank_date - ledger_date).days)
            if date_diff > self.date_tolerance_days:
                continue

            # Vendor matching (fuzzy)
            vendor_match_score = VendorMatcher.similarity_ratio(
                ledger_vendor, bank_vendor
            )
            if vendor_match_score < self.vendor_threshold:
                continue

            # Amount matching
            amount_diff = abs(bank_amount - ledger_amount)
            amount_diff_pct = (amount_diff / ledger_amount * 100) if ledger_amount > 0 else 0

            # Score this match (lower is better)
            match_quality = (
                date_diff * 0.1 +  # Prefer closer dates
                (1 - vendor_match_score) * 10 +  # Prefer exact vendor match
                amount_diff_pct * 0.5  # Prefer exact amounts
            )

            if best_match is None or match_quality < best_score:
                best_match = {
                    "bank_row": bank_row,
                    "date_diff": date_diff,
                    "amount_diff": amount_diff,
                    "amount_diff_pct": amount_diff_pct,
                    "vendor_match_score": vendor_match_score,
                    "quality_score": match_quality,
                }
                best_score = match_quality

        # Classify match result
        if best_match is None:
            return {
                "transaction_id": ledger_txn_id,
                "ledger_date": ledger_date.isoformat(),
                "ledger_amount": ledger_amount,
                "ledger_vendor": ledger_vendor,
                "bank_txn_id": None,
                "bank_date": None,
                "bank_amount": None,
                "bank_vendor": None,
                "status": self.STATUS_MISSING,
                "color": self.COLOR_MISSING,
                "reason": "No matching transaction found in bank statement",
                "amount_diff": None,
                "date_diff_days": None,
                "vendor_match_score": None,
            }

        # Build match result
        bank_row = best_match["bank_row"]
        amount_diff_pct = best_match["amount_diff_pct"]

        # Determine status
        if amount_diff_pct < 1.0:
            status = self.STATUS_MATCHED
            color = self.COLOR_MATCHED
            reason = "Exact match"
        elif amount_diff_pct <= self.amount_tolerance_pct:
            status = self.STATUS_PARTIAL
            color = self.COLOR_PARTIAL
            reason = f"Amount difference: {amount_diff_pct:.2f}%"
        else:
            status = self.STATUS_MISSING
            color = self.COLOR_MISSING
            reason = f"Amount difference too large: {amount_diff_pct:.2f}%"

        return {
            "transaction_id": ledger_txn_id,
            "ledger_date": ledger_date.isoformat(),
            "ledger_amount": ledger_amount,
            "ledger_vendor": ledger_vendor,
            "bank_txn_id": str(bank_row["bank_txn_id"]),
            "bank_date": pd.to_datetime(bank_row["date"]).isoformat(),
            "bank_amount": float(bank_row["amount"]),
            "bank_vendor": str(bank_row["to_account"]),
            "status": status,
            "color": color,
            "reason": reason,
            "amount_diff": float(best_match["amount_diff"]),
            "amount_diff_pct": float(best_match["amount_diff_pct"]),
            "date_diff_days": int(best_match["date_diff"]),
            "vendor_match_score": float(best_match["vendor_match_score"]),
        }

    def _calculate_summary(self, results: List[Dict]) -> Dict[str, any]:
        """
        Calculate summary statistics from reconciliation results.
        
        Args:
            results: List of reconciliation records
            
        Returns:
            Summary dictionary
        """
        total = len(results)
        
        matched = sum(1 for r in results if r["status"] == self.STATUS_MATCHED)
        partial = sum(1 for r in results if r["status"] == self.STATUS_PARTIAL)
        missing = sum(1 for r in results if r["status"] == self.STATUS_MISSING)
        extra = sum(1 for r in results if r["status"] == "Extra in Bank")

        return {
            "total_transactions": total,
            "matched": {
                "count": matched,
                "percentage": (matched / total * 100) if total > 0 else 0,
            },
            "partial": {
                "count": partial,
                "percentage": (partial / total * 100) if total > 0 else 0,
            },
            "missing": {
                "count": missing,
                "percentage": (missing / total * 100) if total > 0 else 0,
            },
            "extra_in_bank": {
                "count": extra,
                "percentage": (extra / total * 100) if total > 0 else 0,
            },
            "reconciliation_rate": ((matched + partial) / total * 100) if total > 0 else 0,
        }


# Convenience functions
def generate_bank_statement(
    ledger_df: pd.DataFrame,
    **kwargs
) -> pd.DataFrame:
    """Generate bank statement from ledger."""
    return BankStatementGenerator.generate(ledger_df, **kwargs)


def reconcile_transactions(
    ledger_df: pd.DataFrame,
    bank_df: pd.DataFrame,
    **kwargs
) -> Dict[str, any]:
    """Reconcile ledger with bank statement."""
    reconciler = TransactionReconciler(**kwargs)
    return reconciler.reconcile(ledger_df, bank_df)
