from fastapi import APIRouter, HTTPException
from app.models.schema import AnalysisResponse
from app.services.result_store import get_result
from app.services.vendor_matching_service import VendorMatchingService
from app.services.result_cache import get_cached_result
import sys
from pathlib import Path
import json
import numpy as np

# Add ML to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "ml"))

def convert_numpy_types(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, (np.integer, np.floating)):
        return obj.item()
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        stats = {
            "total_files": 10,
            "total_records": 50000,
            "anomalies_detected": 245,
            "accuracy": 0.95
        }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results/{file_id}")
async def get_analysis_results(file_id: str):
    """Get analysis results for a specific file"""
    try:
        # Try to get from cache first
        cached_result = get_cached_result(file_id)
        if cached_result:
            return cached_result
        
        # Fallback: try to get from result store
        result = get_result(file_id)
        if not result:
            raise HTTPException(status_code=404, detail=f"No result found for file_id '{file_id}'")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vendor-matches")
async def get_vendor_matches():
    """
    Get fuzzy vendor matches - identifies potential ghost vendors
    and collusion patterns from ledger4.csv + vendors4.csv
    
    Returns top 10 matches by default (can be overridden with ?limit=N)
    """
    try:
        service = VendorMatchingService()
        all_matches = service.find_vendor_matches(threshold=80)
        high_risk = service.get_high_risk_vendors()
        collusion = service.calculate_collusion_score()
        
        return {
            "status": "success",
            "total_matches": len(all_matches),
            "high_risk_matches": len(high_risk),
            "matches": all_matches[:10],  # Return top 10 only
            "high_risk_vendors": high_risk[:10],  # Top 10 high-risk
            "collusion_assessment": collusion,
            "note": f"Showing 10 of {len(all_matches)} total matches"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/going-concern/sample")
async def get_going_concern_sample():
    """
    Return sample going concern analysis for demonstration.
    """
    try:
        import pandas as pd
        from ledgerspy_engine.going_concern import GoingConcernAnalyzer
        
        # Create sample transactions
        sample_data = {
            'timestamp': pd.date_range('2023-01-01', periods=100, freq='D'),        
            'amount': pd.Series([1000 + i % 5000 for i in range(100)])
        }
        df = pd.DataFrame(sample_data)

        analyzer = GoingConcernAnalyzer(num_simulations=100, forecast_months=12)   
        result = analyzer.analyze_cash_flow(
            df,
            starting_balance=100000,
            min_required_balance=10000
        )
        result['recommendation'] = analyzer.get_recommendation(result)
        
        # Convert numpy types
        result = convert_numpy_types(result)
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Sample analysis failed: {str(e)}")

@router.get("/going-concern/{file_id}")
async def get_going_concern_analysis(file_id: str):
    """
    Get going concern stress test analysis for a file.
    Uses cached results if available, otherwise runs Monte Carlo simulation.
    
    Returns:
        - survival_probability: % chance of maintaining liquidity
        - risk_level: SAFE, MODERATE, AT_RISK, or CRITICAL
        - scenario_bands: probability distribution breakdown
        - metrics: statistical summary
    """
    try:
        # Retrieve cached analysis result
        cached = get_cached_result(file_id)
        if not cached:
            # Fallback to disk storage
            cached = get_result(file_id)
        
        if not cached or 'transactions' not in cached:
            raise HTTPException(status_code=404, detail=f"No transaction data found for file_id '{file_id}'")
        
        # Check if going concern analysis is already cached
        if 'going_concern' in cached and cached.get('going_concern'):
            return convert_numpy_types(cached['going_concern'])
        
        import pandas as pd
        from ledgerspy_engine.going_concern import GoingConcernAnalyzer
        
        # Convert transactions to DataFrame
        transactions = cached.get('transactions', [])
        if not transactions:
            raise HTTPException(status_code=400, detail="No transactions available for analysis")
        
        df = pd.DataFrame(transactions)
        
        # Run going concern analysis with reduced scenarios for speed (1000 instead of 5000)
        # Full analysis is done during full_analysis call
        analyzer = GoingConcernAnalyzer(num_simulations=1000, forecast_months=12)
        analysis = analyzer.analyze_cash_flow(
            df,
            starting_balance=100000,
            min_required_balance=10000
        )
        
        # Add recommendation
        analysis['recommendation'] = analyzer.get_recommendation(analysis)
        
        # Convert numpy types to native Python types for JSON serialization
        analysis = convert_numpy_types(analysis)
        
        # Cache the result
        if cached:
            cached['going_concern'] = analysis
            try:
                from app.services.result_cache import cache_result
                cache_result(file_id, cached)
            except:
                pass  # Cache update is optional
        
        return analysis
        
    except HTTPException:
        raise
    except ImportError as e:
        raise HTTPException(
            status_code=501, 
            detail=f"Going concern analysis module not available: {str(e)}"
        )
    except Exception as e:
        import traceback
        print(f"Going concern error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Going concern analysis failed: {str(e)}")
