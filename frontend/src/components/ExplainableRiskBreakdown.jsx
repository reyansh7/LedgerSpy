import React, { useState, useEffect } from 'react';
import { Zap, Brain, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import api from '../../services/api';

const ExplainableRiskBreakdown = ({ 
  anomalyScore = 50, 
  vendorScore = 30, 
  benfordScore = 20,
  useAIExplanations = true,
  ollamaBaseUrl = 'http://localhost:11434',
  ollamaModel = 'mistral'
}) => {
  const [breakdown, setBreakdown] = useState(null);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedComponent, setExpandedComponent] = useState(null);

  // Calculate weighted scores
  const totalRisk = (anomalyScore * 0.5) + (vendorScore * 0.3) + (benfordScore * 0.2);
  
  // Classify risk level
  const getRiskLevel = (score) => {
    if (score >= 70) return { level: 'CRITICAL', color: '#FF3131', bg: 'rgba(255, 49, 49, 0.1)' };
    if (score >= 50) return { level: 'HIGH', color: '#FF9500', bg: 'rgba(255, 149, 0, 0.1)' };
    if (score >= 30) return { level: 'MEDIUM', color: '#FFAC1C', bg: 'rgba(255, 172, 28, 0.1)' };
    return { level: 'LOW', color: '#00e676', bg: 'rgba(0, 230, 118, 0.1)' };
  };

  const riskLevel = getRiskLevel(totalRisk);

  // Check Ollama status on mount
  useEffect(() => {
    const checkOllamaStatus = async () => {
      try {
        const response = await api.get('/risk/ollama-status', {
          params: { base_url: ollamaBaseUrl }
        });
        setOllamaStatus(response.data);
      } catch (err) {
        setError('Could not connect to Ollama service');
        console.error('Ollama status check failed:', err);
      }
    };
    
    if (useAIExplanations) {
      checkOllamaStatus();
    }
  }, [useAIExplanations, ollamaBaseUrl]);

  // Generate explanations
  useEffect(() => {
    const generateBreakdown = async () => {
      if (!useAIExplanations || !ollamaStatus?.available) return;
      
      setLoading(true);
      try {
        const response = await api.post('/risk/explainable-breakdown', null, {
          params: {
            anomaly_score: anomalyScore,
            vendor_score: vendorScore,
            benford_score: benfordScore,
            base_url: ollamaBaseUrl,
            model: ollamaModel,
            use_ai_explanations: true
          }
        });
        
        if (response.data.status === 'success') {
          setBreakdown(response.data.breakdown);
        }
      } catch (err) {
        setError('Failed to generate explanations');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (useAIExplanations && ollamaStatus?.available) {
      generateBreakdown();
    }
  }, [useAIExplanations, ollamaStatus, anomalyScore, vendorScore, benfordScore, ollamaBaseUrl, ollamaModel]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-400" />
            Explainable Risk Breakdown
          </h2>
          <p className="text-slate-400 text-sm mt-1">AI-powered fraud risk analysis with detailed explanations</p>
        </div>
        
        {/* Ollama Status Badge */}
        <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
          ollamaStatus?.available 
            ? 'bg-green-900/20 border border-green-700'
            : 'bg-red-900/20 border border-red-700'
        }`}>
          {ollamaStatus?.available ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-xs font-semibold">Ollama Online</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-xs font-semibold">Ollama Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Overall Risk Card */}
      <div 
        className="rounded-lg p-6 border-2 transition-all"
        style={{
          background: riskLevel.bg,
          borderColor: riskLevel.color,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300 text-sm mb-2">TOTAL RISK SCORE</p>
            <div className="flex items-baseline gap-2">
              <span 
                className="text-5xl font-bold"
                style={{ color: riskLevel.color }}
              >
                {totalRisk.toFixed(1)}%
              </span>
              <span 
                className="text-lg font-semibold px-3 py-1 rounded-full"
                style={{ color: riskLevel.color, background: `${riskLevel.color}20` }}
              >
                {riskLevel.level}
              </span>
            </div>
          </div>
          
          <div className="text-right space-y-2">
            <p className="text-slate-400 text-xs">FORMULA:</p>
            <p className="text-slate-300 text-sm font-mono">
              Anomaly×50% + Vendor×30% + Benford×20%
            </p>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 text-blue-400 animate-spin mr-2" />
          <span className="text-slate-400">Generating AI explanations...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-semibold text-sm">{error}</p>
            <p className="text-red-200 text-xs mt-1">
              Ensure Ollama is running: <code className="bg-red-900/50 px-2 py-1 rounded">ollama serve</code>
            </p>
          </div>
        </div>
      )}

      {/* Component Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Anomaly Detection */}
        <div 
          className="bg-slate-800 rounded-lg border border-slate-700 p-4 cursor-pointer hover:border-blue-600 transition"
          onClick={() => setExpandedComponent(expandedComponent === 'anomaly' ? null : 'anomaly')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Anomaly Detection</h3>
            </div>
            <span className="text-2xl font-bold text-blue-400">{anomalyScore}%</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">Isolation Forest · Detects unusual patterns</p>
          
          {/* Weighted contribution */}
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-slate-500">Weighted: {(anomalyScore * 0.5).toFixed(1)}% (×50%)</span>
            <span className="text-blue-400 font-semibold">+{(anomalyScore * 0.5).toFixed(1)}%</span>
          </div>

          {/* Expandable Explanation */}
          {expandedComponent === 'anomaly' && breakdown?.components?.anomaly_detection && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-sm text-slate-300 leading-relaxed">
                {breakdown.components.anomaly_detection.explanation || 'Loading explanation...'}
              </p>
            </div>
          )}
        </div>

        {/* Vendor Matching */}
        <div 
          className="bg-slate-800 rounded-lg border border-slate-700 p-4 cursor-pointer hover:border-red-600 transition"
          onClick={() => setExpandedComponent(expandedComponent === 'vendor' ? null : 'vendor')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-white">Vendor Match</h3>
            </div>
            <span className="text-2xl font-bold text-red-400">{vendorScore}%</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">Fuzzy Matching · Detects vendor duplicates</p>
          
          {/* Weighted contribution */}
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-slate-500">Weighted: {(vendorScore * 0.3).toFixed(1)}% (×30%)</span>
            <span className="text-red-400 font-semibold">+{(vendorScore * 0.3).toFixed(1)}%</span>
          </div>

          {/* Expandable Explanation */}
          {expandedComponent === 'vendor' && breakdown?.components?.vendor_match && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-sm text-slate-300 leading-relaxed">
                {breakdown.components.vendor_match.explanation || 'Loading explanation...'}
              </p>
            </div>
          )}
        </div>

        {/* Benford's Law */}
        <div 
          className="bg-slate-800 rounded-lg border border-slate-700 p-4 cursor-pointer hover:border-yellow-600 transition"
          onClick={() => setExpandedComponent(expandedComponent === 'benford' ? null : 'benford')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-white">Benford's Law</h3>
            </div>
            <span className="text-2xl font-bold text-yellow-400">{benfordScore}%</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">Digit Distribution · Detects data manipulation</p>
          
          {/* Weighted contribution */}
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-slate-500">Weighted: {(benfordScore * 0.2).toFixed(1)}% (×20%)</span>
            <span className="text-yellow-400 font-semibold">+{(benfordScore * 0.2).toFixed(1)}%</span>
          </div>

          {/* Expandable Explanation */}
          {expandedComponent === 'benford' && breakdown?.components?.benford_law && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-sm text-slate-300 leading-relaxed">
                {breakdown.components.benford_law.explanation || 'Loading explanation...'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      {breakdown?.summary && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            AI Summary
          </h3>
          <p className="text-slate-300 leading-relaxed">
            {breakdown.summary}
          </p>
        </div>
      )}

      {/* Recommendations Section */}
      {breakdown?.recommendations && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Audit Recommendations
          </h3>
          <p className="text-slate-300 leading-relaxed">
            {breakdown.recommendations}
          </p>
        </div>
      )}

      {/* Offline Warning */}
      {useAIExplanations && !ollamaStatus?.available && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-300 text-sm font-semibold mb-2">Ollama Offline - Click components to see basic explanations</p>
          <p className="text-yellow-200 text-xs">To enable AI explanations:</p>
          <code className="bg-yellow-900/50 px-3 py-2 rounded text-xs text-yellow-100 block mt-2">
            ollama pull mistral && ollama serve
          </code>
        </div>
      )}
    </div>
  );
};

export default ExplainableRiskBreakdown;
