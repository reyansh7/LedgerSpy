import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

/* ── Shared UI primitives ─────────────────────────────────── */
const GlassCard = ({ children, style, highlight = false, accentColor }) => (
  <div
    style={{
      background: highlight
        ? `linear-gradient(135deg, ${accentColor ? `${accentColor}15` : 'rgba(139, 92, 246, 0.15)'}, ${accentColor ? `${accentColor}08` : 'rgba(59, 130, 246, 0.08)'})`
        : 'linear-gradient(135deg, rgba(18, 22, 38, 0.7), rgba(27, 27, 47, 0.4))',
      border: highlight
        ? `1px solid ${accentColor ? `${accentColor}40` : 'rgba(139, 92, 246, 0.3)'}`
        : '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      padding: '20px',
      backdropFilter: 'blur(16px)',
      transition: 'all 300ms ease',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = highlight
        ? (accentColor ? `${accentColor}60` : 'rgba(139, 92, 246, 0.5)')
        : 'rgba(255,255,255,0.12)';
      e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = highlight
        ? (accentColor ? `${accentColor}40` : 'rgba(139, 92, 246, 0.3)')
        : 'rgba(255,255,255,0.06)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    {children}
  </div>
);

/* ── Circular Gauge ─────────────────────────────────── */
function CircularGauge({ value, size = 160, strokeWidth = 10, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ filter: `drop-shadow(0 0 12px ${color}50)` }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontSize: '2.2rem',
          fontWeight: 800,
          fontFamily: "'Poppins', sans-serif",
          color: '#fff',
          lineHeight: 1,
        }}>
          {value.toFixed(1)}
        </span>
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: color,
          marginTop: '2px',
        }}>
          %
        </span>
        <span style={{
          fontSize: '0.6rem',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.5)',
          marginTop: '6px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          Total Risk
        </span>
      </div>
    </div>
  );
}

/* ── Risk Component Card ─────────────────────────────────── */
function RiskComponentCard({ title, icon, score, weight, weightedContribution, color, description, explanation, isExpanded, onToggle, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        onClick={onToggle}
        style={{
          background: `linear-gradient(135deg, ${color}12, rgba(18, 22, 38, 0.6))`,
          border: `1px solid ${color}30`,
          borderRadius: '16px',
          padding: '24px',
          cursor: 'pointer',
          transition: 'all 300ms ease',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${color}60`;
          e.currentTarget.style.boxShadow = `0 8px 32px ${color}15`;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${color}30`;
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Accent top bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${color}, ${color}44)`,
        }} />

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `${color}18`,
              border: `1px solid ${color}25`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
            }}>
              {icon}
            </div>
            <div>
              <h3 style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
              }}>
                {title}
              </h3>
              <p style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.45)',
                margin: '2px 0 0 0',
              }}>
                {description}
              </p>
            </div>
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: color,
            fontFamily: "'Poppins', sans-serif",
            textShadow: `0 0 20px ${color}30`,
          }}>
            {Math.round(score)}%
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '14px',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(score, 100)}%` }}
            transition={{ duration: 1.2, delay: delay + 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${color}, ${color}bb)`,
              borderRadius: '3px',
              boxShadow: `0 0 10px ${color}40`,
            }}
          />
        </div>

        {/* Weighted contribution */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: '10px',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            Weighted Contribution
          </span>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: color,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}>
            +{weightedContribution.toFixed(1)}% (×{(weight * 100).toFixed(0)}%)
          </span>
        </div>

        {/* Expandable Explanation */}
        <AnimatePresence>
          {isExpanded && explanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                marginTop: '16px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.25)',
                border: `1px solid ${color}20`,
                borderTop: `2px solid ${color}30`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem' }}>🤖</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    AI Analysis
                  </span>
                </div>
                <p style={{
                  fontSize: '0.82rem',
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {explanation}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand indicator */}
        <div style={{
          textAlign: 'center',
          marginTop: '8px',
        }}>
          <span style={{
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.5px',
          }}>
            {isExpanded ? '▲ Click to collapse' : '▼ Click for AI analysis'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Component ─────────────────────────────────── */
const ExplainableRiskBreakdown = ({
  anomalyScore = 50,
  vendorScore = 30,
  benfordScore = 20,
  useAIExplanations = true,
  ollamaBaseUrl = 'http://localhost:11434',
  ollamaModel = 'neural-chat'
}) => {
  // ✅ Ensure all scores are valid numbers (0-100)
  const normalizeScore = (score) => {
    const normalized = Math.max(0, Math.min(100, Number(score) || 0));
    return Math.round(normalized * 10) / 10; // Round to 1 decimal place
  };
  
  const anomalyScoreNormalized = normalizeScore(anomalyScore);
  const vendorScoreNormalized = normalizeScore(vendorScore);
  const benfordScoreNormalized = normalizeScore(benfordScore);
  
  const [breakdown, setBreakdown] = useState(null);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedComponent, setExpandedComponent] = useState(null);

  // Calculate weighted scores with consistent rounding
  const totalRisk = Math.round(
    (anomalyScoreNormalized * 0.5) + 
    (vendorScoreNormalized * 0.3) + 
    (benfordScoreNormalized * 0.2)
  );

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
            anomaly_score: anomalyScoreNormalized,
            vendor_score: vendorScoreNormalized,
            benford_score: benfordScoreNormalized,
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
  }, [useAIExplanations, ollamaStatus, anomalyScoreNormalized, vendorScoreNormalized, benfordScoreNormalized, ollamaBaseUrl, ollamaModel]);

  const components = [
    {
      key: 'anomaly',
      title: 'Anomaly Detection',
      icon: '⚡',
      score: anomalyScoreNormalized,
      weight: 0.5,
      color: '#3b82f6',
      description: 'Isolation Forest · Detects unusual patterns',
      explanation: breakdown?.components?.anomaly_detection?.explanation,
    },
    {
      key: 'vendor',
      title: 'Vendor Match',
      icon: '⚠️',
      score: vendorScoreNormalized,
      weight: 0.3,
      color: '#ef4444',
      description: 'Fuzzy Matching · Detects vendor duplicates',
      explanation: breakdown?.components?.vendor_match?.explanation,
    },
    {
      key: 'benford',
      title: "Benford's Law",
      icon: '🧠',
      score: benfordScoreNormalized,
      weight: 0.2,
      color: '#f59e0b',
      description: 'Digit Distribution · Detects data manipulation',
      explanation: breakdown?.components?.benford_law?.explanation,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Header Card */}
      <GlassCard highlight accentColor={riskLevel.color}>
        {/* Accent bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${riskLevel.color}, ${riskLevel.color}66)`,
          borderRadius: '16px 16px 0 0',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${riskLevel.color}25, ${riskLevel.color}10)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
              }}>
                🧠
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #fff, #94a3b8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Explainable Risk Breakdown
                </h2>
                <p style={{
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.5)',
                  margin: '4px 0 0 0',
                }}>
                  AI-powered fraud risk analysis with detailed explanations
                </p>
              </div>
            </div>

            {/* Ollama Status Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: ollamaStatus?.available ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${ollamaStatus?.available ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              marginTop: '8px',
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: ollamaStatus?.available ? '#22c55e' : '#ef4444',
                boxShadow: `0 0 6px ${ollamaStatus?.available ? '#22c55e' : '#ef4444'}`,
              }} />
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: ollamaStatus?.available ? '#4ade80' : '#f87171',
              }}>
                {ollamaStatus?.available ? 'Ollama Online' : 'Ollama Offline'}
              </span>
            </div>
          </div>

          {/* Circular Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <CircularGauge
              value={totalRisk}
              size={160}
              color={riskLevel.color}
            />
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: riskLevel.color,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              textShadow: `0 0 12px ${riskLevel.color}30`,
            }}>
              {riskLevel.level}
            </div>
          </div>
        </div>

        {/* Risk Calculation Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginTop: '24px',
        }}>
          {[
            { label: 'Anomaly', value: (anomalyScoreNormalized * 0.5).toFixed(1), color: '#3b82f6' },
            { label: 'Vendor', value: (vendorScoreNormalized * 0.3).toFixed(1), color: '#ef4444' },
            { label: 'Benford', value: (benfordScoreNormalized * 0.2).toFixed(1), color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.04)',
                textAlign: 'center',
              }}
            >
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}>
                {label}
              </div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: color,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}>
                {value}%
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Loading Indicator */}
      {loading && (
        <GlassCard>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            padding: '24px',
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '1.8rem' }}
            >
              ⏳
            </motion.div>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
            }}>
              Generating AI explanations...
            </span>
          </div>
        </GlassCard>
      )}

      {/* Error Message */}
      {error && (
        <GlassCard style={{
          borderLeft: '4px solid #ef4444',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f87171', margin: '0 0 6px 0' }}>
                {error}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                Ensure Ollama is running:{' '}
                <code style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  color: '#fca5a5',
                }}>
                  ollama serve
                </code>
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Component Breakdown Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, 1fr)',
        gap: '16px',
      }}>
        {components.map((comp, idx) => (
          <RiskComponentCard
            key={comp.key}
            title={comp.title}
            icon={comp.icon}
            score={comp.score}
            weight={comp.weight}
            weightedContribution={comp.score * comp.weight}
            color={comp.color}
            description={comp.description}
            explanation={comp.explanation}
            isExpanded={expandedComponent === comp.key}
            onToggle={() => setExpandedComponent(expandedComponent === comp.key ? null : comp.key)}
            delay={idx * 0.1}
          />
        ))}
      </div>

      {/* AI Summary Section */}
      {breakdown?.summary && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <GlassCard highlight accentColor="#8b5cf6" style={{
            borderLeft: '4px solid #8b5cf6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}>
                🧠
              </div>
              <h3 style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
              }}>
                AI Summary
              </h3>
            </div>
            <p style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.7,
              margin: 0,
            }}>
              {breakdown.summary}
            </p>
          </GlassCard>
        </motion.div>
      )}

      {/* Recommendations Section */}
      {breakdown?.recommendations && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <GlassCard highlight accentColor="#22c55e" style={{
            borderLeft: '4px solid #22c55e',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(34, 197, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}>
                ✅
              </div>
              <h3 style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
              }}>
                Audit Recommendations
              </h3>
            </div>
            <p style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.7,
              margin: 0,
            }}>
              {breakdown.recommendations}
            </p>
          </GlassCard>
        </motion.div>
      )}

      {/* Offline Warning */}
      {useAIExplanations && !ollamaStatus?.available && (
        <GlassCard style={{
          borderLeft: '4px solid #f59e0b',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02))',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>💡</span>
            <div>
              <p style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#fbbf24',
                margin: '0 0 4px 0',
              }}>
                Ollama Offline — Click components to see basic explanations
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)',
                margin: '0 0 10px 0',
              }}>
                To enable AI explanations, run:
              </p>
              <code style={{
                display: 'block',
                background: 'rgba(0,0,0,0.3)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                color: '#fde68a',
                border: '1px solid rgba(245, 158, 11, 0.15)',
              }}>
                ollama pull neural-chat && ollama serve
              </code>
            </div>
          </div>
        </GlassCard>
      )}
    </motion.div>
  );
};

export default ExplainableRiskBreakdown;
