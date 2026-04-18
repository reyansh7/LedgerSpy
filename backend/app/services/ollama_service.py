"""
Ollama Integration Service

Integrates local Ollama LLM for generating intelligent explanations of fraud risk.
Supports lightweight models that run on 6GB RAM offline.

Recommended Models:
- mistral:7b (~4.5GB) - Best balance of speed & quality
- neural-chat:7b (~4GB) - Fast, optimized for chat
- orca-mini:3b (~2GB) - Ultra-lightweight
- llama2:7b (~4GB) - Good general purpose

Installation:
    1. Download Ollama: https://ollama.ai
    2. Pull model: ollama pull mistral
    3. Start Ollama: ollama serve
    4. Verify: curl http://localhost:11434/api/tags
"""

import requests
import json
from typing import Optional, Dict, List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class OllamaConfig:
    """Ollama configuration and connectivity"""
    
    DEFAULT_BASE_URL = "http://localhost:11434"
    DEFAULT_MODEL = "neural-chat"  # Lightweight & fast (4GB)
    DEFAULT_TIMEOUT = 60
    
    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        model: str = DEFAULT_MODEL,
        timeout: int = DEFAULT_TIMEOUT,
    ):
        self.base_url = base_url
        self.model = model
        self.timeout = timeout
    
    def is_available(self) -> bool:
        """Check if Ollama server is running"""
        try:
            response = requests.get(
                f"{self.base_url}/api/tags",
                timeout=2
            )
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama not available: {e}")
            return False
    
    def get_available_models(self) -> List[str]:
        """Get list of available Ollama models"""
        try:
            response = requests.get(
                f"{self.base_url}/api/tags",
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                return [model["name"].split(":")[0] for model in data.get("models", [])]
            return []
        except Exception as e:
            logger.warning(f"Failed to get models: {e}")
            return []


class RiskExplainer:
    """
    Generate intelligent explanations for fraud risk components.
    Uses Ollama local LLM for offline, fast explanations.
    """
    
    def __init__(self, config: OllamaConfig = None):
        self.config = config or OllamaConfig()
        self._verify_ollama()
    
    def _verify_ollama(self):
        """Verify Ollama is running"""
        if not self.config.is_available():
            logger.warning(
                f"⚠️ Ollama not running at {self.config.base_url}. "
                f"Install from https://ollama.ai and run: ollama pull {self.config.model} && ollama serve"
            )
    
    def generate_anomaly_explanation(
        self,
        anomaly_score: float,
        total_anomalies: int,
        flagged_transactions: int,
    ) -> str:
        """
        Generate explanation for anomaly detection component.
        
        Args:
            anomaly_score: Anomaly risk score (0-100)
            total_anomalies: Total anomalies detected
            flagged_transactions: Number of flagged transactions
            
        Returns:
            Generated explanation text
        """
        prompt = f"""Provide a brief, technical explanation for this fraud anomaly detection result (1-2 sentences):

Risk Score: {anomaly_score:.1f}%
Model: Isolation Forest with Ensemble Voting
Anomalies Detected: {total_anomalies}
Flagged Transactions: {flagged_transactions}
Contamination Rate: 5%

Generate a short, clear explanation suitable for financial auditors. Focus on what the score means."""
        
        return self._query_ollama(prompt)
    
    def generate_vendor_explanation(
        self,
        vendor_score: float,
        fuzzy_matches: int,
        ghost_vendors: int,
    ) -> str:
        """
        Generate explanation for vendor matching component.
        
        Args:
            vendor_score: Vendor match risk score (0-100)
            fuzzy_matches: Number of fuzzy matches found
            ghost_vendors: Number of ghost/duplicate vendors
            
        Returns:
            Generated explanation text
        """
        prompt = f"""Provide a brief technical explanation for this vendor matching result (1-2 sentences):

Risk Score: {vendor_score:.1f}%
Method: Fuzzy String Matching (Levenshtein Distance)
Suspicious Matches: {fuzzy_matches}
Ghost Vendors Detected: {ghost_vendors}

Generate a clear explanation of what this score indicates about vendor risk. Keep it concise."""
        
        return self._query_ollama(prompt)
    
    def generate_benford_explanation(
        self,
        benford_score: float,
        chi_square: float,
        p_value: float,
        mad: float,
    ) -> str:
        """
        Generate explanation for Benford's Law component.
        
        Args:
            benford_score: Benford risk score (0-100)
            chi_square: Chi-square statistic
            p_value: Statistical p-value
            mad: Mean Absolute Deviation
            
        Returns:
            Generated explanation text
        """
        prompt = f"""Provide a brief technical explanation for this Benford's Law analysis (1-2 sentences):

Risk Score: {benford_score:.1f}%
Chi-Square Statistic: {chi_square:.2f}
P-Value: {p_value:.6f}
MAD (Mean Absolute Deviation): {mad:.6f}
Threshold: 15.507

Explain what this indicates about first-digit distribution anomalies and data manipulation risk. Be concise."""
        
        return self._query_ollama(prompt)
    
    def generate_risk_summary(
        self,
        total_risk: float,
        anomaly_score: float,
        vendor_score: float,
        benford_score: float,
        key_findings: List[str],
    ) -> str:
        """
        Generate comprehensive risk summary.
        
        Args:
            total_risk: Overall risk score (0-100)
            anomaly_score: Anomaly detection component
            vendor_score: Vendor matching component
            benford_score: Benford's Law component
            key_findings: List of key audit findings
            
        Returns:
            Generated summary text
        """
        findings_text = "\n".join([f"- {f}" for f in key_findings[:3]])
        
        prompt = f"""Generate a brief executive summary for fraud risk assessment (2-3 sentences):

Total Risk Score: {total_risk:.1f}%
Components:
  - Anomaly Detection: {anomaly_score:.1f}% (50% weight)
  - Vendor Matching: {vendor_score:.1f}% (30% weight)
  - Benford's Law: {benford_score:.1f}% (20% weight)

Key Findings:
{findings_text}

Provide a clear, actionable summary for financial auditors. Focus on overall risk level and next steps."""
        
        return self._query_ollama(prompt)
    
    def generate_audit_recommendation(
        self,
        total_risk: float,
        top_anomalies: int,
        suspicious_vendors: int,
        data_manipulation_risk: float,
    ) -> str:
        """
        Generate audit recommendations.
        
        Args:
            total_risk: Overall fraud risk (0-100)
            top_anomalies: Number of top anomalies
            suspicious_vendors: Number of suspicious vendors
            data_manipulation_risk: Risk of data manipulation
            
        Returns:
            Generated recommendations
        """
        prompt = f"""Provide audit recommendations for this fraud risk scenario (2-3 action items):

Overall Risk Level: {total_risk:.1f}%
High-Risk Anomalies Found: {top_anomalies}
Suspicious Vendors: {suspicious_vendors}
Data Manipulation Risk: {data_manipulation_risk:.1f}%

Generate 2-3 specific, actionable recommendations for auditors. Focus on high-impact areas."""
        
        return self._query_ollama(prompt)
    
    def _query_ollama(self, prompt: str) -> str:
        """
        Query Ollama LLM for response.
        
        Args:
            prompt: Prompt to send to model
            
        Returns:
            Generated response text
        """
        if not self.config.is_available():
            return "⚠️ Ollama service not available. Ensure Ollama is running at " \
                   f"{self.config.base_url} with model {self.config.model}"
        
        try:
            payload = {
                "model": self.config.model,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.3,  # Lower temperature for consistent, focused responses
                "top_p": 0.9,
                "top_k": 40,
            }
            
            response = requests.post(
                f"{self.config.base_url}/api/generate",
                json=payload,
                timeout=self.config.timeout,
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "").strip()
            else:
                logger.error(f"Ollama error: {response.status_code} - {response.text}")
                return f"Error: Ollama returned status {response.status_code}"
        
        except requests.Timeout:
            logger.error("Ollama request timeout")
            return "⚠️ Ollama response timeout. Model may be slow or system overloaded."
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            return f"⚠️ Error generating explanation: {str(e)}"


class RiskBreakdownGenerator:
    """
    Generate complete explainable risk breakdown with AI explanations.
    """
    
    def __init__(self, ollama_config: OllamaConfig = None):
        self.explainer = RiskExplainer(ollama_config or OllamaConfig())
    
    def generate_breakdown(
        self,
        anomaly_score: float,
        anomaly_details: Dict,
        vendor_score: float,
        vendor_details: Dict,
        benford_score: float,
        benford_details: Dict,
        use_ai_explanations: bool = True,
    ) -> Dict:
        """
        Generate complete risk breakdown with explanations.
        
        Args:
            anomaly_score: Anomaly detection risk (0-100)
            anomaly_details: Anomaly metadata
            vendor_score: Vendor matching risk (0-100)
            vendor_details: Vendor metadata
            benford_score: Benford's Law risk (0-100)
            benford_details: Benford metadata
            use_ai_explanations: Whether to use AI explanations
            
        Returns:
            Complete breakdown dict
        """
        # Calculate total risk (50% anomaly, 30% vendor, 20% benford)
        total_risk = (
            anomaly_score * 0.50 +
            vendor_score * 0.30 +
            benford_score * 0.20
        )
        
        breakdown = {
            "timestamp": datetime.now().isoformat(),
            "total_risk": float(total_risk),
            "risk_level": self._classify_risk(total_risk),
            "components": {
                "anomaly_detection": {
                    "score": float(anomaly_score),
                    "weight": 0.50,
                    "weighted_score": float(anomaly_score * 0.50),
                    "method": "Isolation Forest + Ensemble Voting",
                    "explanation": self.explainer.generate_anomaly_explanation(
                        anomaly_score,
                        anomaly_details.get("count", 0),
                        anomaly_details.get("flagged", 0),
                    ) if use_ai_explanations else None,
                    "details": anomaly_details,
                },
                "vendor_match": {
                    "score": float(vendor_score),
                    "weight": 0.30,
                    "weighted_score": float(vendor_score * 0.30),
                    "method": "Fuzzy String Matching",
                    "explanation": self.explainer.generate_vendor_explanation(
                        vendor_score,
                        vendor_details.get("fuzzy_matches", 0),
                        vendor_details.get("ghost_vendors", 0),
                    ) if use_ai_explanations else None,
                    "details": vendor_details,
                },
                "benford_law": {
                    "score": float(benford_score),
                    "weight": 0.20,
                    "weighted_score": float(benford_score * 0.20),
                    "method": "First-Digit Distribution Analysis",
                    "explanation": self.explainer.generate_benford_explanation(
                        benford_score,
                        benford_details.get("chi_square", 0),
                        benford_details.get("p_value", 0),
                        benford_details.get("mad", 0),
                    ) if use_ai_explanations else None,
                    "details": benford_details,
                },
            },
            "summary": self.explainer.generate_risk_summary(
                total_risk,
                anomaly_score,
                vendor_score,
                benford_score,
                self._extract_key_findings(anomaly_details, vendor_details, benford_details),
            ) if use_ai_explanations else None,
            "recommendations": self.explainer.generate_audit_recommendation(
                total_risk,
                anomaly_details.get("flagged", 0),
                vendor_details.get("ghost_vendors", 0),
                benford_score,
            ) if use_ai_explanations else None,
        }
        
        return breakdown
    
    def _classify_risk(self, score: float) -> str:
        """Classify risk level"""
        if score >= 70:
            return "CRITICAL"
        elif score >= 50:
            return "HIGH"
        elif score >= 30:
            return "MEDIUM"
        elif score >= 10:
            return "LOW"
        else:
            return "MINIMAL"
    
    def _extract_key_findings(
        self,
        anomaly_details: Dict,
        vendor_details: Dict,
        benford_details: Dict,
    ) -> List[str]:
        """Extract key findings from all components"""
        findings = []
        
        # Anomaly findings
        if anomaly_details.get("flagged", 0) > 0:
            findings.append(
                f"{anomaly_details['flagged']} transactions flagged as anomalies"
            )
        
        # Vendor findings
        if vendor_details.get("ghost_vendors", 0) > 0:
            findings.append(
                f"{vendor_details['ghost_vendors']} potential ghost/duplicate vendors detected"
            )
        
        # Benford findings
        if benford_details.get("non_compliant", False):
            findings.append(
                "First-digit distribution shows signs of data manipulation"
            )
        
        return findings


# Convenience function
def generate_explainable_risk(
    anomaly_score: float,
    vendor_score: float,
    benford_score: float,
    anomaly_details: Dict = None,
    vendor_details: Dict = None,
    benford_details: Dict = None,
    ollama_base_url: str = "http://localhost:11434",
    ollama_model: str = "mistral",
    use_ai_explanations: bool = True,
) -> Dict:
    """
    Generate complete explainable risk breakdown.
    
    Args:
        anomaly_score: Anomaly risk (0-100)
        vendor_score: Vendor risk (0-100)
        benford_score: Benford risk (0-100)
        anomaly_details: Metadata about anomalies
        vendor_details: Metadata about vendors
        benford_details: Metadata about Benford analysis
        ollama_base_url: Ollama server URL
        ollama_model: Model name to use
        use_ai_explanations: Whether to generate AI explanations
        
    Returns:
        Complete breakdown with AI explanations
    """
    config = OllamaConfig(
        base_url=ollama_base_url,
        model=ollama_model,
    )
    
    generator = RiskBreakdownGenerator(config)
    
    return generator.generate_breakdown(
        anomaly_score,
        anomaly_details or {},
        vendor_score,
        vendor_details or {},
        benford_score,
        benford_details or {},
        use_ai_explanations=use_ai_explanations,
    )
