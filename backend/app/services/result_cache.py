"""
Simple in-memory result cache for audit analysis
Results are cached temporarily to allow retrieval via API
"""
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import threading

class ResultCache:
    """Thread-safe in-memory cache for audit results"""
    
    def __init__(self, ttl_minutes: int = 60):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl_minutes
        self._lock = threading.Lock()
    
    def set(self, file_id: str, data: Dict[str, Any]) -> None:
        """Store result with timestamp"""
        with self._lock:
            self.cache[file_id] = {
                'data': data,
                'timestamp': datetime.now()
            }
    
    def get(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Get result if it exists and hasn't expired"""
        with self._lock:
            if file_id not in self.cache:
                return None
            
            entry = self.cache[file_id]
            elapsed = (datetime.now() - entry['timestamp']).total_seconds() / 60
            
            if elapsed > self.ttl:
                del self.cache[file_id]
                return None
            
            return entry['data']
    
    def clear_expired(self) -> None:
        """Remove expired entries"""
        with self._lock:
            now = datetime.now()
            expired_keys = [
                k for k, v in self.cache.items()
                if (now - v['timestamp']).total_seconds() / 60 > self.ttl
            ]
            for k in expired_keys:
                del self.cache[k]

# Global cache instance
_result_cache = ResultCache(ttl_minutes=60)

def cache_result(file_id: str, data: Dict[str, Any]) -> None:
    """Cache an audit result"""
    _result_cache.set(file_id, data)

def get_cached_result(file_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve cached audit result"""
    return _result_cache.get(file_id)

def clear_cache() -> None:
    """Clear all cached results"""
    _result_cache.cache.clear()
