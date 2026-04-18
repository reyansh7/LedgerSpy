from fastapi import APIRouter, HTTPException
from app.models.schema import AnalysisResponse
from app.services.result_store import get_result

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

@router.get("/results/{file_id}", response_model=AnalysisResponse)
async def get_analysis_results(file_id: str):
    """Get analysis results for a specific file"""
    try:
        result = get_result(file_id)
        if not result:
            raise HTTPException(status_code=404, detail=f"No result found for file_id '{file_id}'")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
