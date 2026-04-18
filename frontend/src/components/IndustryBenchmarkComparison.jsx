import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

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
function CircularGauge({ value, size = 130, strokeWidth = 8, color, label }) {
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
          transition={{ duration: 1.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
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
          fontSize: '1.8rem',
          fontWeight: 800,
          fontFamily: "'Poppins', sans-serif",
          color: '#fff',
          lineHeight: 1,
        }}>
          {value}
        </span>
        {label && (
          <span style={{
            fontSize: '0.6rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.5)',
            marginTop: '4px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Animated Progress Bar ─────────────────────────────────── */
function ComparisonBar({ companyValue, benchmarkValue, label, color, unit = '%' }) {
  const maxVal = Math.max(companyValue, benchmarkValue) * 1.3 || 1;
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{label}</span>
      </div>
      {/* Your Company */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.68rem', color: '#9CA3AF', width: '80px', flexShrink: 0 }}>Your Company</span>
        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(companyValue / maxVal) * 100}%` }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${color}, ${color}cc)`,
              borderRadius: '3px',
              boxShadow: `0 0 8px ${color}30`,
            }}
          />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: color, width: '55px', textAlign: 'right', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
          {typeof companyValue === 'number' ? (unit === '$' ? `$${companyValue.toLocaleString()}` : `${companyValue}${unit}`) : companyValue}
        </span>
      </div>
      {/* Industry Avg */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '0.68rem', color: '#6B7280', width: '80px', flexShrink: 0 }}>Industry Avg</span>
        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(benchmarkValue / maxVal) * 100}%` }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #6B7280, #6B728099)',
              borderRadius: '3px',
            }}
          />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9CA3AF', width: '55px', textAlign: 'right', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
          {typeof benchmarkValue === 'number' ? (unit === '$' ? `$${benchmarkValue.toLocaleString()}` : `${benchmarkValue}${unit}`) : benchmarkValue}
        </span>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────── */
const IndustryBenchmarkComparison = ({ data }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!data) {
    return (
      <GlassCard>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#fff', marginBottom: '8px' }}>
            Industry Benchmarking
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
            No benchmark data available
          </p>
        </div>
      </GlassCard>
    );
  }

  // Prepare radar chart data
  const radarData = [
    { metric: 'Anomaly Rate', your: Math.min(100, (1 - Math.min(1, data.metrics.anomaly_rate.ratio / 2)) * 100), industry: 100 },
    { metric: 'Vendor Match', your: Math.min(100, (1 - Math.min(1, data.metrics.duplicate_vendor_rate.ratio / 2)) * 100), industry: 100 },
    { metric: 'Error Control', your: Math.min(100, (1 - Math.min(1, data.metrics.error_amount.ratio / 2)) * 100), industry: 100 }
  ];

  // Prepare bar chart comparison
  const comparisonChartData = [
    {
      name: 'Anomaly Rate',
      company: data.metrics.anomaly_rate.company,
      benchmark: data.metrics.anomaly_rate.benchmark
    },
    {
      name: 'Duplicate Vendors',
      company: data.metrics.duplicate_vendor_rate.company,
      benchmark: data.metrics.duplicate_vendor_rate.benchmark
    },
    {
      name: 'Error Amount',
      company: data.metrics.error_amount.company / 1000,
      benchmark: data.metrics.error_amount.benchmark / 1000
    }
  ];

  const getRiskColor = (color) => {
    const colors = {
      'green': '#22c55e',
      'lightgreen': '#34d399',
      'yellow': '#f59e0b',
      'orange': '#f97316',
      'red': '#ef4444'
    };
    return colors[color] || '#8b5cf6';
  };

  const getAssessmentIcon = (assessment) => {
    if (assessment?.includes('IN LINE')) return '✅';
    if (assessment?.includes('BETTER')) return '🟢';
    if (assessment?.includes('ELEVATED')) return '⚠️';
    if (assessment?.includes('VIOLATION')) return '🔴';
    return '📊';
  };

  const riskColor = getRiskColor(data.overall_risk?.color);
  const tabs = ['overview', 'detailed', 'radar', 'recommendations'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <GlassCard highlight accentColor={riskColor}>
        {/* Accent bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${riskColor}, ${riskColor}66)`,
          borderRadius: '16px 16px 0 0',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '28px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${riskColor}25, ${riskColor}10)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
              }}>
                📊
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #fff, #94a3b8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Privacy-Preserving Industry Benchmarking
                </h3>
                <p style={{
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.5)',
                  margin: '4px 0 0 0',
                }}>
                  Compare against anonymized {data.industry} sector benchmarks
                </p>
                <p style={{
                  fontSize: '0.68rem',
                  color: 'rgba(255,255,255,0.35)',
                  margin: '2px 0 0 0',
                }}>
                  {data.company_size_context}
                </p>
              </div>
            </div>
          </div>

          {/* Circular Gauge for Risk Score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <CircularGauge
              value={data.overall_risk.score}
              size={130}
              color={riskColor}
              label="Risk Score"
            />
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: riskColor,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              {data.overall_risk.level}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: '16px',
        }}>
          {tabs.map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              whileHover={{ opacity: 0.8 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab
                  ? `linear-gradient(135deg, ${riskColor}30, ${riskColor}15)`
                  : 'transparent',
                color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.5)',
                fontWeight: activeTab === tab ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* ─── Overview Tab ─────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {/* Anomaly Rate */}
              <GlassCard highlight accentColor={getRiskColor(data.metrics.anomaly_rate.color)} style={{
                borderLeft: `3px solid ${getRiskColor(data.metrics.anomaly_rate.color)}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{getAssessmentIcon(data.metrics.anomaly_rate.assessment)}</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Anomaly Rate</h4>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    color: getRiskColor(data.metrics.anomaly_rate.color),
                    background: `${getRiskColor(data.metrics.anomaly_rate.color)}18`,
                    border: `1px solid ${getRiskColor(data.metrics.anomaly_rate.color)}30`,
                    letterSpacing: '0.5px',
                  }}>
                    {data.metrics.anomaly_rate.assessment}
                  </span>
                </div>
                <ComparisonBar
                  companyValue={data.metrics.anomaly_rate.company}
                  benchmarkValue={data.metrics.anomaly_rate.benchmark}
                  label=""
                  color={getRiskColor(data.metrics.anomaly_rate.color)}
                />
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>Percentile:</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: getRiskColor(data.metrics.anomaly_rate.color),
                  }}>
                    {data.metrics.anomaly_rate.percentile}
                  </span>
                </div>
              </GlassCard>

              {/* Duplicate Vendor Rate */}
              <GlassCard highlight accentColor={getRiskColor(data.metrics.duplicate_vendor_rate.color)} style={{
                borderLeft: `3px solid ${getRiskColor(data.metrics.duplicate_vendor_rate.color)}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{getAssessmentIcon(data.metrics.duplicate_vendor_rate.assessment)}</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Duplicate Vendor Rate</h4>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    color: getRiskColor(data.metrics.duplicate_vendor_rate.color),
                    background: `${getRiskColor(data.metrics.duplicate_vendor_rate.color)}18`,
                    border: `1px solid ${getRiskColor(data.metrics.duplicate_vendor_rate.color)}30`,
                    letterSpacing: '0.5px',
                  }}>
                    {data.metrics.duplicate_vendor_rate.assessment}
                  </span>
                </div>
                <ComparisonBar
                  companyValue={data.metrics.duplicate_vendor_rate.company}
                  benchmarkValue={data.metrics.duplicate_vendor_rate.benchmark}
                  label=""
                  color={getRiskColor(data.metrics.duplicate_vendor_rate.color)}
                />
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>Percentile:</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: getRiskColor(data.metrics.duplicate_vendor_rate.color),
                  }}>
                    {data.metrics.duplicate_vendor_rate.percentile}
                  </span>
                </div>
              </GlassCard>

              {/* Benford's Law Compliance */}
              <GlassCard highlight accentColor={getRiskColor(data.metrics.benford_violation.color)} style={{
                borderLeft: `3px solid ${getRiskColor(data.metrics.benford_violation.color)}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{getAssessmentIcon(data.metrics.benford_violation.assessment)}</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Benford's Law Compliance</h4>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    color: getRiskColor(data.metrics.benford_violation.color),
                    background: `${getRiskColor(data.metrics.benford_violation.color)}18`,
                    border: `1px solid ${getRiskColor(data.metrics.benford_violation.color)}30`,
                    letterSpacing: '0.5px',
                  }}>
                    {data.metrics.benford_violation.assessment}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                  {data.metrics.benford_violation.interpretation}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>Violation rate in {data.industry}:</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: getRiskColor(data.metrics.benford_violation.color),
                  }}>
                    {data.metrics.benford_violation.benchmark_rate}%
                  </span>
                </div>
              </GlassCard>

              {/* Circular Transactions */}
              <GlassCard highlight accentColor={getRiskColor(data.metrics.network_loops.color)} style={{
                borderLeft: `3px solid ${getRiskColor(data.metrics.network_loops.color)}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🕸️</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Circular Transactions</h4>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    color: getRiskColor(data.metrics.network_loops.color),
                    background: `${getRiskColor(data.metrics.network_loops.color)}18`,
                    border: `1px solid ${getRiskColor(data.metrics.network_loops.color)}30`,
                    letterSpacing: '0.5px',
                  }}>
                    {data.metrics.network_loops.assessment}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <GlassCard>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      Detected
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: getRiskColor(data.metrics.network_loops.color) }}>
                      {data.metrics.network_loops.company}
                    </div>
                  </GlassCard>
                  <GlassCard>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      Expected
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#9CA3AF' }}>
                      {data.metrics.network_loops.benchmark_expected}
                    </div>
                  </GlassCard>
                  <GlassCard>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      Status
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: data.metrics.network_loops.company <= data.metrics.network_loops.benchmark_expected * 1.5 ? '#22c55e' : '#f59e0b' }}>
                      {data.metrics.network_loops.company <= data.metrics.network_loops.benchmark_expected * 1.5 ? '✅ Normal' : '⚠️ Elevated'}
                    </div>
                  </GlassCard>
                </div>
              </GlassCard>

              {/* Error Amount */}
              <GlassCard highlight accentColor={getRiskColor(data.metrics.error_amount.color)} style={{
                borderLeft: `3px solid ${getRiskColor(data.metrics.error_amount.color)}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>💰</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Average Error Amount</h4>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    color: getRiskColor(data.metrics.error_amount.color),
                    background: `${getRiskColor(data.metrics.error_amount.color)}18`,
                    border: `1px solid ${getRiskColor(data.metrics.error_amount.color)}30`,
                    letterSpacing: '0.5px',
                  }}>
                    {data.metrics.error_amount.assessment}
                  </span>
                </div>
                <ComparisonBar
                  companyValue={data.metrics.error_amount.company}
                  benchmarkValue={data.metrics.error_amount.benchmark}
                  label=""
                  color={getRiskColor(data.metrics.error_amount.color)}
                  unit="$"
                />
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>Ratio:</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: getRiskColor(data.metrics.error_amount.color),
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  }}>
                    {data.metrics.error_amount.ratio}x
                  </span>
                </div>
              </GlassCard>

              {/* Overall Interpretation */}
              <GlassCard style={{
                borderLeft: `4px solid ${riskColor}`,
                background: `linear-gradient(135deg, ${riskColor}0A, ${riskColor}03)`,
              }}>
                <h4 style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: riskColor,
                  marginBottom: '12px',
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  📈 Overall Interpretation
                </h4>
                <p style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  {data.interpretation}
                </p>
              </GlassCard>
            </motion.div>
          )}

          {/* ─── Detailed Tab ─────────────────────────────── */}
          {activeTab === 'detailed' && (
            <motion.div
              key="detailed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <h4 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                📊 Metric Comparison
              </h4>
              <GlassCard>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={comparisonChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
                    <YAxis stroke="rgba(255,255,255,0.4)" />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15, 18, 35, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                    <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                    <Bar dataKey="company" fill="#8b5cf6" name="Your Company" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="benchmark" fill="#06b6d4" name="Industry Average" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          )}

          {/* ─── Radar Tab ─────────────────────────────── */}
          {activeTab === 'radar' && (
            <motion.div
              key="radar"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <h4 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                🎯 Performance Radar
              </h4>
              <GlassCard>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="metric" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: '0.78rem' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="rgba(255,255,255,0.2)" />
                    <Radar name="Your Score" dataKey="your" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
                    <Radar name="Industry Average" dataKey="industry" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} strokeWidth={2} />
                    <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15, 18, 35, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <p style={{
                  textAlign: 'center',
                  marginTop: '16px',
                  fontSize: '0.72rem',
                  color: 'rgba(255,255,255,0.4)',
                  margin: '16px 0 0 0',
                }}>
                  Higher scores indicate better performance compared to industry average
                </p>
              </GlassCard>
            </motion.div>
          )}

          {/* ─── Recommendations Tab ─────────────────────────────── */}
          {activeTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <h4 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                💡 Recommendations
              </h4>
              {data.recommendations?.map((rec, index) => {
                const recColor = rec.includes('✅') ? '#22c55e'
                  : rec.includes('🔴') ? '#ef4444'
                  : rec.includes('⚠️') ? '#f59e0b'
                  : rec.includes('📊') ? '#3b82f6'
                  : rec.includes('🕸️') ? '#8b5cf6'
                  : rec.includes('💰') ? '#f97316'
                  : '#6B7280';
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.3 }}
                  >
                    <GlassCard style={{
                      borderLeft: `3px solid ${recColor}`,
                      background: `linear-gradient(135deg, ${recColor}0A, ${recColor}03)`,
                    }}>
                      <p style={{
                        fontSize: '0.85rem',
                        color: 'rgba(255,255,255,0.75)',
                        lineHeight: 1.6,
                        margin: 0,
                      }}>
                        {rec}
                      </p>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Risk Score Legend */}
        <GlassCard style={{ marginTop: '28px' }}>
          <h4 style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            🎯 Risk Score Guide
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {[
              { range: '0-20', label: 'Low', color: '#22c55e' },
              { range: '20-40', label: 'Moderate', color: '#34d399' },
              { range: '40-60', label: 'Elevated', color: '#f59e0b' },
              { range: '60-80', label: 'High', color: '#f97316' },
              { range: '80-100', label: 'Critical', color: '#ef4444' },
            ].map(({ range, label, color }) => (
              <div
                key={range}
                style={{
                  padding: '10px 8px',
                  borderRadius: '10px',
                  background: `${color}10`,
                  border: `1px solid ${color}30`,
                  textAlign: 'center',
                  transition: 'all 200ms ease',
                }}
              >
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: color,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                }}>
                  {range}
                </div>
                <div style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: color,
                  marginTop: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </GlassCard>
    </motion.div>
  );
};

export default IndustryBenchmarkComparison;
