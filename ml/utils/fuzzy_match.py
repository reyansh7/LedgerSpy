"""
Fuzzy Matching Utility Functions
"""
from fuzzywuzzy import fuzz

def fuzzy_match(str1, str2, method='token_set'):
    """
    Compare two strings using fuzzy matching
    
    Methods:
    - 'ratio': Simple string match
    - 'token_sort': Sort tokens before comparing
    - 'token_set': Use token set ratio
    """
    if method == 'ratio':
        return fuzz.ratio(str1, str2)
    elif method == 'token_sort':
        return fuzz.token_sort_ratio(str1, str2)
    else:  # token_set
        return fuzz.token_set_ratio(str1, str2)

def find_duplicates(strings, threshold=85):
    """Find duplicate strings above threshold"""
    duplicates = []
    for i in range(len(strings)):
        for j in range(i + 1, len(strings)):
            score = fuzzy_match(strings[i], strings[j])
            if score >= threshold:
                duplicates.append({
                    'index1': i,
                    'index2': j,
                    'str1': strings[i],
                    'str2': strings[j],
                    'score': score
                })
    return duplicates

def clean_vendor_names(names, threshold=90):
    """Clean and deduplicate vendor names"""
    cleaned = []
    indices_to_keep = []
    
    for i, name in enumerate(names):
        if not cleaned:
            cleaned.append(name)
            indices_to_keep.append(i)
        else:
            is_duplicate = False
            for existing in cleaned:
                if fuzzy_match(name, existing) >= threshold:
                    is_duplicate = True
                    break
            if not is_duplicate:
                cleaned.append(name)
                indices_to_keep.append(i)
    
    return cleaned, indices_to_keep
