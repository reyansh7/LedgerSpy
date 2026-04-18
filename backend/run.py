import uvicorn
import sys
import os

# Add backend directory to Python path to ensure imports work correctly
backend_path = os.path.dirname(os.path.abspath(__file__))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

if __name__ == "__main__":
    print("Starting LedgerSpy API server...")
    print(f"Python path includes: {sys.path[0]}")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
