# LedgerSpy Architecture

## System Overview

LedgerSpy is a full-stack fraud detection system with three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  Dashboard | Upload | Results | Charts | Authentication    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────────┐
│              Backend (FastAPI) - Port 8000                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Upload API   │  │ Analysis API │  │ Auth API         │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┬───────────────┐
        │                         │               │
┌───────▼────────┐    ┌──────────▼───────┐  ┌───▼─────────┐
│ ML Services    │    │ Data Processing  │  │ Database    │
│ • Benford      │    │ • Parsing        │  │ • SQLite    │
│ • Anomaly      │    │ • Cleaning       │  │ • PostgreSQL│
│ • Fuzzy Match  │    │ • Normalization  │  │             │
└────────────────┘    └──────────────────┘  └─────────────┘
```

## Components

### 1. Frontend (React + Vite)
- **Location**: `frontend/`
- **Port**: 5173
- **Technology**: React 18, Vite, Axios
- **Key Features**:
  - Dashboard with KPIs
  - File upload interface
  - Results visualization
  - Real-time charts

### 2. Backend (FastAPI)
- **Location**: `backend/`
- **Port**: 8000
- **Technology**: FastAPI, Uvicorn, Pydantic
- **Modules**:
  - `api/`: Route handlers
  - `services/`: Business logic
  - `models/`: Data schemas
  - `utils/`: Helper functions

### 3. ML Engine
- **Location**: `ml/`
- **Models**: Anomaly detection, Benford's Law, Fuzzy matching
- **Integrated with**: Backend services

## Data Flow

1. User uploads CSV/Excel file via Frontend
2. Frontend sends file to Backend API (`/api/upload`)
3. Backend processes file:
   - Validates and parses data
   - Applies preprocessing
   - Triggers ML analyses
4. ML Engine runs:
   - Benford's Law test
   - Anomaly detection (Isolation Forest)
   - Fuzzy duplicate matching
5. Results stored in database
6. Frontend displays results with visualizations

## Authentication Flow

- User submits credentials on Login page
- Backend validates and issues JWT token
- Token stored in localStorage
- All API requests include Authorization header
- Token expires after configured time (default: 30 min)

## Deployment

Docker Compose provided for containerized deployment:
- Backend service
- Frontend service
- PostgreSQL database
- Volume mounts for code and data

See `docker-compose.yml` for details.
