"""
Bank Reconciliation Service

Comprehensive service for:
1. Auto-generating realistic bank statements from ledger
2. Reconciling ledger vs bank transactions
3. Detecting fraud patterns in mismatches
4. Providing explainable results
"""

import pandas as pd
import numpy as np
from datetime import timedelta
from typing import Dict, List, Tuple
from rapidfuzz import fuzz
from sklearn.ensemble import IsolationForest
import logging

logger = logging.getLogger(__name__)


class BankStatementGenerator:
    """Generate realistic bank statements from ledger data."""

    @staticmethod
    def generate(ledger_df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate synthetic bank statement with realistic variations.
        
        Variations introduced:
        - ~5% rows removed (missing bank entries - simulating transactions that never hit the bank)
        - ~3% amounts modified slightly (±2-5% for fees/errors)
        - Shuffled order
        
        Args:
            ledger_df: Ledger transactions DataFrame
            
        Returns:
            Generated bank statement DataFrame with columns:
            bank_txn_id, date, amount, from_account, to_account, bank_ref
        """
        bank_df = ledger_df.copy()
        
        # Rename columns to bank format
        bank_df = bank_df.rename(columns={
            'transaction_id': 'bank_txn_id',
            'timestamp': 'date',
            'source_entity': 'from_account',
            'destination_entity': 'to_account',
        })
        
        total_rows = len(bank_df)
        
        # 1. Remove ~5% of transactions (missing in bank - transactions that never hit the bank)
        missing_pct = 0.05
        missing_count = max(1, int(total_rows * missing_pct))
        missing_indices = np.random.choice(total_rows, missing_count, replace=False)
        bank_df = bank_df.drop(missing_indices).reset_index(drop=True)
        
        remaining_rows = len(bank_df)
        
        # 2. Modify ~3% of remaining amounts (bank fees or errors: ±2-5% variation)
        if remaining_rows > 0:
            amount_modification_pct = 0.03
            amount_modify_count = max(1, int(remaining_rows * amount_modification_pct))
            amount_modify_indices = np.random.choice(remaining_rows, amount_modify_count, replace=False)
            
            for idx in amount_modify_indices:
                # Small variation to simulate bank fees: ±2-5%
                variation = np.random.uniform(-0.05, 0.05)
                bank_df.loc[idx, 'amount'] = round(
                    bank_df.loc[idx, 'amount'] * (1 + variation), 2
                )
        
        # 3. Shuffle order to randomize sequence
        bank_df = bank_df.sample(frac=1).reset_index(drop=True)
        
        # Add bank reference columns for tracking
        bank_df['bank_ref'] = [f"BANK-{i:06d}" for i in range(len(bank_df))]
        
        logger.info(f"Generated bank statement: {len(bank_df)} transactions from {total_rows} ledger entries")
        logger.info(f"Missing (5%): {missing_count} rows | Amount modified (3%): {amount_modify_count} rows")
        
        return bank_df


class TransactionReconciler:
    """Reconcile ledger and bank transactions."""
    
    def __init__(self, vendor_threshold: float = 0.85, date_tolerance_days: int = 1, 
                 amount_tolerance_pct: float = 10.0):
        """
        Initialize reconciler with matching parameters.
        
        Args:
            vendor_threshold: Fuzzy match score (0-100) for vendor names
            date_tolerance_days: Allow dates within ±N days
            amount_tolerance_pct: Allow amount differences within ±N%
        """
        self.vendor_threshold = vendor_threshold
        self.date_tolerance_days = date_tolerance_days
        self.amount_tolerance_pct = amount_tolerance_pct
    
    def reconcile(self, ledger_df: pd.DataFrame, bank_df: pd.DataFrame) -> Dict:
        """
        Reconcile ledger vs bank transactions.
        
        Matching criteria:
        1. Vendor similarity (fuzzy match on destination_entity / to_account)
        2. Date within tolerance (±N days)
        3. Amount within tolerance (±N%)
        
        Returns:
            Dict with summary and transaction details
        """
        results = []
        matched_bank_ids = set()
        
        # Convert dates to date-only for comparison
        ledger_df['date'] = pd.to_datetime(ledger_df['timestamp']).dt.date
        bank_df['date'] = pd.to_datetime(bank_df['date']).dt.date
        
        for _, ledger_row in ledger_df.iterrows():
            best_match = None
            best_score = 0
            best_bank_idx = None
            
            ledger_vendor = str(ledger_row['destination_entity']).lower().strip()
            ledger_amount = float(ledger_row['amount'])
            ledger_date = ledger_row['date']
            
            # Search for best match in bank
            for bank_idx, bank_row in bank_df.iterrows():
                if bank_idx in matched_bank_ids:
                    continue
                
                bank_vendor = str(bank_row['to_account']).lower().strip()
                bank_amount = float(bank_row['amount'])
                bank_date = bank_row['date']
                
                # Check vendor similarity
                vendor_score = fuzz.token_set_ratio(ledger_vendor, bank_vendor)
                
                if vendor_score < self.vendor_threshold:
                    continue
                
                # Check date tolerance
                date_diff = abs((ledger_date - bank_date).days)
                if date_diff > self.date_tolerance_days:
                    continue
                
                # Calculate amount difference
                amount_diff_pct = abs(ledger_amount - bank_amount) / ledger_amount * 100 if ledger_amount != 0 else 0
                
                # Check amount tolerance
                if amount_diff_pct > self.amount_tolerance_pct:
                    continue
                
                # This is a valid match - calculate composite score
                composite_score = vendor_score - (date_diff * 5) - (amount_diff_pct * 0.5)
                
                if composite_score > best_score:
                    best_score = composite_score
                    best_match = bank_row
                    best_bank_idx = bank_idx
            
            # Classify transaction based on match quality
            if best_match is not None:
                amount_diff_pct = abs(ledger_row['amount'] - best_match['amount']) / ledger_row['amount'] * 100 if ledger_row['amount'] != 0 else 0
                
                # Determine status
                if amount_diff_pct < 1:
                    status = "MATCHED"
                else:
                    status = "PARTIAL"
                
                matched_bank_ids.add(best_bank_idx)
                date_diff = abs((ledger_date - best_match['date']).days)
                
                results.append({
                    'id': ledger_row['transaction_id'],
                    'date': ledger_row['timestamp'].isoformat() if pd.notna(ledger_row['timestamp']) else None,
                    'ledger_amount': float(ledger_row['amount']),
                    'bank_amount': float(best_match['amount']),
                    'status': status,
                    'ledger_vendor': ledger_row['destination_entity'],
                    'bank_vendor': best_match['to_account'],
                    'bank_txn_id': best_match['bank_txn_id'],
                    'bank_date': best_match['date'].isoformat(),
                    'vendor_match_score': round(best_score, 1),
                    'amount_diff_pct': round(amount_diff_pct, 2),
                    'date_diff_days': date_diff,
                })
            else:
                # No match found - transaction is MISSING from bank statement
                results.append({
                    'id': ledger_row['transaction_id'],
                    'date': ledger_row['timestamp'].isoformat() if pd.notna(ledger_row['timestamp']) else None,
                    'ledger_amount': float(ledger_row['amount']),
                    'bank_amount': None,  # Null to indicate missing
                    'status': "MISSING",
                    'ledger_vendor': ledger_row['destination_entity'],
                    'bank_vendor': None,
                    'bank_txn_id': None,
                    'bank_date': None,
                    'vendor_match_score': 0,
                    'amount_diff_pct': None,
                    'date_diff_days': None,
                })
        
        # Add extra bank transactions (not matched) - optional, can be included or filtered
        # Note: These are transactions in bank but not in ledger (rare, usually data quality issues)
        # Uncomment to include unmatched bank transactions in results
        # for bank_idx, bank_row in bank_df.iterrows():
        #     if bank_idx not in matched_bank_ids:
        #         results.append({
        #             'id': None,
        #             'date': None,
        #             'ledger_amount': None,
        #             'bank_amount': float(bank_row['amount']),
        #             'status': 'EXTRA_IN_BANK',
        #             'ledger_vendor': None,
        #             'bank_vendor': bank_row['to_account'],
        #             'bank_txn_id': bank_row['bank_txn_id'],
        #             'bank_date': bank_row['date'].isoformat(),
        #             'vendor_match_score': 0,
        #             'amount_diff_pct': None,
        #             'date_diff_days': None,
        #         })
        
        
        # Calculate summary
        total = len(results)
        matched = len([r for r in results if r['status'] == 'MATCHED'])
        partial = len([r for r in results if r['status'] == 'PARTIAL'])
        missing = len([r for r in results if r['status'] in ['MISSING', 'EXTRA_IN_BANK']])
        
        summary = {
            'total_transactions': total,
            'matched': matched,
            'partial_match': partial,
            'missing_or_extra': missing,
            'reconciliation_rate': round((matched + partial) / total * 100, 2) if total > 0 else 0,
        }
        
        return {
            'summary': summary,
            'results': results,
        }


class FraudDetector:
    """Detect fraud patterns in reconciliation mismatches."""
    
    @staticmethod
    def detect_anomalies(ledger_df: pd.DataFrame, reconciliation_results: List[Dict]) -> List[Dict]:
        """
        Enhance reconciliation results with fraud detection.
        
        Analyzes:
        1. Amount anomalies (Isolation Forest)
        2. Benford's Law deviations
        3. Vendor duplication patterns
        
        Args:
            ledger_df: Original ledger DataFrame
            reconciliation_results: Results from reconciliation
            
        Returns:
            Enhanced results with fraud scores and flags
        """
        enhanced_results = []
        
        for result in reconciliation_results:
            fraud_flags = []
            risk_score = 0
            explanation = ""
            
            # 1. Analyze amount anomalies using Isolation Forest
            if result['ledger_amount'] is not None:
                amount_anomaly_score = FraudDetector._detect_amount_anomaly(
                    ledger_df, result['ledger_amount']
                )
                if amount_anomaly_score > 0.5:
                    fraud_flags.append("Unusual Amount")
                    risk_score += 25
            
            # 2. Check Benford's Law
            if result['ledger_amount'] is not None:
                benford_deviation = FraudDetector._check_benford_law(result['ledger_amount'])
                if benford_deviation > 0.3:
                    fraud_flags.append("Benford Deviation")
                    risk_score += 15
            
            # 3. Detect vendor duplication
            vendor_duplication_score = FraudDetector._detect_vendor_duplication(
                ledger_df, result['ledger_vendor']
            )
            if vendor_duplication_score > 0.6:
                fraud_flags.append("Duplicate Vendor")
                risk_score += 20
            
            # 4. Check reconciliation status
            if result['status'] == 'Missing':
                fraud_flags.append("Missing from Bank")
                risk_score += 30
            elif result['status'] == 'Extra in Bank':
                fraud_flags.append("Extra in Bank")
                risk_score += 25
            elif result['status'] == 'Partial Match':
                if result['amount_diff_pct'] and result['amount_diff_pct'] > 5:
                    fraud_flags.append("Large Amount Discrepancy")
                    risk_score += 20
            
            # Cap risk score at 100
            risk_score = min(100, risk_score)
            
            # Generate explanation
            if fraud_flags:
                explanation = f"Transaction flagged due to: {', '.join(fraud_flags)}"
            else:
                explanation = "Transaction appears normal"
            
            result['risk_score'] = risk_score
            result['fraud_flags'] = fraud_flags
            result['explanation'] = explanation
            enhanced_results.append(result)
        
        return enhanced_results
    
    @staticmethod
    def _detect_amount_anomaly(ledger_df: pd.DataFrame, amount: float) -> float:
        """Detect if amount is anomalous using Isolation Forest."""
        try:
            amounts = ledger_df['amount'].values.reshape(-1, 1)
            
            if len(amounts) < 10:
                return 0.0
            
            iso_forest = IsolationForest(contamination=0.1, random_state=42)
            predictions = iso_forest.fit_predict(amounts)
            
            # Predict for this amount
            current_prediction = iso_forest.predict([[amount]])[0]
            
            if current_prediction == -1:  # Anomaly
                score = abs(iso_forest.score_samples([[amount]])[0])
                return min(1.0, score)
            return 0.0
        except Exception as e:
            logger.error(f"Error detecting amount anomaly: {e}")
            return 0.0
    
    @staticmethod
    def _check_benford_law(amount: float) -> float:
        """Check if amount deviates from Benford's Law."""
        try:
            # Get first digit
            first_digit = int(str(int(abs(amount)))[0])
            
            # Benford's Law probabilities
            benford_probs = {
                1: 0.301, 2: 0.176, 3: 0.125, 4: 0.097,
                5: 0.079, 6: 0.067, 7: 0.058, 8: 0.051, 9: 0.046
            }
            
            expected_prob = benford_probs.get(first_digit, 0)
            
            # Simple deviation: if low probability first digit, flag as deviation
            if expected_prob < 0.08:
                return 0.5
            return 0.0
        except Exception as e:
            logger.error(f"Error checking Benford's Law: {e}")
            return 0.0
    
    @staticmethod
    def _detect_vendor_duplication(ledger_df: pd.DataFrame, vendor: str) -> float:
        """Detect if vendor appears frequently (duplication pattern)."""
        try:
            if vendor is None:
                return 0.0
            
            vendor_lower = str(vendor).lower()
            similar_vendors = ledger_df['destination_entity'].apply(
                lambda x: fuzz.token_set_ratio(vendor_lower, str(x).lower())
            )
            
            # Count how many vendors have high similarity
            high_similarity_count = (similar_vendors > 80).sum()
            
            # Normalize: duplication score increases with count
            duplication_score = min(1.0, high_similarity_count / len(ledger_df))
            return duplication_score
        except Exception as e:
            logger.error(f"Error detecting vendor duplication: {e}")
            return 0.0
    
    @staticmethod
    def generate_benford_analysis(results: List[Dict]) -> Dict:
        """Generate Benford's Law analysis summary."""
        first_digits = []
        
        for result in results:
            if result['ledger_amount'] is not None:
                try:
                    first_digit = int(str(int(abs(result['ledger_amount'])))[0])
                    first_digits.append(first_digit)
                except:
                    pass
        
        # Calculate distribution
        distribution = {}
        for digit in range(1, 10):
            count = first_digits.count(digit)
            distribution[str(digit)] = {
                'count': count,
                'percentage': round((count / len(first_digits) * 100) if first_digits else 0, 2),
                'benford_expected': [30.1, 17.6, 12.5, 9.7, 7.9, 6.7, 5.8, 5.1, 4.6][digit - 1]
            }
        
        return {
            'total_transactions_analyzed': len(first_digits),
            'first_digit_distribution': distribution,
        }
