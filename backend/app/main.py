import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes, upload
from app.config.settings import settings

# Ensure ml module can be imported
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
if root_path not in sys.path:
    sys.path.insert(0, root_path)

app = FastAPI(
    title="LedgerSpy API",
    description="Fraud Detection System for Financial Records",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes.router, prefix="/api", tags=["general"])
app.include_router(upload.router, prefix="/api", tags=["upload"])

# Try to include advanced audit routes (optional)
try:
    from app.api import advanced_audit
    app.include_router(advanced_audit.router, tags=["advanced-audit"])
except Exception as e:
    import logging
    logging.warning(f"Could not load advanced audit routes: {e}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
