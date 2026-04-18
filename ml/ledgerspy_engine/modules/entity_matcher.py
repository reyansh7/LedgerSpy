from rapidfuzz import fuzz, process, distance
import pandas as pd

class EntityMatcher:
    def __init__(self, default_threshold=85):
        self.default_threshold = default_threshold

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

    def find_ghost_vendors(self, vendor_names: list, threshold: float = None) -> list:
        """
        Takes a list of vendor names and returns highly suspicious pairs.
        Uses RapidFuzz's highly optimized 'process.extract' to avoid slow Python loops.
        """
        threshold = threshold or self.default_threshold
        unique_vendors = list(set([str(v).strip().lower() for v in vendor_names if pd.notna(v)]))
        
        suspicious_pairs = []
        processed_pairs = set()

        for vendor in unique_vendors:
            # extract finds the best matches for 'vendor' against the entire list instantly
            matches = process.extract(
                vendor, 
                unique_vendors, 
                scorer=distance.JaroWinkler.normalized_similarity, 
                limit=10 # Only look at the top 10 closest matches to save memory
            )

            for match_str, score, _ in matches:
                # Convert 0-1 score to 0-100 percentage
                score_pct = score * 100 
                
                # We don't want to match the string with itself
                if vendor != match_str and score_pct >= threshold:
                    
                    # Create a sorted tuple to ensure ('A', 'B') is treated the same as ('B', 'A')
                    pair_key = tuple(sorted([vendor, match_str]))
                    
                    if pair_key not in processed_pairs:
                        processed_pairs.add(pair_key)
                        suspicious_pairs.append({
                            'vendor_1': vendor,
                            'vendor_2': match_str,
                            'risk_score': round(score_pct, 2),
                            'flag_reason': 'High phonetic/character similarity'
                        })

        # Sort the worst offenders to the top
        return sorted(suspicious_pairs, key=lambda x: x['risk_score'], reverse=True)