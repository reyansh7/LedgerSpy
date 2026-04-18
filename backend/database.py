from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# SQLite database URL
DATABASE_URL = "sqlite:///./ledgerspy_audit.db"

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency to get a database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
