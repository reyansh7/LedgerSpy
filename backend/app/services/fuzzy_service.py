"""
Fuzzy Matching Service
Identifies duplicate and near-duplicate entries
"""
from fuzzywuzzy import fuzz
from fuzzywuzzy import process

def find_fuzzy_matches(entries, threshold=85):
    """
    Find similar/duplicate entries using fuzzy matching
    
    Args:
        entries: List of strings to match
        threshold: Similarity threshold (0-100)
    
    Returns:
        List of matched pairs with similarity score
    """
    matches = []
    checked = set()
    
    for i, entry1 in enumerate(entries):
        for j, entry2 in enumerate(entries):
            if i >= j or (i, j) in checked:
                continue
            
            checked.add((i, j))
            
            # Calculate similarity
            similarity = fuzz.token_set_ratio(entry1, entry2)
            
            if similarity >= threshold:
                matches.append({
                    'index1': i,
                    'index2': j,
                    'similarity': similarity,
                    'entries': [entry1, entry2]
                })
    
    return matches

def deduplicate_entries(entries, threshold=90):
    """
    Remove duplicate entries keeping the first occurrence
    
    Args:
        entries: List of strings
        threshold: Similarity threshold for deduplication
    
    Returns:
        Deduplicated list and list of removed indices
    """
    deduplicated = []
    removed_indices = []
    
    for i, entry in enumerate(entries):
        if not deduplicated:
            deduplicated.append(entry)
        else:
            best_match = process.extractOne(entry, deduplicated)
            if best_match and best_match[1] < threshold:
                deduplicated.append(entry)
            else:
                removed_indices.append(i)
    
    return deduplicated, removed_indices
