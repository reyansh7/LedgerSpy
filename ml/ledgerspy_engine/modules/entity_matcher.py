from rapidfuzz import fuzz, process, distance
from metaphone import doublemetaphone
import pandas as pd
import numpy as np

class EntityMatcher:
    def __init__(self, default_threshold=85):
        self.default_threshold = default_threshold
        # Known legitimate vendors (can be expanded)
        self.known_legitimate_vendors = set()

    def compare_strings(self, str1: str, str2: str, method='jaro_winkler') -> float:
        """Compare two strings using optimized RapidFuzz"""
        # Ensure we are dealing with strings and handle NaNs
        str1, str2 = str(str1).lower(), str(str2).lower()
        
        if method == 'jaro_winkler':
            # Returns a normalized score from 0 to 100
            return distance.JaroWinkler.normalized_similarity(str1, str2) * 100
        elif method == 'token_sort':
            return fuzz.token_sort_ratio(str1, str2)
        else:  # token_set
            return fuzz.token_set_ratio(str1, str2)

    def get_dynamic_threshold(self, vendor1: str, vendor2: str) -> float:
        """
        Calculate dynamic threshold based on vendor name characteristics.
        Shorter names get higher threshold (stricter) to avoid false positives.
        Longer names get lower threshold to catch variations.
        """
        avg_length = (len(str(vendor1)) + len(str(vendor2))) / 2
        
        if avg_length < 10:
            return 95  # Very strict for short names (e.g., "ABC Inc")
        elif avg_length < 30:
            return 85  # Medium for normal names
        else:
            return 80  # More lenient for long names (e.g., "Global Financial Services Corporation Ltd")

    def compare_phonetic(self, str1: str, str2: str) -> float:
        """
        Compare strings phonetically using metaphone encoding.
        Catches variations like "Smith" vs "Smythe", "Meyer" vs "Myer"
        """
        try:
            # Metaphone returns multiple encodings, use the primary one
            primary1 = doublemetaphone(str(str1).lower())[0]
            primary2 = doublemetaphone(str(str2).lower())[0]
            
            if primary1 and primary2:
                # Compare the phonetic codes
                phonetic_similarity = fuzz.ratio(primary1, primary2)
                return phonetic_similarity
            else:
                return 0.0
        except:
            # If phonetic matching fails, return 0
            return 0.0

    def find_ghost_vendors(self, vendor_names: list, threshold: float = None, 
                          use_phonetic: bool = True, known_legitimate: list = None) -> list:
        """
        Takes a list of vendor names and returns highly suspicious pairs.
        Uses RapidFuzz's optimized 'process.extract' + optional phonetic matching.
        
        Args:
            vendor_names: List of vendor names to analyze
            threshold: Custom threshold (auto-calculated per pair if None)
            use_phonetic: If True, add phonetic similarity to scoring
            known_legitimate: List of known legitimate vendor names to trust
        """
        if known_legitimate:
            self.known_legitimate_vendors = set(v.lower().strip() for v in known_legitimate)
        
        unique_vendors = list(set([str(v).strip().lower() for v in vendor_names if pd.notna(v)]))
        
        suspicious_pairs = []
        processed_pairs = set()

        for vendor in unique_vendors:
            # Skip known legitimate vendors
            if vendor in self.known_legitimate_vendors:
                continue
            
            # Get dynamic threshold for this vendor
            dynamic_threshold = threshold or self.default_threshold
            
            # extract finds the best matches for 'vendor' against the entire list
            matches = process.extract(
                vendor, 
                unique_vendors, 
                scorer=distance.JaroWinkler.normalized_similarity, 
                limit=10  # Only look at top 10 closest matches
            )

            for match_str, score, _ in matches:
                # Convert 0-1 score to 0-100 percentage
                score_pct = score * 100
                
                # Skip if vendor matches itself or is known legitimate
                if vendor == match_str or match_str in self.known_legitimate_vendors:
                    continue
                
                # Calculate dynamic threshold if not provided
                if threshold is None:
                    dynamic_threshold = self.get_dynamic_threshold(vendor, match_str)
                
                # Base score from character similarity
                base_score = score_pct
                
                # Add phonetic matching boost
                if use_phonetic:
                    phonetic_score = self.compare_phonetic(vendor, match_str)
                    # Weighted combination: 70% string similarity, 30% phonetic
                    combined_score = (base_score * 0.7) + (phonetic_score * 0.3)
                else:
                    combined_score = base_score
                
                # Only flag if above threshold
                if combined_score >= dynamic_threshold:
                    # Create a sorted tuple to ensure ('A', 'B') is treated the same as ('B', 'A')
                    pair_key = tuple(sorted([vendor, match_str]))
                    
                    if pair_key not in processed_pairs:
                        processed_pairs.add(pair_key)
                        
                        # Determine fraud risk level
                        if combined_score >= 95:
                            fraud_risk = 'CRITICAL'
                        elif combined_score >= 90:
                            fraud_risk = 'VERY_HIGH'
                        elif combined_score >= 85:
                            fraud_risk = 'HIGH'
                        else:
                            fraud_risk = 'MEDIUM'
                        
                        suspicious_pairs.append({
                            'vendor_1': vendor,
                            'vendor_2': match_str,
                            'risk_score': round(combined_score, 2),
                            'base_string_similarity': round(base_score, 2),
                            'phonetic_similarity': round(self.compare_phonetic(vendor, match_str), 2) if use_phonetic else None,
                            'flag_reason': 'High phonetic/character similarity - potential duplicate or shell entity',
                            'fraud_risk': fraud_risk
                        })

        # Sort the worst offenders to the top
        return sorted(suspicious_pairs, key=lambda x: x['risk_score'], reverse=True)