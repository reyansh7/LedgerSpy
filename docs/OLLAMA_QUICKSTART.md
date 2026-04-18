# Quick Start: Ollama + LedgerSpy in 5 Minutes

Get AI-powered fraud risk explanations running locally with Ollama.

## ⚡ 5-Minute Setup

### 1. Download Ollama (2 min)
- Go to https://ollama.ai
- Download for your OS (Windows/Mac/Linux)
- Install and restart computer

### 2. Pull Model (2 min)
```bash
ollama pull mistral
```

### 3. Start Ollama (1 min)
Keep this terminal open:
```bash
ollama serve
```

Output should show: `listening on 127.0.0.1:11434`

### 4. Verify Setup
In another terminal:
```bash
curl http://localhost:11434/api/tags
```

Should return your model list.

### 5. Done! 🎉

Start LedgerSpy and AI explanations work automatically:

```bash
cd backend && python run.py
```

Navigate to Dashboard → Risk Breakdown shows AI explanations!

---

## What You Get

```
Before (Static):
├── Anomaly Detection 50%
│   └── "Detects unusual patterns"
├── Vendor Matching 30%
│   └── "Finds duplicate vendors"
└── Benford's Law 20%
    └── "Checks first-digit distribution"

After (AI-Powered):
├── Anomaly Detection 50%
│   └── "The 50% score indicates moderate statistical outliers. 
│        Isolation Forest identified 150 transactions with unusual 
│        characteristics compared to baseline distribution."
├── Vendor Matching 30%
│   └── "Low vendor risk indicates good consistency. Only 12 fuzzy 
│        matches found with >85% similarity, suggesting minimal 
│        duplicate vendor issues."
└── Benford's Law 20%
    └── "First-digit distribution shows strong compliance (chi-square: 
        8.5). This indicates natural transaction amount distribution 
        with no signs of systematic manipulation."
```

---

## RAM Requirements

| RAM | Model | Quality | Speed |
|-----|-------|---------|-------|
| 4GB | orca-mini:3b | Fair | ⚡⚡⚡ |
| 6GB | mistral:7b | **High** | ⚡⚡ |
| 8GB+ | dolphin-mixtral | Best | ⚡ |

**Mistral recommended for 6GB** ← *Best balance*

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Ollama Offline" badge | Run `ollama serve` in separate terminal |
| "Model not found" | Run `ollama pull mistral` |
| Slow explanations | Switch to `neural-chat`: `ollama pull neural-chat` |
| Out of memory | Use smaller model: `ollama pull orca-mini` |
| Port 11434 error | Kill existing process: `pkill ollama` |

---

## API Endpoints (For Developers)

```bash
# Check status
curl http://localhost:8000/api/risk/ollama-status

# List models
curl http://localhost:8000/api/risk/available-models

# Generate explanations
curl -X POST "http://localhost:8000/api/risk/explainable-breakdown?anomaly_score=50&vendor_score=30&benford_score=20"

# Single explanation
curl -X POST "http://localhost:8000/api/risk/quick-explanation?component=anomaly&risk_score=50"
```

---

## Component Integration

```jsx
// In any component:
import ExplainableRiskBreakdown from './components/ExplainableRiskBreakdown';

function Dashboard() {
  return (
    <ExplainableRiskBreakdown
      anomalyScore={45}
      vendorScore={30}
      benfordScore={20}
      useAIExplanations={true}  // Enable AI
      ollamaModel="mistral"      // Choose model
    />
  );
}
```

---

## Features

✅ **Offline** - No cloud, no API keys  
✅ **Fast** - 2-5 seconds per explanation  
✅ **Explainable** - Auditors understand *why* fraud flagged  
✅ **Lightweight** - Works on 6GB RAM  
✅ **Customizable** - Change models anytime  
✅ **Free** - Open source, no costs  

---

## What Happens Behind the Scenes

```
Frontend (React)
    ↓ (1) Check Ollama available?
Backend (FastAPI)
    ↓ (2) Generate prompts for each component
    ↓ (3) Send to Ollama on port 11434
Ollama (Local LLM)
    ↓ (4) Process prompts with Mistral model
    ↓ (5) Return AI explanations
Backend (FastAPI)
    ↓ (6) Format and return JSON
Frontend (React)
    ↓ (7) Display explanations in cards
User (You!)
    ↓ (8) Read AI explanations 🧠
```

---

## Performance

| Task | Time |
|------|------|
| Load Ollama model | 2-3s (first time only) |
| Single explanation | 2-4s |
| Full breakdown (3 components) | 5-8s |
| With summary + recommendations | 8-12s |

---

## Offline Mode

If Ollama goes offline:
- ✅ Component still works
- ✅ Shows "Ollama Offline" badge
- ✅ Users can click components to expand
- ⚠️ Shows basic info instead of AI explanations
- 🔄 Retries Ollama connection every 30s

---

## Available Models

```bash
# Recommended for 6GB RAM
ollama pull mistral          # 4.5GB - Best balance
ollama pull neural-chat      # 4GB - Very fast
ollama pull llama2           # 4GB - General purpose

# For limited RAM
ollama pull orca-mini        # 2GB - Lightweight
ollama pull tinyllama        # 1GB - Ultra-lightweight

# For powerful systems
ollama pull dolphin-mixtral  # 6.5GB - Highest quality
```

---

## Files Created

```
backend/
├── app/
│   ├── services/
│   │   └── ollama_service.py          ← AI explanation service
│   ├── api/
│   │   └── risk_explanations.py       ← REST API endpoints
│   └── main.py                         ← (Updated with router)
│
frontend/
├── src/
│   └── components/
│       └── ExplainableRiskBreakdown.jsx ← React component

docs/
├── OLLAMA_SETUP.md                     ← Full guide (this file)
└── OLLAMA_QUICKSTART.md                ← Quick reference
```

---

## Architecture

```
ExplainableRiskBreakdown (React)
  ├── useEffect: Check Ollama status
  ├── POST /api/risk/explainable-breakdown
  │   └── Calls RiskBreakdownGenerator
  │       └── Calls RiskExplainer
  │           └── Generates prompts
  │               └── HTTP to Ollama:11434
  │                   └── LLM inference
  │                       └── Returns JSON
  │
  └── Display AI explanations
      ├── Component cards
      ├── Summary section
      └── Recommendations section
```

---

## Next Steps

1. **Setup** (5 minutes)
   ```bash
   # Terminal 1:
   ollama serve
   
   # Terminal 2:
   cd backend && python run.py
   ```

2. **Test** (1 minute)
   - Open http://localhost:5173
   - Navigate to Dashboard
   - Click on risk components
   - See AI explanations! 🎉

3. **Deploy** (Optional)
   - Update `ollamaBaseUrl` in config
   - Use for production audits
   - Share insights with team

---

## Common Tasks

### Switch to Faster Model
```bash
ollama pull neural-chat
# Update component: ollamaModel="neural-chat"
```

### Use on Different Machine
```bash
# Start on powerful machine:
ollama serve --host 0.0.0.0:11434

# In LedgerSpy config:
ollamaBaseUrl="http://192.168.1.100:11434"
```

### Disable AI Explanations
```jsx
<ExplainableRiskBreakdown useAIExplanations={false} />
```

### Check Model Status
```bash
ollama list
curl http://localhost:11434/api/tags
```

---

## Resources

- **Ollama Website:** https://ollama.ai
- **Model Library:** https://ollama.ai/library
- **GitHub:** https://github.com/ollama/ollama
- **LedgerSpy Docs:** /docs/

---

**Enjoy AI-powered fraud risk analysis! 🚀**

For detailed troubleshooting and advanced setup, see **OLLAMA_SETUP.md**
