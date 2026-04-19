import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const GlassCard = ({ children, style, highlight = false }) => (
  <div
    style={{
      background: highlight 
        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.08))'
        : 'linear-gradient(135deg, rgba(18, 22, 38, 0.7), rgba(27, 27, 47, 0.4))',
      border: highlight
        ? '1px solid rgba(139, 92, 246, 0.3)'
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
        ? 'rgba(139, 92, 246, 0.5)' 
        : 'rgba(255,255,255,0.12)';
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = highlight
        ? 'rgba(139, 92, 246, 0.3)'
        : 'rgba(255,255,255,0.06)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    {children}
  </div>
);

function CircularGauge({ value, size = 140, strokeWidth = 8, color }) {
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
          {value.toFixed(1)}%
        </span>
        <span style={{
          fontSize: '0.65rem',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.6)',
          marginTop: '4px',
          letterSpacing: '0.5px',
        }}>
          SURVIVAL
        </span>
      </div>
    </div>
  );
}

const GoingConcernStressTest = ({ data }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!data) {
    return (
      <GlassCard>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#fff', marginBottom: '8px' }}>
            Going Concern Analysis
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
            No cash flow data available for analysis
          </p>
        </div>
      </GlassCard>
    );
  }

  const getSurvivalColor = (probability) => {
    if (probability >= 95) return '#22c55e'; // green
    if (probability >= 80) return '#f59e0b'; // amber
    if (probability >= 60) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getSurvivalCategory = (probability) => {
    if (probability >= 75) return 'Low';
    if (probability >= 50) return 'Medium';
    if (probability >= 25) return 'High';
    return 'Critical';
  };

  // Convert scenario bands to pie chart format
  const scenarioBands = Object.entries(data.scenario_bands || {}).map(([key, band]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: parseFloat(band.probability),
    color: band.color === 'green' ? '#22c55e' : band.color === 'yellow' ? '#f59e0b' : band.color === 'orange' ? '#f97316' : '#ef4444'
  }));

  // Prepare distribution data
  const distributionData = [
    { percentile: 'P5', ending: data.ending_balance_stats.p5, minimum: data.minimum_balance_stats.p5 },
    { percentile: 'P25', ending: data.ending_balance_stats.p25, minimum: data.minimum_balance_stats.p25 },
    { percentile: 'P50', ending: data.ending_balance_stats.p50_median, minimum: data.minimum_balance_stats.p50_median },
    { percentile: 'P75', ending: data.ending_balance_stats.p75, minimum: data.minimum_balance_stats.p75 },
    { percentile: 'P95', ending: data.ending_balance_stats.p95, minimum: data.minimum_balance_stats.p95 }
  ];

  const survivalColor = getSurvivalColor(data.survival_probability);
  const survivalCategory = getSurvivalCategory(data.survival_probability);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <GlassCard highlight>
        {/* Accent bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${survivalColor}, ${survivalColor}66)`,
          borderRadius: '16px 16px 0 0',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '32px' }}>
          {/* Left: Title and Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.1))',
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
                  Going Concern - Monte Carlo Stress Test
                </h3>
                <p style={{
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.6)',
                  margin: '4px 0 0 0',
                }}>
                  12-month cash flow survival simulation ({data.num_simulations?.toLocaleString()} scenarios)
                </p>
              </div>
            </div>
          </div>

          {/* Right: Circular Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CircularGauge
              value={data.survival_probability}
              size={140}
              color={survivalColor}
            />
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: survivalColor,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              {survivalCategory}
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '28px',
        }}>
          <GlassCard>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Starting Balance
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              ₹{data.starting_balance?.toLocaleString() || 'N/A'}
            </div>
          </GlassCard>

          <GlassCard>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Min Required Balance
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>
              ₹{data.min_required_balance?.toLocaleString() || 'N/A'}
            </div>
          </GlassCard>

          <GlassCard>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Median Ending Balance (P50)
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              ₹{data.ending_balance_stats?.p50_median?.toLocaleString() || 'N/A'}
            </div>
          </GlassCard>

          <GlassCard>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Worst Case (P5)
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>
              ₹{data.ending_balance_stats?.p5?.toLocaleString() || 'N/A'}
            </div>
          </GlassCard>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: '16px',
        }}>
          {['overview', 'distribution', 'scenarios', 'metrics'].map((tab) => (
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
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.15))'
                  : 'transparent',
                color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.5)',
                fontWeight: activeTab === tab ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {/* Scenario Probability Bands */}
            <h4 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              📈 Scenario Probability Bands
            </h4>

            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={scenarioBands}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={90}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {scenarioBands.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 18, 35, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  formatter={(value) => [`${value}%`, 'Probability']}
                  labelFormatter={(name) => name}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Scenario Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginTop: '24px',
            }}>
              {Object.entries(data.scenario_bands || {}).map(([key, band]) => {
                const colorMap = {
                  'green': '#22c55e',
                  'yellow': '#f59e0b',
                  'orange': '#f97316',
                  'red': '#ef4444',
                };
                const color = colorMap[band.color] || band.color;
                return (
                  <GlassCard key={key} style={{
                    borderLeft: `3px solid ${color}`,
                  }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: color,
                      textTransform: 'capitalize',
                      marginBottom: '8px',
                    }}>
                      {key}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.6)',
                      marginBottom: '6px',
                    }}>
                      Range: {band.range}
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: color,
                    }}>
                      {band.probability}
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            {/* Monthly Projection */}
            {data.chart_data && data.chart_data.length > 0 && (
              <div style={{ marginTop: '28px' }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  📊 Monthly Cash Balance Projection
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.chart_data}>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
                    <YAxis stroke="rgba(255,255,255,0.4)" formatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15, 18, 35, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                      formatter={(value) => `₹${value.toLocaleString()}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="p5"
                      fill="url(#colorGradient)"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="P5 (Worst Case)"
                    />
                    <Area
                      type="monotone"
                      dataKey="p95"
                      fill="url(#colorGradient)"
                      stroke="#22c55e"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="P95 (Best Case)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        )}

        {/* Distribution Tab */}
        {activeTab === 'distribution' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '16px',
            }}>
              📊 Percentile Distribution
            </h4>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="percentile" stroke="rgba(255,255,255,0.4)" />
                <YAxis stroke="rgba(255,255,255,0.4)" formatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 18, 35, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                  formatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                <Bar dataKey="ending" fill="#8b5cf6" name="Ending Balance" radius={[8, 8, 0, 0]} />
                <Bar dataKey="minimum" fill="#06b6d4" name="Minimum Balance" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Scenarios Tab */}
        {activeTab === 'scenarios' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <GlassCard style={{
                borderLeft: '4px solid #22c55e',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.02))',
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#22c55e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✅ Safe Scenario (P95 - Best Case)
                </div>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', margin: '0 0 8px 0' }}>
                  Company maintains healthy cash position above minimum required balance throughout forecast.
                </p>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#22c55e' }}>
                  Ending Balance: ₹{data.ending_balance_stats?.p95?.toLocaleString()}
                </div>
              </GlassCard>

              <GlassCard style={{
                borderLeft: '4px solid #f59e0b',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02))',
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚠️ Median Scenario (P50 - Most Likely)
                </div>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', margin: '0 0 8px 0' }}>
                  50% probability of achieving a better outcome, 50% of a worse outcome. Mid-range scenario.
                </p>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f59e0b' }}>
                  Ending Balance: ₹{data.ending_balance_stats?.p50_median?.toLocaleString()}
                </div>
              </GlassCard>

              <GlassCard style={{
                borderLeft: '4px solid #ef4444',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))',
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🚨 Critical Scenario (P5 - Worst Case)
                </div>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', margin: '0 0 8px 0' }}>
                  Represents 5th percentile - unlikely but possible severe stress scenario. Requires attention.
                </p>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ef4444' }}>
                  Ending Balance: ₹{data.ending_balance_stats?.p5?.toLocaleString()}
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}>
              {Object.entries(data.key_metrics || {}).map(([key, value]) => (
                <GlassCard key={key}>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px',
                  }}>
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                    {typeof value === 'number'
                      ? key.includes('probability')
                        ? `${value}%`
                        : `₹${value.toLocaleString()}`
                      : value || 'N/A'}
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommendation */}
        <GlassCard style={{
          marginTop: '28px',
          borderLeft: `4px solid ${survivalColor}`,
          background: `linear-gradient(135deg, rgba(${
            survivalColor === '#22c55e' ? '34, 197, 94' :
            survivalColor === '#f59e0b' ? '245, 158, 11' :
            survivalColor === '#f97316' ? '249, 115, 22' :
            '239, 68, 68'
          }, 0.08), rgba(${
            survivalColor === '#22c55e' ? '34, 197, 94' :
            survivalColor === '#f59e0b' ? '245, 158, 11' :
            survivalColor === '#f97316' ? '249, 115, 22' :
            '239, 68, 68'
          }, 0.02))`,
        }}>
          <h4 style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: survivalColor,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            💼 Audit Recommendation
          </h4>
          <p style={{
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: '1.5',
            margin: 0,
          }}>
            {data.recommendation || 'Analyze cash flow patterns for going concern assessment'}
          </p>
        </GlassCard>
      </GlassCard>
    </motion.div>
  );
};

export default GoingConcernStressTest;
