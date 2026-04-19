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
    Uses realistic inflows/outflows with entity classification.
    """
    try:
        import pandas as pd
        import numpy as np
        from ledgerspy_engine.going_concern import GoingConcernAnalyzer
        
        # Create realistic sample transactions with inflows and outflows
        dates = pd.date_range('2023-01-01', periods=365, freq='D')
        
        # 70% inflow, 30% outflow
        num_transactions = 365
        num_inflows = int(num_transactions * 0.7)
        
        # Create realistic amounts (inflows positive, outflows negative)
        inflow_amounts = np.random.gamma(shape=2, scale=1500, size=num_inflows)
        outflow_amounts = -np.random.gamma(shape=2, scale=1000, size=num_transactions - num_inflows)
        amounts = np.concatenate([inflow_amounts, outflow_amounts])
        np.random.shuffle(amounts)
        
        # Create entity pairs for classification
        sources = np.random.choice(
            ['Finance Dept', 'Operations', 'Vendor A', 'Vendor B', 'Vendor C', 'Client X', 'Client Y'], 
            num_transactions
        )
        destinations = np.random.choice(
            ['Finance Dept', 'Operations', 'Vendor A', 'Vendor B', 'Vendor C', 'Client X', 'Client Y'], 
            num_transactions
        )
        
        df = pd.DataFrame({
            'timestamp': dates,
            'amount': amounts,
            'source_entity': sources,
            'destination_entity': destinations
        })
        
        # Calculate dynamic expense ratio from data
        company_departments = {'Finance Dept', 'Operations'}
        source_counts = df['source_entity'].value_counts()
        dest_counts = df['destination_entity'].value_counts()
        top_sources = set(source_counts.head(3).index)
        top_dests = set(dest_counts.head(3).index)
        company_entities = top_sources | top_dests | company_departments
        
        df['is_outflow'] = df['source_entity'].isin(company_entities) & ~df['destination_entity'].isin(company_entities)
        total_inflow = df[~df['is_outflow']]['amount'].sum()
        total_outflow = abs(df[df['is_outflow']]['amount'].sum())
        
        if total_inflow > 0:
            expense_ratio = max(0.01, min(total_outflow / total_inflow, 0.5))
        else:
            expense_ratio = 0.1

        analyzer = GoingConcernAnalyzer(num_simulations=1000, forecast_months=12)   
        result = analyzer.analyze_cash_flow(
            df,
            starting_balance=100000,
            min_required_balance=10000,
            expense_ratio=expense_ratio
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
        - survival_probability: % chance of maintaining liquidity (0-100)
        - risk_level: SAFE, MODERATE, AT_RISK, or CRITICAL
        - scenario_bands: probability distribution breakdown
        - ending_balance_stats: P5, P25, P50, P75, P95 percentiles
        - minimum_balance_stats: same percentiles for min balance during period
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
        
        # Validate required columns
        required_cols = ['timestamp', 'amount']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing_cols}")
        
        # Add source/destination if missing (for backward compatibility)
        if 'source_entity' not in df.columns:
            df['source_entity'] = 'Unknown_Source'
        if 'destination_entity' not in df.columns:
            df['destination_entity'] = 'Unknown_Destination'
        
        # Parse timestamps with ISO8601 format to handle milliseconds and microseconds
        df['timestamp'] = pd.to_datetime(df['timestamp'], format='ISO8601', errors='coerce')
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
        
        # Identify company entities for expense ratio calculation
        company_departments = {'Finance Dept', 'Operations', 'Admin Dept', 'Sales', 'HR', 'Legal'}
        source_counts = df['source_entity'].value_counts()
        dest_counts = df['destination_entity'].value_counts()
        top_sources = set(source_counts.head(3).index)
        top_dests = set(dest_counts.head(3).index)
        company_entities = top_sources | top_dests | company_departments
        
        # Calculate outflows (company paying out) and inflows (company receiving)
        df['is_outflow'] = df['source_entity'].isin(company_entities) & ~df['destination_entity'].isin(company_entities)
        total_inflow = df[~df['is_outflow']]['amount'].sum()
        total_outflow = df[df['is_outflow']]['amount'].sum()
        
        # Dynamic expense ratio based on outflows
        # If outflows are significant, use them; otherwise use modest burn rate
        if total_inflow > 0:
            expense_ratio = max(0.01, min(total_outflow / total_inflow, 0.5))  # 1% to 50%
        else:
            expense_ratio = 0.1  # 10% default if no clear inflows
        
        # Run going concern analysis with reduced scenarios for speed (1000 instead of 5000)
        # Full analysis is done during full_analysis call
        analyzer = GoingConcernAnalyzer(num_simulations=1000, forecast_months=12)
        analysis = analyzer.analyze_cash_flow(
            df,
            starting_balance=100000,
            min_required_balance=10000,
            expense_ratio=expense_ratio
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
