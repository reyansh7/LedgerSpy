import logging
from io import BytesIO

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schema import UploadResponse
from app.services.audit_service import AuditServiceError, run_full_analysis
from app.services.result_store import save_result

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload CSV and run full fraud analysis pipeline."""
    try:
        filename = file.filename or ""
        if filename == "":
            raise HTTPException(status_code=400, detail="No selected file")

        if not filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only CSV files are supported at /upload")

        raw_bytes = await file.read()
        if not raw_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        try:
            dataframe = pd.read_csv(BytesIO(raw_bytes))
        except Exception as exc:
            logger.error(f"CSV parsing failed: {exc}", exc_info=True)
            raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {exc}") from exc

        logger.info(f"Starting analysis for file: {filename} with {len(dataframe)} rows")
        try:
            result = run_full_analysis(dataframe, filename)
        except Exception as exc:
            logger.error(f"Analysis failed for {filename}: {exc}", exc_info=True)
            raise

        logger.info(f"Analysis completed, saving results for file_id: {result['file_id']}")
        save_result(result["file_id"], result)

        return {
            "status": "success",
            "file_id": result["file_id"],
            "message": "File uploaded and analyzed successfully",
            "summary": result["summary"],
        }
    except AuditServiceError as exc:
        logger.warning(f"Audit service error: {exc}")
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
