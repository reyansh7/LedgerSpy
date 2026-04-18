"""
Explainable Risk API Routes

FastAPI endpoints for generating AI-powered risk explanations using Ollama.

Endpoints:
- POST /api/risk/explainable-breakdown - Generate complete risk breakdown with explanations
- GET /api/risk/ollama-status - Check Ollama availability
- GET /api/risk/available-models - List available Ollama models
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict
import logging

from app.services.ollama_service import (
    RiskBreakdownGenerator,
    OllamaConfig,
    generate_explainable_risk,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/risk", tags=["risk-explanations"])


@router.get("/ollama-status")
async def check_ollama_status(base_url: str = Query(default="http://localhost:11434")):
    """
    Check if Ollama service is available.
    
    Args:
        base_url: Ollama server URL
    
    Returns:
        Status information
    """
    config = OllamaConfig(base_url=base_url)
    is_available = config.is_available()
    available_models = config.get_available_models() if is_available else []
    
    return {
        "status": "available" if is_available else "unavailable",
        "ollama_url": base_url,
        "available": is_available,
        "models": available_models,
        "recommended_model": "mistral",  # Best for 6GB RAM
        "message": (
            "✓ Ollama is running" if is_available
            else "⚠️ Ollama not detected. Install from https://ollama.ai"
        ),
    }


@router.get("/available-models")
async def get_available_models(base_url: str = Query(default="http://localhost:11434")):
    """
    Get list of available Ollama models.
    
    Args:
        base_url: Ollama server URL
    
    Returns:
        List of available models
    """
    config = OllamaConfig(base_url=base_url)
    models = config.get_available_models()
    
    recommended = {
        "mistral": {
            "size": "4.5GB",
            "speed": "Fast",
            "quality": "High",
            "recommended": True,
            "ram_required": "6GB",
        },
        "neural-chat": {
            "size": "4GB",
            "speed": "Very Fast",
            "quality": "Good",
            "recommended": True,
            "ram_required": "6GB",
        },
        "orca-mini": {
            "size": "2GB",
            "speed": "Fastest",
            "quality": "Fair",
            "recommended": False,
            "ram_required": "4GB",
        },
        "llama2": {
            "size": "4GB",
            "speed": "Fast",
            "quality": "High",
            "recommended": True,
            "ram_required": "6GB",
        },
    }
    
    return {
        "available_models": models,
        "recommendations": recommended,
        "setup_guide": {
            "step_1": "Download Ollama from https://ollama.ai",
            "step_2": "Run: ollama pull mistral",
            "step_3": "Run: ollama serve",
            "step_4": "Verify: curl http://localhost:11434/api/tags",
        },
    }


@router.post("/explainable-breakdown")
async def generate_explainable_breakdown(
    anomaly_score: float,
    vendor_score: float,
    benford_score: float,
    base_url: str = Query(default="http://localhost:11434"),
    model: str = Query(default="mistral"),
    use_ai_explanations: bool = Query(default=True),
    anomaly_details: Optional[Dict] = None,
    vendor_details: Optional[Dict] = None,
    benford_details: Optional[Dict] = None,
):
    """
    Generate complete explainable risk breakdown with AI explanations.
    
    Args:
        anomaly_score: Anomaly detection risk (0-100)
        vendor_score: Vendor matching risk (0-100)
        benford_score: Benford's Law risk (0-100)
        base_url: Ollama server URL
        model: Ollama model to use
        use_ai_explanations: Whether to generate AI explanations
        anomaly_details: Metadata about anomalies
        vendor_details: Metadata about vendors
        benford_details: Metadata about Benford analysis
    
    Returns:
        Complete breakdown with AI-generated explanations
    """
    try:
        breakdown = generate_explainable_risk(
            anomaly_score=anomaly_score,
            vendor_score=vendor_score,
            benford_score=benford_score,
            anomaly_details=anomaly_details or {
                "count": 0,
                "flagged": 0,
            },
            vendor_details=vendor_details or {
                "fuzzy_matches": 0,
                "ghost_vendors": 0,
            },
            benford_details=benford_details or {
                "chi_square": 0,
                "p_value": 0,
                "mad": 0,
                "non_compliant": False,
            },
            ollama_base_url=base_url,
            ollama_model=model,
            use_ai_explanations=use_ai_explanations,
        )
        
        return {
            "status": "success",
            "breakdown": breakdown,
        }
    
    except Exception as e:
        logger.error(f"Error generating breakdown: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Error generating risk breakdown: {str(e)}"
        )


@router.post("/quick-explanation")
async def get_quick_explanation(
    component: str,
    risk_score: float,
    base_url: str = Query(default="http://localhost:11434"),
    model: str = Query(default="mistral"),
):
    """
    Get quick AI explanation for a single risk component.
    
    Args:
        component: Component type (anomaly, vendor, benford)
        risk_score: Risk score (0-100)
        base_url: Ollama server URL
        model: Ollama model to use
    
    Returns:
        Quick explanation
    """
    try:
        config = OllamaConfig(base_url=base_url, model=model)
        generator = RiskBreakdownGenerator(config)
        
        if component == "anomaly":
            explanation = generator.explainer.generate_anomaly_explanation(
                risk_score, 0, 0
            )
        elif component == "vendor":
            explanation = generator.explainer.generate_vendor_explanation(
                risk_score, 0, 0
            )
        elif component == "benford":
            explanation = generator.explainer.generate_benford_explanation(
                risk_score, 0, 0, 0
            )
        else:
            raise ValueError(f"Unknown component: {component}")
        
        return {
            "status": "success",
            "component": component,
            "risk_score": risk_score,
            "explanation": explanation,
        }
    
    except Exception as e:
        logger.error(f"Error generating explanation: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Error generating explanation: {str(e)}"
        )
