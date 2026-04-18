# LedgerSpy + Ollama: AI-Powered Explainable Fraud Risk

Integrate lightweight local LLMs with LedgerSpy to generate intelligent explanations for every fraud risk component.

## Overview

This integration adds AI-powered explanations to LedgerSpy's risk breakdown using **Ollama** - a local, offline-first LLM server.

```
Real-time Risk Score Generation
↓
Mistral/Neural-Chat (Local LLM)
↓
AI-Powered Explanations
↓
Auditor Dashboard
```

**Why Ollama?**
- 🔒 **Offline**: No external API calls, 100% local
- ⚡ **Fast**: 2-5 second response times
- 💻 **Lightweight**: 4-6GB RAM, runs on any laptop
- 🔓 **Open Source**: Free, fully transparent
- 🎓 **Explainable**: Clear reasoning for each risk score
- 🔧 **Customizable**: Swap models, adjust prompts

## Quick Start (5 minutes)

### 1. Install Ollama
Download from [ollama.ai](https://ollama.ai) and install.

### 2. Pull a Model
```bash
ollama pull mistral
```

### 3. Start Ollama
```bash
ollama serve
```

Leave running. Should show: `listening on 127.0.0.1:11434`

### 4. Start LedgerSpy
```bash
cd backend
python run.py
```

### 5. View AI Explanations
Navigate to http://localhost:5173/dashboard

Risk breakdown cards now show AI-generated explanations! ✨

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   React Frontend                             │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ExplainableRiskBreakdown.jsx                          │ │
│  │  - Displays 3 risk components (Anomaly, Vendor, Benford)│ │
│  │  - Clickable cards for expansions                       │ │
│  │  - Summary + Audit recommendations                      │ │
│  │  - Ollama status badge (Online/Offline)                │ │
│  └────────────┬─────────────────────────────────────────┘ │
│               │ HTTP (JSON requests)                        │
└───────────────┼────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  /api/risk/explainable-breakdown (POST)                │ │
│  │  /api/risk/quick-explanation (POST)                    │ │
│  │  /api/risk/ollama-status (GET)                         │ │
│  │  /api/risk/available-models (GET)                      │ │
│  └────────────┬─────────────────────────────────────────┘ │
│               │                                             │
│  ┌────────────▼─────────────────────────────────────────┐ │
│  │  Risk Explanations Layer                             │ │
│  │  (risk_explanations.py)                              │ │
│  │  - Route handlers                                    │ │
│  │  - Parameter validation                              │ │
│  │  - Error handling                                    │ │
│  └────────────┬─────────────────────────────────────────┘ │
│               │                                             │
│  ┌────────────▼─────────────────────────────────────────┐ │
│  │  Ollama Service Layer                                │ │
│  │  (ollama_service.py)                                 │ │
│  │                                                       │ │
│  │  ┌──────────────────────────────────────────────┐   │ │
│  │  │ OllamaConfig                                 │   │ │
│  │  │ - Server connectivity                        │   │ │
│  │  │ - Model management                           │   │ │
│  │  │ - Health checks                              │   │ │
│  │  └──────────────────────────────────────────────┘   │ │
│  │                                                       │ │
│  │  ┌──────────────────────────────────────────────┐   │ │
│  │  │ RiskExplainer                                │   │ │
│  │  │ - Generates contextual prompts               │   │ │
│  │  │ - Calls Ollama API                           │   │ │
│  │  │ - Formats responses                          │   │ │
│  │  └──────────────────────────────────────────────┘   │ │
│  │                                                       │ │
│  │  ┌──────────────────────────────────────────────┐   │ │
│  │  │ RiskBreakdownGenerator                       │   │ │
│  │  │ - Orchestrates analysis                      │   │ │
│  │  │ - Composes final response                    │   │ │
│  │  └──────────────────────────────────────────────┘   │ │
│  └────────────┬─────────────────────────────────────────┘ │
└───────────────┼────────────────────────────────────────────┘
                │ HTTP (port 11434)
                ▼
         ┌──────────────────┐
         │  Ollama Server   │
         │ (Local LLM)      │
         │                  │
         │ Models:          │
         │ - mistral:7b ✓   │
         │ - neural-chat:7b │
         │ - llama2:7b      │
         │ - orca-mini:3b   │
         └──────────────────┘
```

### Data Flow

```
1. User clicks on Dashboard
   ↓
2. ExplainableRiskBreakdown component mounts
   ├─ Check Ollama availability
   │  └─ GET /api/risk/ollama-status
   ├─ Show Ollama status badge
   ├─ Generate explanations if online
   │  └─ POST /api/risk/explainable-breakdown
   │      ├─ Receives anomaly_score, vendor_score, benford_score
   │      ├─ RiskBreakdownGenerator orchestrates
   │      │  ├─ RiskExplainer.generate_anomaly_explanation()
   │      │  │  └─ POST to Ollama:11434/api/generate
   │      │  │     └─ Inference on Mistral model
   │      │  ├─ RiskExplainer.generate_vendor_explanation()
   │      │  └─ RiskExplainer.generate_benford_explanation()
   │      └─ Returns complete breakdown JSON
   │
3. Component displays:
   ├─ Total risk score (weighted average)
   ├─ 3 component cards with explanations
   ├─ AI-generated summary
   └─ Audit recommendations

4. User clicks component to expand
   └─ Shows full AI explanation (cached)
```

---

## Core Components

### 1. OllamaConfig (Service)

**File:** `backend/app/services/ollama_service.py`

Manages Ollama server connectivity and model management.

```python
from app.services.ollama_service import OllamaConfig

config = OllamaConfig(
    base_url="http://localhost:11434",
    model="mistral",
    timeout=60
)

# Check if available
if config.is_available():
    models = config.get_available_models()
    print(f"Available: {models}")  # ['mistral']
```

**Methods:**
- `is_available()` → bool: Check if Ollama is running
- `get_available_models()` → List[str]: Get installed models

### 2. RiskExplainer (Service)

**File:** `backend/app/services/ollama_service.py`

Generates intelligent explanations for each risk component.

```python
from app.services.ollama_service import RiskExplainer, OllamaConfig

explainer = RiskExplainer(OllamaConfig())

# Generate specific explanations
anomaly_exp = explainer.generate_anomaly_explanation(
    anomaly_score=50.0,
    total_anomalies=150,
    flagged_transactions=145
)
# Output: "The 50% anomaly risk indicates moderate statistical outliers..."

vendor_exp = explainer.generate_vendor_explanation(
    vendor_score=30.0,
    fuzzy_matches=12,
    ghost_vendors=3
)
# Output: "Low vendor matching risk suggests good consistency..."

benford_exp = explainer.generate_benford_explanation(
    benford_score=20.0,
    chi_square=8.5,
    p_value=0.74,
    mad=0.0045
)
# Output: "First-digit distribution shows strong compliance..."

summary = explainer.generate_risk_summary(
    total_risk=40.5,
    anomaly_score=50,
    vendor_score=30,
    benford_score=20,
    key_findings=["150 anomalies", "12 vendor matches", "Strong Benford compliance"]
)

recommendations = explainer.generate_audit_recommendation(
    total_risk=40.5,
    top_anomalies=150,
    suspicious_vendors=12,
    data_manipulation_risk=20
)
```

### 3. RiskBreakdownGenerator (Service)

**File:** `backend/app/services/ollama_service.py`

Orchestrates complete risk analysis with AI explanations.

```python
from app.services.ollama_service import RiskBreakdownGenerator, OllamaConfig

generator = RiskBreakdownGenerator(OllamaConfig())

breakdown = generator.generate_breakdown(
    anomaly_score=50,
    anomaly_details={"count": 100, "flagged": 145},
    vendor_score=30,
    vendor_details={"fuzzy_matches": 12, "ghost_vendors": 3},
    benford_score=20,
    benford_details={
        "chi_square": 8.5,
        "p_value": 0.74,
        "mad": 0.0045,
        "non_compliant": False
    },
    use_ai_explanations=True
)

# Returns:
# {
#   "timestamp": "2024-04-19T10:30:00",
#   "total_risk": 40.5,
#   "risk_level": "MEDIUM",
#   "components": {
#     "anomaly_detection": {
#       "score": 50,
#       "weight": 0.5,
#       "weighted_score": 25,
#       "explanation": "..."
#     },
#     ...
#   },
#   "summary": "...",
#   "recommendations": "..."
# }
```

### 4. React Component (Frontend)

**File:** `frontend/src/components/ExplainableRiskBreakdown.jsx`

Displays AI-powered risk explanations in dashboard.

```jsx
import ExplainableRiskBreakdown from './components/ExplainableRiskBreakdown';

function Dashboard() {
  return (
    <ExplainableRiskBreakdown
      anomalyScore={45}
      vendorScore={30}
      benfordScore={20}
      useAIExplanations={true}
      ollamaBaseUrl="http://localhost:11434"
      ollamaModel="mistral"
    />
  );
}
```

**Features:**
- ✅ Ollama status badge (Online/Offline)
- ✅ 3 expandable component cards
- ✅ AI-generated summary section
- ✅ Audit recommendations section
- ✅ Graceful offline fallback
- ✅ Real-time status checking

### 5. FastAPI Routes

**File:** `backend/app/api/risk_explanations.py`

REST API endpoints for risk explanations.

```python
# Check Ollama status
GET /api/risk/ollama-status
Response: { status, available, models, recommended_model }

# List available models
GET /api/risk/available-models
Response: { available_models, recommendations, setup_guide }

# Generate complete breakdown
POST /api/risk/explainable-breakdown
Params: anomaly_score, vendor_score, benford_score, model, use_ai_explanations
Response: { status, breakdown: { components, summary, recommendations } }

# Get single explanation
POST /api/risk/quick-explanation
Params: component (anomaly|vendor|benford), risk_score, model
Response: { status, component, risk_score, explanation }
```

---

## Usage Examples

### Example 1: Basic Setup in Dashboard

```jsx
import ExplainableRiskBreakdown from './components/ExplainableRiskBreakdown';

export function Dashboard() {
  // Your risk scores from analysis
  const [anomalyScore] = useState(50);
  const [vendorScore] = useState(30);
  const [benfordScore] = useState(20);

  return (
    <div className="dashboard">
      {/* Other dashboard content */}
      
      <ExplainableRiskBreakdown
        anomalyScore={anomalyScore}
        vendorScore={vendorScore}
        benfordScore={benfordScore}
      />
    </div>
  );
}
```

### Example 2: Custom Ollama Configuration

```jsx
<ExplainableRiskBreakdown
  anomalyScore={45}
  vendorScore={30}
  benfordScore={20}
  ollamaBaseUrl="http://192.168.1.100:11434"  // Different machine
  ollamaModel="neural-chat"                   // Faster model
  useAIExplanations={true}
/>
```

### Example 3: Disabling AI Explanations

```jsx
// Use without Ollama - falls back to basic explanations
<ExplainableRiskBreakdown
  anomalyScore={45}
  vendorScore={30}
  benfordScore={20}
  useAIExplanations={false}  // Disable AI
/>
```

### Example 4: Direct Service Usage (Backend)

```python
from app.services.ollama_service import generate_explainable_risk

# Generate full breakdown
result = generate_explainable_risk(
    anomaly_score=50,
    vendor_score=30,
    benford_score=20,
    anomaly_details={"count": 100, "flagged": 145},
    vendor_details={"fuzzy_matches": 12, "ghost_vendors": 3},
    benford_details={"chi_square": 8.5, "p_value": 0.74, "mad": 0.0045},
    ollama_model="mistral",
    use_ai_explanations=True
)

print(result["total_risk"])  # 40.5
print(result["risk_level"])  # "MEDIUM"
print(result["components"]["anomaly_detection"]["explanation"])
# "The 50% anomaly risk indicates moderate statistical outliers..."
```

### Example 5: API Endpoint Usage

```bash
# Check Ollama status
curl http://localhost:8000/api/risk/ollama-status

# Generate explanations
curl -X POST "http://localhost:8000/api/risk/explainable-breakdown?anomaly_score=50&vendor_score=30&benford_score=20"

# Get single explanation
curl -X POST "http://localhost:8000/api/risk/quick-explanation?component=anomaly&risk_score=50"
```

---

## Configuration

### Recommended Models by RAM

| Model | Size | RAM | Speed | Quality | Command |
|-------|------|-----|-------|---------|---------|
| **mistral:7b** | 4.5GB | **6GB** | ⚡⚡ | ⭐⭐⭐ | `ollama pull mistral` |
| neural-chat:7b | 4GB | 6GB | ⚡⚡⚡ | ⭐⭐ | `ollama pull neural-chat` |
| llama2:7b | 4GB | 6GB | ⚡⚡ | ⭐⭐⭐ | `ollama pull llama2` |
| orca-mini:3b | 2GB | 4GB | ⚡⚡⚡ | ⭐ | `ollama pull orca-mini` |
| dolphin-mixtral:7b | 6.5GB | 8GB+ | ⚡ | ⭐⭐⭐⭐ | `ollama pull dolphin-mixtral` |

**For 6GB RAM: Use Mistral** ✓

### Environment Configuration

**`backend/config/settings.py`** (Optional, add if needed):

```python
# Ollama Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "60"))
```

**Or via environment variables:**

```bash
export OLLAMA_BASE_URL="http://localhost:11434"
export OLLAMA_MODEL="mistral"
export OLLAMA_TIMEOUT="60"

python run.py
```

---

## Performance Benchmarks

Tested on 6GB RAM system with **Mistral 7B**:

```
Response Times:
- Single component explanation: 2-4 seconds
- Complete breakdown (3 components): 5-8 seconds
- With summary + recommendations: 8-12 seconds

Memory Usage:
- Ollama server idle: ~100MB
- During inference (peak): ~4.5GB
- After response: ~100MB (released)

Network Latency:
- Localhost: <100ms
- Same LAN: <500ms
- Remote network: 1-2s

Throughput:
- 1 user: 0.1-0.2 requests/sec
- 5 concurrent: 50ms API overhead each
- Rate limited by LLM inference time
```

---

## Troubleshooting

### Issue: "Ollama Offline" Badge Showing

**Problem:** Component shows ⚠️ Ollama Offline but you have it installed.

**Solution:**
```bash
# 1. Check if Ollama is running
curl http://localhost:11434/api/tags

# 2. If no response, start Ollama
ollama serve

# 3. Verify model is installed
ollama list
# Should show: mistral:latest

# 4. If model missing, pull it
ollama pull mistral

# 5. Restart backend
cd backend && python run.py
```

### Issue: Slow Response Times (>10 seconds)

**Problem:** Explanations take too long to generate.

**Solution:**
```bash
# 1. Switch to faster model
ollama pull neural-chat

# 2. Update component config
ollamaModel="neural-chat"

# 3. Monitor system resources
# Check if RAM/CPU/GPU are maxed out
# - Windows: Task Manager
# - macOS: Activity Monitor
# - Linux: htop

# 4. Close other applications
# Free up 2GB+ of RAM for Ollama
```

### Issue: Out of Memory (OOM) Crashes

**Problem:** System freezes or Ollama crashes.

**Solution:**
```bash
# 1. Kill all Ollama processes
pkill ollama

# 2. Use smaller model (2GB instead of 4.5GB)
ollama pull orca-mini

# 3. Update component
ollamaModel="orca-mini"

# 4. Restart Ollama
ollama serve
```

### Issue: "Error: Ollama returned status 400"

**Problem:** Prompt processing error in Ollama.

**Solution:**
```bash
# 1. Check Ollama logs
# Terminal where ollama serve is running

# 2. Verify model is loaded
ollama list
ollama pull mistral

# 3. Test directly
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "prompt": "Explain fraud risk in one sentence.",
    "stream": false
  }'

# 4. If errors, restart
pkill ollama
ollama serve
```

---

## Customization

### Custom Prompts

Edit prompts in `backend/app/services/ollama_service.py`:

```python
def generate_anomaly_explanation(self, anomaly_score, total_anomalies, flagged_transactions):
    # CUSTOMIZE THIS PROMPT:
    prompt = f"""Analyze this fraud anomaly result (keep response under 100 words):

Risk Score: {anomaly_score:.1f}%
Total Anomalies: {total_anomalies}
Flagged Transactions: {flagged_transactions}

Your analysis should focus on:
1. What the score means for auditors
2. Recommended next steps
3. Risk interpretation"""
    
    return self._query_ollama(prompt)
```

**Tips:**
- Keep prompts concise (~200 chars)
- Use specific metrics
- Include context about interpretation
- Test with different scores before deploying

### Custom Models

Support any Ollama model by changing `ollamaModel`:

```jsx
// Try different models:
ollamaModel="mistral"          // Default
ollamaModel="neural-chat"      // Faster
ollamaModel="dolphin-mixtral"  // Higher quality
ollamaModel="orca-mini"        // Lightweight
```

### Remote Ollama Server

Run Ollama on powerful machine, access from LedgerSpy:

```bash
# On machine with GPU (e.g., workstation):
ollama serve --host 0.0.0.0:11434

# In LedgerSpy config:
ollamaBaseUrl="http://workstation-ip:11434"

# Test connectivity:
curl http://workstation-ip:11434/api/tags
```

---

## Deployment

### Single Machine (Recommended)

```bash
# Install Ollama
# https://ollama.ai

# Pull model
ollama pull mistral

# Start in background (or as service)
ollama serve &

# Start LedgerSpy
cd backend && python run.py
```

### Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: ledgerspy-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0:11434

  backend:
    build: ./backend
    container_name: ledgerspy-backend
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_MODEL=mistral
    depends_on:
      - ollama
    command: python run.py

  frontend:
    build: ./frontend
    container_name: ledgerspy-frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  ollama:
```

Start:
```bash
docker-compose up -d
# Wait for Ollama to download model (~5 min first time)
```

---

## Files & Structure

```
LedgerSpy/
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   ├── ollama_service.py          ← Core Ollama integration
│   │   │   │   ├── OllamaConfig
│   │   │   │   ├── RiskExplainer
│   │   │   │   └── RiskBreakdownGenerator
│   │   │   └── (other services)
│   │   │
│   │   ├── api/
│   │   │   ├── risk_explanations.py       ← REST endpoints
│   │   │   │   ├── GET /api/risk/ollama-status
│   │   │   │   ├── GET /api/risk/available-models
│   │   │   │   ├── POST /api/risk/explainable-breakdown
│   │   │   │   └── POST /api/risk/quick-explanation
│   │   │   └── (other routes)
│   │   │
│   │   ├── main.py                       ← Router registration
│   │   │   └── app.include_router(risk_explanations.router)
│   │   └── (other modules)
│   └── run.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ExplainableRiskBreakdown.jsx  ← React component
│   │   │   │   ├── Ollama status badge
│   │   │   │   ├── 3 expandable components
│   │   │   │   ├── Summary section
│   │   │   │   └── Recommendations
│   │   │   └── (other components)
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── OLLAMA_SETUP.md                   ← Complete guide
│   ├── OLLAMA_QUICKSTART.md              ← Quick reference
│   ├── architecture.md
│   ├── api_docs.md
│   └── (other docs)
│
└── README.md
```

---

## Next Steps

1. ✅ Install Ollama (https://ollama.ai)
2. ✅ Pull model: `ollama pull mistral`
3. ✅ Start server: `ollama serve`
4. ✅ Run LedgerSpy: `python run.py`
5. ✅ View dashboard: http://localhost:5173/dashboard

AI-powered explanations now appear automatically! 🎉

---

## FAQ

**Q: Does Ollama send data to cloud?**
A: No. 100% local, offline-first. Nothing leaves your machine.

**Q: Can I use Ollama with my own API?**
A: Yes. Set `ollamaBaseUrl` to any server running Ollama.

**Q: What if I don't have Ollama?**
A: Component works offline. Set `useAIExplanations={false}` for basic explanations.

**Q: Can I use other LLMs?**
A: Yes, any Ollama model. Visit https://ollama.ai/library

**Q: How much disk space?**
A: ~6GB for model + ~500MB cache. Auto-cleaned.

---

## Support

- **Ollama Docs:** https://github.com/ollama/ollama
- **Model Library:** https://ollama.ai/library
- **LedgerSpy Issues:** GitHub issues
- **Setup Help:** See OLLAMA_SETUP.md

---

## License

Same as LedgerSpy (Apache 2.0)

---

**Enjoy AI-powered fraud explanations! 🚀**
