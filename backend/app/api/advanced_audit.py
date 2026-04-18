"""
API routes for advanced audit features:
- Going Concern Analysis
- Industry Benchmarking
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import pandas as pd
import logging
from typing import Optional
import sys
import os

logger = logging.getLogger(__name__)

# Add ml directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

# Try importing ML modules with fallback
GoingConcernAnalyzer = None
IndustryBenchmarker = None

try:
    from ml.ledgerspy_engine.going_concern import GoingConcernAnalyzer
    from ml.ledgerspy_engine.industry_benchmarking import IndustryBenchmarker
except ImportError as e:
    logger.warning(f"Could not import ML modules: {e}. Advanced audit features will be unavailable.")

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/audit", tags=["advanced-audit"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class GoingConcernRequest(BaseModel):
    audit_id: str
    starting_balance: float = 100000
    min_required_balance: float = 10000
    num_simulations: int = 10000
    forecast_months: int = 12


class IndustryBenchmarkRequest(BaseModel):
    audit_id: str
    industry: str = "technology"
    anomaly_rate: float = 0.0
    duplicate_vendor_rate: float = 0.0
    benford_violation: bool = False
    network_loops: int = 0
    error_amount: float = 0.0
    total_transactions: int = 0


# ============================================================================
# GOING CONCERN ENDPOINTS
# ============================================================================

@router.post("/going-concern/analyze")
async def analyze_going_concern(request: GoingConcernRequest):
    """
    Perform Monte Carlo going concern stress test.
    
    Returns:
        - survival_probability: Probability company survives 12 months (0-100)
        - risk_level: SAFE, MODERATE, AT_RISK, CRITICAL
        - scenario_bands: Probability distribution across risk bands
        - key_metrics: Ending balance stats, minimum balance stats
    """
    if GoingConcernAnalyzer is None:
        raise HTTPException(status_code=503, detail="Going concern analysis module not available. Please ensure ML modules are properly installed.")
    
    try:
        # TODO: Load actual transaction data from audit_id
        # For now, create sample data
        sample_data = {
            'timestamp': pd.date_range('2023-01-01', periods=500, freq='D'),
            'amount': pd.Series([1000 + i % 5000 for i in range(500)])
        }
        df = pd.DataFrame(sample_data)
        
        analyzer = GoingConcernAnalyzer(
            num_simulations=request.num_simulations,
            forecast_months=request.forecast_months
        )
        
        result = analyzer.analyze_cash_flow(
            df,
            starting_balance=request.starting_balance,
            min_required_balance=request.min_required_balance
        )
        
        result['recommendation'] = analyzer.get_recommendation(result)
        
        return result
    
    except Exception as e:
        logger.error(f"Going concern analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/going-concern/sample")
async def get_going_concern_sample():
    """
    Return sample going concern analysis for demonstration.
    """
    if GoingConcernAnalyzer is None:
        raise HTTPException(status_code=503, detail="Going concern analysis module not available. Please ensure ML modules are properly installed.")
    
    # Create sample transactions
    sample_data = {
        'timestamp': pd.date_range('2023-01-01', periods=500, freq='D'),
        'amount': pd.Series([1000 + i % 5000 for i in range(500)])
    }
    df = pd.DataFrame(sample_data)
    
    analyzer = GoingConcernAnalyzer(num_simulations=5000, forecast_months=12)
    result = analyzer.analyze_cash_flow(
        df,
        starting_balance=100000,
        min_required_balance=10000
    )
    result['recommendation'] = analyzer.get_recommendation(result)
    
    return result


# ============================================================================
# INDUSTRY BENCHMARKING ENDPOINTS
# ============================================================================

@router.post("/industry-benchmark/compare")
async def compare_industry_benchmark(request: IndustryBenchmarkRequest):
    """
    Compare company metrics against industry benchmarks.
    
    Args:
        industry: Sector (technology, finance, retail, manufacturing, healthcare, government)
        anomaly_rate: Company's anomaly rate (%)
        duplicate_vendor_rate: Company's duplicate vendor rate (%)
        benford_violation: Whether Benford's Law violation was detected
        network_loops: Number of circular transactions detected
        error_amount: Average error amount
        total_transactions: Total transactions analyzed
        
    Returns:
        - metrics: Detailed comparison for each metric
        - overall_risk: Aggregate risk score and level
        - recommendations: Actionable recommendations
        - interpretation: Summary interpretation
    """
    if IndustryBenchmarker is None:
        raise HTTPException(status_code=503, detail="Industry benchmarking module not available. Please ensure ML modules are properly installed.")
    
    try:
        benchmarker = IndustryBenchmarker(industry=request.industry)
        
        company_metrics = {
            'anomaly_rate': request.anomaly_rate,
            'duplicate_vendor_rate': request.duplicate_vendor_rate,
            'benford_violation': request.benford_violation,
            'network_loops': request.network_loops,
            'error_amount': request.error_amount,
            'total_transactions': request.total_transactions
        }
        
        result = benchmarker.compare_metrics(company_metrics)
        
        return result
    
    except Exception as e:
        logger.error(f"Industry benchmarking failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/industry-benchmark/sample")
async def get_industry_benchmark_sample(
    industry: str = Query("technology", description="Industry sector")
):
    """
    Return sample industry benchmark comparison for demonstration.
    """
    if IndustryBenchmarker is None:
        raise HTTPException(status_code=503, detail="Industry benchmarking module not available. Please ensure ML modules are properly installed.")
    
    try:
        benchmarker = IndustryBenchmarker(industry=industry)
        
        # Sample company metrics
        company_metrics = {
            'anomaly_rate': 2.5,
            'duplicate_vendor_rate': 1.2,
            'benford_violation': True,
            'network_loops': 1,
            'error_amount': 3000,
            'total_transactions': 5000
        }
        
        result = benchmarker.compare_metrics(company_metrics)
        
        return result
    
    except Exception as e:
        logger.error(f"Industry benchmarking sample failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/industry-benchmark/industries")
async def get_supported_industries():
    """
    Return list of supported industries for benchmarking.
    """
    return {
        'industries': [
            {'id': 'technology', 'label': 'Technology'},
            {'id': 'finance', 'label': 'Finance & Banking'},
            {'id': 'retail', 'label': 'Retail & E-commerce'},
            {'id': 'manufacturing', 'label': 'Manufacturing'},
            {'id': 'healthcare', 'label': 'Healthcare'},
            {'id': 'government', 'label': 'Government & Public'}
        ]
    }
