from fastapi import APIRouter, UploadFile, File, HTTPException
from app.utils.file_handler import process_uploaded_file
from app.services.report_service import generate_report

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process a financial file"""
    try:
        if file.filename == "":
            raise HTTPException(status_code=400, detail="No selected file")
        
        # Process file
        file_data = await file.read()
        result = await process_uploaded_file(file.filename, file_data)
        
        return {
            "status": "success",
            "file_id": result.get("file_id"),
            "message": "File uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
