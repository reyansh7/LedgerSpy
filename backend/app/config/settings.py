import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # API Configuration
    API_TITLE = "LedgerSpy"
    API_VERSION = "1.0.0"
    ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:5175", "http://localhost:3000", "http://127.0.0.1:5175", "http://127.0.0.1:5173"]
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ledgerspy.db")
    
    # File Upload
    MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
    
    # JWT
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

settings = Settings()
