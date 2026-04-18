import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion } from 'framer-motion';

const IndustryBenchmarkComparison = ({ data }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!data) {
    return (
      <motion.div 
        className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-bold text-white mb-4">Industry Benchmarking</h3>
        <div className="text-gray-400">No benchmark data available</div>
      </motion.div>
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
      company: data.metrics.error_amount.company / 1000, // Scale down
      benchmark: data.metrics.error_amount.benchmark / 1000
    }
  ];

  const getRiskBadgeColor = (color) => {
    const colors = {
      'green': 'bg-green-950 border-green-700 text-green-400',
      'lightgreen': 'bg-emerald-950 border-emerald-700 text-emerald-400',
      'yellow': 'bg-yellow-900 border-yellow-700 text-yellow-400',
      'orange': 'bg-orange-900 border-orange-700 text-orange-400',
      'red': 'bg-red-950 border-red-700 text-red-400'
    };
    return colors[color] || 'bg-gray-900 border-gray-700 text-gray-400';
  };

  return (
    <motion.div 
      className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">📊 Privacy-Preserving Industry Benchmarking</h3>
          <p className="text-gray-400">Compare against anonymized {data.industry} sector benchmarks</p>
          <p className="text-xs text-gray-500 mt-1">{data.company_size_context}</p>
        </div>
        
        {/* Overall Risk Score */}
        <div className={`px-6 py-4 rounded-lg text-center border-2 ${getRiskBadgeColor(data.overall_risk.color)}`}>
          <div className="text-3xl font-bold">{data.overall_risk.score}</div>
          <div className="text-sm font-semibold mt-1">Risk Score</div>
          <div className="text-xs mt-2">{data.overall_risk.level}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        {['overview', 'detailed', 'radar', 'recommendations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize font-semibold transition-colors ${
              activeTab === tab
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Anomaly Rate */}
          <div className={`p-4 rounded-lg border-2 ${getRiskBadgeColor(data.metrics.anomaly_rate.color)}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Anomaly Rate</div>
              <div className="text-sm">{data.metrics.anomaly_rate.assessment}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Your Company</div>
                <div className="text-lg font-bold">{data.metrics.anomaly_rate.company}%</div>
              </div>
              <div>
                <div className="text-gray-400">Industry Avg</div>
                <div className="text-lg font-bold">{data.metrics.anomaly_rate.benchmark}%</div>
              </div>
              <div>
                <div className="text-gray-400">Percentile</div>
                <div className="text-lg font-bold">{data.metrics.anomaly_rate.percentile}</div>
              </div>
            </div>
          </div>

          {/* Duplicate Vendors */}
          <div className={`p-4 rounded-lg border-2 ${getRiskBadgeColor(data.metrics.duplicate_vendor_rate.color)}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Duplicate Vendor Rate</div>
              <div className="text-sm">{data.metrics.duplicate_vendor_rate.assessment}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Your Company</div>
                <div className="text-lg font-bold">{data.metrics.duplicate_vendor_rate.company}%</div>
              </div>
              <div>
                <div className="text-gray-400">Industry Avg</div>
                <div className="text-lg font-bold">{data.metrics.duplicate_vendor_rate.benchmark}%</div>
              </div>
              <div>
                <div className="text-gray-400">Percentile</div>
                <div className="text-lg font-bold">{data.metrics.duplicate_vendor_rate.percentile}</div>
              </div>
            </div>
          </div>

          {/* Benford Violation */}
          <div className={`p-4 rounded-lg border-2 ${getRiskBadgeColor(data.metrics.benford_violation.color)}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Benford's Law Compliance</div>
              <div className="text-sm font-bold">{data.metrics.benford_violation.assessment}</div>
            </div>
            <div className="text-sm text-gray-300">
              {data.metrics.benford_violation.interpretation}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Violation rate in {data.industry} industry: {data.metrics.benford_violation.benchmark_rate}%
            </div>
          </div>

          {/* Network Loops */}
          <div className={`p-4 rounded-lg border-2 ${getRiskBadgeColor(data.metrics.network_loops.color)}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Circular Transactions</div>
              <div className="text-sm">{data.metrics.network_loops.assessment}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Detected</div>
                <div className="text-lg font-bold">{data.metrics.network_loops.company}</div>
              </div>
              <div>
                <div className="text-gray-400">Expected (Industry)</div>
                <div className="text-lg font-bold">{data.metrics.network_loops.benchmark_expected}</div>
              </div>
              <div>
                <div className="text-gray-400">Status</div>
                <div className="text-lg font-bold">{data.metrics.network_loops.company <= data.metrics.network_loops.benchmark_expected * 1.5 ? '✅ Normal' : '⚠️ Elevated'}</div>
              </div>
            </div>
          </div>

          {/* Error Amount */}
          <div className={`p-4 rounded-lg border-2 ${getRiskBadgeColor(data.metrics.error_amount.color)}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Average Error Amount</div>
              <div className="text-sm">{data.metrics.error_amount.assessment}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Your Company</div>
                <div className="text-lg font-bold">${data.metrics.error_amount.company.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400">Industry Avg</div>
                <div className="text-lg font-bold">${data.metrics.error_amount.benchmark.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400">Ratio</div>
                <div className="text-lg font-bold">{data.metrics.error_amount.ratio}x</div>
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
            <div className="font-semibold text-white mb-2">📈 Overall Interpretation</div>
            <div className="text-gray-300 text-sm">{data.interpretation}</div>
          </div>
        </motion.div>
      )}

      {/* Detailed Tab - Bar Chart */}
      {activeTab === 'detailed' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={comparisonChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              />
              <Legend />
              <Bar dataKey="company" fill="#8b5cf6" name="Your Company" />
              <Bar dataKey="benchmark" fill="#06b6d4" name="Industry Average" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Radar Tab */}
      {activeTab === 'radar' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#475569" />
              <PolarAngleAxis dataKey="metric" stroke="#9ca3af" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
              <Radar name="Your Score" dataKey="your" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
              <Radar name="Industry Average" dataKey="industry" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.5} />
              <Legend />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 text-center mt-4">
            Higher scores indicate better performance compared to industry average
          </p>
        </motion.div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {data.recommendations?.map((rec, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                rec.includes('✅') ? 'bg-green-950 border-green-600'
                : rec.includes('🔴') ? 'bg-red-950 border-red-600'
                : rec.includes('⚠️') ? 'bg-yellow-900 border-yellow-600'
                : rec.includes('📊') ? 'bg-blue-950 border-blue-600'
                : rec.includes('🕸️') ? 'bg-purple-950 border-purple-600'
                : rec.includes('💰') ? 'bg-orange-900 border-orange-600'
                : 'bg-slate-700 border-slate-600'
              }`}
            >
              <div className="text-gray-300 text-sm">{rec}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Risk Legend */}
      <div className="mt-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
        <div className="font-semibold text-white mb-3">Risk Score Guide</div>
        <div className="grid grid-cols-5 gap-2 text-xs">
          <div className="bg-green-950 border border-green-700 p-2 rounded text-center">
            <div className="font-bold text-green-400">0-20</div>
            <div className="text-green-400">Low</div>
          </div>
          <div className="bg-emerald-950 border border-emerald-700 p-2 rounded text-center">
            <div className="font-bold text-emerald-400">20-40</div>
            <div className="text-emerald-400">Moderate</div>
          </div>
          <div className="bg-yellow-900 border border-yellow-700 p-2 rounded text-center">
            <div className="font-bold text-yellow-400">40-60</div>
            <div className="text-yellow-400">Elevated</div>
          </div>
          <div className="bg-orange-900 border border-orange-700 p-2 rounded text-center">
            <div className="font-bold text-orange-400">60-80</div>
            <div className="text-orange-400">High</div>
          </div>
          <div className="bg-red-950 border border-red-700 p-2 rounded text-center">
            <div className="font-bold text-red-400">80-100</div>
            <div className="text-red-400">Critical</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default IndustryBenchmarkComparison;
