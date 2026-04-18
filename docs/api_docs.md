# API Documentation

## Base URL
```
http://localhost:8000/api
```

## Endpoints

### 1. Upload File
```
POST /upload
```

**Description**: Upload a CSV or Excel file for analysis

**Request**:
```bash
curl -X POST "http://localhost:8000/api/upload" \
  -F "file=@transactions.csv"
```

**Response** (200):
```json
{
  "status": "success",
  "file_id": "1703020800_transactions.csv",
  "message": "File uploaded successfully"
}
```

**Status Codes**:
- 200: Success
- 400: Bad request (no file)
- 500: Server error

---

### 2. Get Analysis Results
```
GET /results/{file_id}
```

**Description**: Retrieve analysis results for an uploaded file

**Parameters**:
- `file_id` (path, required): ID returned from upload endpoint

**Response** (200):
```json
{
  "file_id": "1703020800_transactions.csv",
  "status": "completed",
  "analysis": {
    "benford": {
      "chi_square": 12.45,
      "p_value": 0.089,
      "verdict": "Suspicious"
    },
    "anomalies": [
      {
        "index": 42,
        "value": 9999.99,
        "score": -0.85
      }
    ],
    "fuzzy_matches": [
      {
        "index1": 10,
        "index2": 15,
        "similarity": 92,
        "entries": ["Vendor A Inc", "Vendor A INC"]
      }
    ]
  }
}
```

---

### 3. Dashboard Statistics
```
GET /dashboard
```

**Description**: Get overall system statistics

**Response** (200):
```json
{
  "total_files": 10,
  "total_records": 50000,
  "anomalies_detected": 245,
  "accuracy": 0.95,
  "recent_uploads": [
    {
      "file_id": "1703020800_transactions.csv",
      "uploaded_at": "2024-01-15T10:30:00",
      "rows": 5000
    }
  ]
}
```

---

### 4. Authentication
```
POST /auth/login
```

**Description**: Authenticate user and get JWT token

**Request**:
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

---

## Error Handling

All errors return JSON with status code and message:

```json
{
  "detail": "Error description"
}
```

**Common Status Codes**:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

---

## Authentication

Protected endpoints require JWT token in header:

```
Authorization: Bearer <token>
```

Token obtained from `/auth/login` endpoint.

---

## Rate Limiting

(Optional) API implements rate limiting:
- 100 requests per minute per IP
- 1GB max file size per upload

---

## Testing with cURL

```bash
# Upload file
curl -X POST "http://localhost:8000/api/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@data.csv"

# Get results
curl -X GET "http://localhost:8000/api/results/FILE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Dashboard stats
curl -X GET "http://localhost:8000/api/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
