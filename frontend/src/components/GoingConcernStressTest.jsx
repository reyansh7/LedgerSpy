import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const GoingConcernStressTest = ({ data }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!data) {
    return (
      <motion.div 
        className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-bold text-white mb-4">Going Concern Analysis</h3>
        <div className="text-gray-400">No cash flow data available for analysis</div>
      </motion.div>
    );
  }

  // Get risk color
  const getRiskColor = (riskColor) => {
    const colors = {
      'green': 'text-green-400 bg-green-950',
      'yellow': 'text-yellow-400 bg-yellow-900',
      'orange': 'text-orange-400 bg-orange-900',
      'red': 'text-red-400 bg-red-950'
    };
    return colors[riskColor] || 'text-gray-400 bg-gray-900';
  };

  // Prepare scenario band data for visualization
  const scenarioBands = [
    { name: 'Critical', value: 5, color: '#ef4444' },
    { name: 'Danger', value: 20, color: '#f97316' },
    { name: 'Caution', value: 35, color: '#eab308' },
    { name: 'Safe', value: 40, color: '#22c55e' }
  ];

  // Prepare distribution data
  const distributionData = [
    { percentile: 'P5', ending: data.ending_balance_stats.p5, minimum: data.minimum_balance_stats.p5 },
    { percentile: 'P25', ending: data.ending_balance_stats.p25, minimum: data.minimum_balance_stats.p25 },
    { percentile: 'P50', ending: data.ending_balance_stats.p50_median, minimum: data.minimum_balance_stats.p50_median },
    { percentile: 'P75', ending: data.ending_balance_stats.p75, minimum: data.minimum_balance_stats.p75 },
    { percentile: 'P95', ending: data.ending_balance_stats.p95, minimum: data.minimum_balance_stats.p95 }
  ];

  return (
    <motion.div 
      className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {/* Header with Survival Probability */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">🔮 Going Concern - Monte Carlo Stress Test</h3>
          <p className="text-gray-400">12-month cash flow survival simulation ({data.num_simulations.toLocaleString()} scenarios)</p>
        </div>
        
        {/* Survival Probability Badge */}
        <div className={`px-6 py-4 rounded-lg text-center ${getRiskColor(data.risk_color)}`}>
          <div className="text-3xl font-bold">{data.survival_probability}%</div>
          <div className="text-sm font-semibold mt-1">Survival Probability</div>
          <div className="text-xs mt-2">{data.risk_level}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        {['overview', 'distribution', 'scenarios', 'metrics'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize font-semibold transition-colors ${
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Starting Balance</div>
              <div className="text-xl font-bold text-white">₹{data.starting_balance?.toLocaleString() || 'N/A'}</div>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Min Required Balance</div>
              <div className="text-xl font-bold text-yellow-400">₹{data.min_required_balance?.toLocaleString() || 'N/A'}</div>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Median Ending Balance (P50)</div>
              <div className="text-xl font-bold text-white">₹{data.ending_balance_stats.p50_median?.toLocaleString() || 'N/A'}</div>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Worst Case (P5)</div>
              <div className="text-xl font-bold text-red-400">₹{data.ending_balance_stats.p5?.toLocaleString() || 'N/A'}</div>
            </div>
          </div>

          {/* Scenario Bands */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">Scenario Probability Bands</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={scenarioBands}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scenarioBands.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Scenario Details */}
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(data.scenario_bands).map(([key, band]) => (
              <div key={key} className={`p-4 rounded-lg border-2`} style={{ borderColor: band.color, backgroundColor: band.color + '20' }}>
                <div className="font-semibold capitalize" style={{ color: band.color }}>{key.replace('_', ' ')}</div>
                <div className="text-sm text-gray-300 mt-1">Range: {band.range}</div>
                <div className="text-sm text-gray-300">Probability: {band.probability}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Distribution Tab */}
      {activeTab === 'distribution' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="percentile" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="ending" fill="#8b5cf6" name="Ending Balance" />
              <Bar dataKey="minimum" fill="#ec4899" name="Minimum Balance" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-green-950 border border-green-700 p-4 rounded-lg">
            <div className="font-semibold text-green-400">✅ Safe Scenario (Best Case)</div>
            <div className="text-sm text-gray-300 mt-2">
              Company maintains healthy cash position above minimum required balance throughout forecast period.
              Ending balance: <span className="font-semibold text-green-400">₹{data.ending_balance_stats.p95?.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-yellow-900 border border-yellow-700 p-4 rounded-lg">
            <div className="font-semibold text-yellow-400">⚠️ Median Scenario (Most Likely)</div>
            <div className="text-sm text-gray-300 mt-2">
              50% probability of achieving a better outcome, 50% of a worse outcome.
              Ending balance: <span className="font-semibold text-yellow-400">₹{data.ending_balance_stats.p50_median?.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-red-950 border border-red-700 p-4 rounded-lg">
            <div className="font-semibold text-red-400">🚨 Critical Scenario (Worst Case)</div>
            <div className="text-sm text-gray-300 mt-2">
              Represents 5th percentile - unlikely but possible severe stress scenario.
              Ending balance: <span className="font-semibold text-red-400">₹{data.ending_balance_stats.p5?.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
          {Object.entries(data.key_metrics).map(([key, value]) => (
            <div key={key} className="bg-slate-700 p-4 rounded-lg">
              <div className="text-gray-400 text-sm mb-1 capitalize">{key.replace(/_/g, ' ')}</div>
              <div className="text-lg font-bold text-white">
                {typeof value === 'number' ? 
                  (key.includes('probability') ? `${value}%` : `₹${value.toLocaleString()}`) 
                  : value || 'N/A'}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Recommendation */}
      <div className="mt-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
        <div className="font-semibold text-white mb-2">Audit Recommendation</div>
        <div className="text-gray-300 text-sm">{data.recommendation || 'Analyze cash flow patterns for going concern assessment'}</div>
      </div>
    </motion.div>
  );
};

export default GoingConcernStressTest;
