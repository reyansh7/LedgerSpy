"""
Vendor Matching Service
Detects potential ghost vendors and collusion patterns using fuzzy matching
"""
import pandas as pd
import numpy as np
from fuzzywuzzy import fuzz
from fuzzywuzzy import process
from pathlib import Path
from typing import List, Dict

class VendorMatchingService:
    """
    Identifies potential ghost vendors (name variations) by comparing
    ledger vendor names against vendor master database.
    """
    
    def __init__(self, vendor_master_path: str = None, ledger_path: str = None):
        """
        Initialize with vendor master and ledger data
        
        Args:
            vendor_master_path: Path to vendors4.csv (vendor master)
            ledger_path: Path to ledger4.csv (transaction data)
        """
        self.vendor_master_path = vendor_master_path or self._find_file('vendors4.csv')
        self.ledger_path = ledger_path or self._find_file('ledger4.csv')
        
        self.vendor_master_df = None
        self.ledger_df = None
        self.matches = []
        
        self._load_data()
    
    @staticmethod
    def _find_file(filename: str):
        """Find file in ml directory"""
        search_paths = [
            Path(f'../ml/{filename}'),
            Path(f'ml/{filename}'),
            Path(f'../../ml/{filename}'),
        ]
        for path in search_paths:
            if path.exists():
                return str(path)
        return filename
    
    def _load_data(self):
        """Load vendor master and ledger data"""
        try:
            self.vendor_master_df = pd.read_csv(self.vendor_master_path)
            print(f"? Loaded vendor master: {len(self.vendor_master_df)} vendors")
        except Exception as e:
            print(f"? Could not load vendor master: {e}")
            self.vendor_master_df = pd.DataFrame()
        
        try:
            self.ledger_df = pd.read_csv(self.ledger_path)
            print(f"? Loaded ledger: {len(self.ledger_df)} transactions")
        except Exception as e:
            print(f"? Could not load ledger: {e}")
            self.ledger_df = pd.DataFrame()
    
    def find_vendor_matches(self, threshold: int = 80) -> List[Dict]:
        """
        Find potential ghost vendors (similar names that might be collusion)
        
        Args:
            threshold: Similarity threshold (0-100)
        
        Returns:
            List of matched vendor pairs with similarity scores
        """
        if self.vendor_master_df.empty or self.ledger_df.empty:
            return []
        
        master_vendors = self.vendor_master_df['vendor_name'].unique()
        ledger_vendors = self.ledger_df['vendor_name'].unique()
        
        matches = []
        
        for ledger_vendor in ledger_vendors:
            if pd.isna(ledger_vendor) or str(ledger_vendor).strip() == '':
                continue
            
            # Find best match in master
            best_match = process.extractOne(
                str(ledger_vendor), 
                [str(v) for v in master_vendors],
                scorer=fuzz.token_set_ratio
            )
            
            if best_match and best_match[1] >= threshold:
                master_vendor = best_match[0]
                similarity = best_match[1]
                
                # Get transaction count
                ledger_count = len(self.ledger_df[self.ledger_df['vendor_name'] == ledger_vendor])
                master_row = self.vendor_master_df[self.vendor_master_df['vendor_name'] == master_vendor]
                
                risk_score = (100 - similarity) / 100 * 10  # Lower similarity = higher risk
                
                match_obj = {
                    'ledger_name': ledger_vendor,
                    'master_name': master_vendor,
                    'similarity': similarity,
                    'risk_score': round(risk_score, 2),
                    'transaction_count': ledger_count,
                    'gst': master_row['gst'].values[0] if not master_row.empty else None,
                    'city': master_row['city'].values[0] if not master_row.empty else None,
                    'is_suspicious': similarity < 95  # Less than 95% = potential ghost vendor
                }
                
                matches.append(match_obj)
        
        # Sort by risk score descending
        self.matches = sorted(matches, key=lambda x: x['risk_score'], reverse=True)
        return self.matches
    
    def get_high_risk_vendors(self, threshold: int = 5) -> List[Dict]:
        """
        Get vendors with high risk scores (potential ghost vendors)
        
        Args:
            threshold: Risk score threshold
        
        Returns:
            List of high-risk vendor pairs
        """
        if not self.matches:
            self.find_vendor_matches()
        
        return [m for m in self.matches if m['risk_score'] > threshold or m['is_suspicious']]
    
    def calculate_collusion_score(self) -> Dict:
        """
        Calculate overall collusion risk score based on:
        - Number of potential ghost vendors
        - Transaction patterns
        - Risk concentration
        """
        high_risk = self.get_high_risk_vendors()
        
        if not high_risk:
            return {
                'collusion_risk': 0,
                'high_risk_vendor_pairs': 0,
                'assessment': 'Low Risk',
                'details': 'No suspicious vendor name patterns detected',
                'recommendations': ['Maintain existing vendor registration controls']
            }
        
        # Calculate risk metrics
        avg_risk = np.mean([v['risk_score'] for v in high_risk])
        suspicious_count = len([v for v in high_risk if v['is_suspicious']])
        total_txns_high_risk = sum([v['transaction_count'] for v in high_risk])
        
        # Risk = (suspicious vendor pairs * weight1) + (avg risk score * weight2) + (transaction concentration * weight3)
        collusion_risk = min(100, (suspicious_count * 15) + (avg_risk * 5) + (total_txns_high_risk / max(len(self.ledger_df), 1) * 100 * 0.1))
        
        return {
            'collusion_risk': round(collusion_risk, 1),
            'high_risk_vendor_pairs': suspicious_count,
            'average_risk_score': round(avg_risk, 2),
            'total_suspicious_transactions': total_txns_high_risk,
            'assessment': self._assess_collusion(collusion_risk),
            'recommendations': self._get_recommendations(collusion_risk)
        }
    
    @staticmethod
    def _assess_collusion(risk_score: float) -> str:
        """Assess collusion risk level"""
        if risk_score >= 70:
            return 'CRITICAL - Investigate immediately'
        elif risk_score >= 50:
            return 'HIGH - Schedule deep dive review'
        elif risk_score >= 30:
            return 'MODERATE - Include in audit plan'
        else:
            return 'LOW - Continue monitoring'
    
    @staticmethod
    def _get_recommendations(risk_score: float) -> List[str]:
        """Get audit recommendations based on risk"""
        recommendations = []
        
        if risk_score >= 70:
            recommendations.extend([
                'Verify all vendor master records independently',
                'Check for shared addresses/bank accounts',
                'Interview approvers for high-risk transactions',
                'Review payment history for circular patterns'
            ])
        elif risk_score >= 50:
            recommendations.extend([
                'Request vendor confirmation letters',
                'Cross-check GST/PAN numbers for duplicates',
                'Review transaction timing patterns',
                'Verify vendor locations'
            ])
        elif risk_score >= 30:
            recommendations.extend([
                'Monitor for similar patterns',
                'Standardize vendor name entry',
                'Implement vendor consolidation process'
            ])
        else:
            recommendations.extend([
                'Continue routine vendor management',
                'Periodic vendor verification'
            ])
        
        return recommendations


if __name__ == '__main__':
    # Test the service
    service = VendorMatchingService()
    
    print("\n" + "="*60)
    print("VENDOR MATCHING ANALYSIS")
    print("="*60 + "\n")
    
    matches = service.find_vendor_matches(threshold=80)
    print(f"Found {len(matches)} potential vendor matches")
    print(f"Displaying first 10:\n")
    
    high_risk = service.get_high_risk_vendors()
    print(f"High-risk vendor pairs: {len(high_risk)}\n")
    
    # Display only first 10
    displayed_matches = matches[:10]
    for i, match in enumerate(displayed_matches, 1):
        print(f"{i}. {match['ledger_name']} ˜ {match['master_name']}")
        print(f"   Similarity: {match['similarity']}% | Risk: {match['risk_score']}")
    
    if len(matches) > 10:
        print(f"\n... and {len(matches) - 10} more matches")
    
    collusion = service.calculate_collusion_score()
    print("\n" + "="*60)
    print("COLLUSION RISK ASSESSMENT")
    print("="*60)
    print(f"Overall Risk Score: {collusion['collusion_risk']}/100")
    print(f"Assessment: {collusion['assessment']}")
    print(f"High-Risk Pairs: {collusion['high_risk_vendor_pairs']}")
    print(f"\nRecommendations:")
    for rec in collusion['recommendations']:
        print(f"  • {rec}")

