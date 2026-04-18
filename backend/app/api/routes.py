from fastapi import APIRouter, HTTPException
from app.services import benford_service, anomaly_service

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
        results = {
            "file_id": file_id,
            "status": "completed",
            "analysis": {
                "benford": {},
                "anomalies": [],
                "fuzzy_matches": []
            }
        }
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
