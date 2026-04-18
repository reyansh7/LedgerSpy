import React, { useState } from 'react';
import { Upload, Download, AlertTriangle, CheckCircle, AlertCircle, TrendingUp, Search, ChevronDown } from 'lucide-react';
import api from '../services/api';

const BankReconciliationAdvanced = () => {
  const [ledgerFile, setLedgerFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [filter, setFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorThreshold, setVendorThreshold] = useState(0.85);
  const [dateTolerance, setDateTolerance] = useState(1);
  const [amountTolerance, setAmountTolerance] = useState(10);
  const [error, setError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const handleFileSelect = (e) => {
    setLedgerFile(e.target.files[0]);
    setError(null);
  };

  const handleReconcile = async () => {
    if (!ledgerFile) {
      setError('Please select a ledger CSV file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('ledger_file', ledgerFile);
      formData.append('vendor_threshold', vendorThreshold);
      formData.append('date_tolerance_days', dateTolerance);
      formData.append('amount_tolerance_pct', amountTolerance);

      const response = await api.post('/reconciliation/auto-reconcile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResults(response.data);
    } catch (err) {
      setError(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!results) return;

    const csv = convertToCSV(results.results);
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.setAttribute('download', `reconciliation_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Matched': 'bg-green-50 border-green-200',
      'Partial Match': 'bg-yellow-50 border-yellow-200',
      'Missing': 'bg-red-50 border-red-200',
      'Extra in Bank': 'bg-red-50 border-red-200',
    };
    return colors[status] || 'bg-gray-50';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'Matched': 'bg-green-100 text-green-800',
      'Partial Match': 'bg-yellow-100 text-yellow-800',
      'Missing': 'bg-red-100 text-red-800',
      'Extra in Bank': 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 70) return 'text-red-600 font-bold';
    if (riskScore >= 40) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  const getFilteredResults = () => {
    if (!results?.results) return [];

    return results.results.filter(item => {
      // Status filter
      if (filter !== 'all' && item.status !== filter) {
        return false;
      }

      // Risk filter
      if (riskFilter === 'high' && (item.risk_score || 0) < 50) {
        return false;
      }
      if (riskFilter === 'low' && (item.risk_score || 0) >= 50) {
        return false;
      }

      // Search filter - search in voucher (transaction_id), reference (ledger_vendor), vendor (bank_vendor)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const voucherId = (item.transaction_id || '').toLowerCase();
        const reference = (item.ledger_vendor || '').toLowerCase();
        const vendor = (item.bank_vendor || '').toLowerCase();
        
        if (!voucherId.includes(searchLower) && !reference.includes(searchLower) && !vendor.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredResults = getFilteredResults();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">
            🏦 Bank Reconciliation Status
          </h1>
          <p className="text-gray-400 text-sm">Transaction matching against bank records</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg text-red-200 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Upload Section - Collapsible */}
        {!results && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Upload & Configure</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* File Upload */}
              <div>
                <label className="block text-gray-300 font-semibold mb-3">
                  📄 Ledger CSV File
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="ledger-upload"
                  />
                  <label htmlFor="ledger-upload" className="cursor-pointer">
                    <Upload className="mx-auto mb-3 text-gray-400" size={32} />
                    <p className="text-gray-300">
                      {ledgerFile ? ledgerFile.name : 'Click to upload CSV'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Required: transaction_id, timestamp, amount, destination_entity
                    </p>
                  </label>
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Vendor Match Threshold: <span className="text-blue-400">{(vendorThreshold * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.7"
                    max="1.0"
                    step="0.05"
                    value={vendorThreshold}
                    onChange={(e) => setVendorThreshold(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Date Tolerance: <span className="text-blue-400">±{dateTolerance} day{dateTolerance !== 1 ? 's' : ''}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={dateTolerance}
                    onChange={(e) => setDateTolerance(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-2">
                    Amount Tolerance: <span className="text-blue-400">±{amountTolerance}%</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="1"
                    value={amountTolerance}
                    onChange={(e) => setAmountTolerance(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-8">
              <button
                onClick={handleReconcile}
                disabled={loading || !ledgerFile}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : '▶️ Start Reconciliation'}
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            {/* Status Bar */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Reconciliation Status: READY</h3>
                <p className="text-gray-400 text-sm">
                  {results.summary.reconciliation_rate.toFixed(1)}% transactions successfully matched with bank records
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-400">
                  {results.summary.reconciliation_rate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">MATCH RATE</p>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-500" size={20} />
                  <input
                    type="text"
                    placeholder="Search voucher / reference / vendor"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      filter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('Missing')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      filter === 'Missing'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    Missing
                  </button>
                  <button
                    onClick={() => setFilter('Partial Match')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      filter === 'Partial Match'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    Partial
                  </button>
                  <button
                    onClick={() => setFilter('Matched')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      filter === 'Matched'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    Matched
                  </button>
                </div>
                <button
                  onClick={handleExport}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2"
                >
                  <Download size={18} />
                  Export CSV
                </button>
              </div>

              <p className="text-gray-400 text-xs mt-4">
                Showing {filteredResults.length} of {results.results.length} transactions
              </p>
            </div>

            {/* Transactions Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900 border-b-2 border-slate-600 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-300 font-semibold border-r border-slate-700">VOUCHER</th>
                      <th className="px-4 py-3 text-left text-gray-300 font-semibold border-r border-slate-700">REFERENCE</th>
                      <th className="px-4 py-3 text-left text-gray-300 font-semibold border-r border-slate-700">VENDOR</th>
                      <th className="px-4 py-3 text-right text-gray-300 font-semibold border-r border-slate-700">LEDGER AMOUNT</th>
                      <th className="px-4 py-3 text-left text-gray-300 font-semibold border-r border-slate-700">BANK TXN</th>
                      <th className="px-4 py-3 text-right text-gray-300 font-semibold border-r border-slate-700">BANK AMOUNT</th>
                      <th className="px-4 py-3 text-right text-gray-300 font-semibold border-r border-slate-700">DIFFERENCE</th>
                      <th className="px-4 py-3 text-center text-gray-300 font-semibold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.slice(0, 100).map((item, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-slate-700 hover:bg-slate-700/50 transition ${
                          item.status === 'Matched' ? 'bg-green-900/10' :
                          item.status === 'Partial Match' ? 'bg-yellow-900/10' :
                          'bg-red-900/10'
                        }`}
                      >
                        <td className="px-4 py-3 text-blue-300 font-mono border-r border-slate-700">
                          {item.transaction_id?.substring(0, 10) || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-300 border-r border-slate-700">
                          {item.ledger_vendor?.substring(0, 20) || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-300 border-r border-slate-700 truncate max-w-[150px]">
                          {item.bank_vendor?.substring(0, 20) || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-300 border-r border-slate-700 whitespace-nowrap">
                          {item.ledger_amount ? `₹${item.ledger_amount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-green-300 font-mono border-r border-slate-700 truncate">
                          {item.bank_txn_id?.substring(0, 15) || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-300 border-r border-slate-700 whitespace-nowrap">
                          {item.bank_amount ? `₹${item.bank_amount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}` : '—'}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold border-r border-slate-700 whitespace-nowrap ${
                          Math.abs(item.amount_diff_pct || 0) > 10 ? 'text-red-400' :
                          Math.abs(item.amount_diff_pct || 0) > 0 ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          ₹{item.amount_diff_pct ? (item.amount_diff_pct > 0 ? '+' : '') + item.amount_diff_pct.toFixed(2) : '0'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(item.status)}`}>
                            {item.status === 'Matched' ? '✅ MATCHED' :
                             item.status === 'Partial Match' ? '⚠️ PARTIAL' :
                             '❌ MISSING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredResults.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  No transactions match the selected filters
                </div>
              )}
              {filteredResults.length > 100 && (
                <div className="px-6 py-4 text-center text-gray-400 bg-slate-900 text-sm border-t border-slate-700">
                  Showing 100 of {filteredResults.length} transactions (scroll to view more)
                </div>
              )}
            </div>

            {/* Advanced Analytics - Collapsible */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="w-full flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700 hover:bg-slate-700/50 transition text-white font-semibold"
            >
              <span>📊 Advanced Analytics & Fraud Detection</span>
              <ChevronDown size={20} className={`transition-transform ${showAnalytics ? 'rotate-180' : ''}`} />
            </button>

            {showAnalytics && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <SummaryCard
                    title="Total"
                    value={results.summary.total_transactions}
                    icon={<TrendingUp className="text-blue-400" />}
                    color="from-blue-600 to-blue-400"
                  />
                  <SummaryCard
                    title="Matched"
                    value={results.summary.matched}
                    icon={<CheckCircle className="text-green-400" />}
                    color="from-green-600 to-green-400"
                  />
                  <SummaryCard
                    title="Partial"
                    value={results.summary.partial_match}
                    icon={<AlertCircle className="text-yellow-400" />}
                    color="from-yellow-600 to-yellow-400"
                  />
                  <SummaryCard
                    title="Missing"
                    value={results.summary.missing_or_extra}
                    icon={<AlertTriangle className="text-red-400" />}
                    color="from-red-600 to-red-400"
                  />
                  <SummaryCard
                    title="High Risk"
                    value={results.summary.high_risk_count}
                    icon={<AlertTriangle className="text-orange-400" />}
                    color="from-orange-600 to-orange-400"
                  />
                </div>

                {/* Fraud Flags Breakdown */}
                {Object.keys(results.statistics.fraud_flags_breakdown).length > 0 && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">🚨 Fraud Flags Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(results.statistics.fraud_flags_breakdown).map(([flag, count]) => (
                        <div key={flag} className="bg-slate-700 rounded-lg p-4">
                          <p className="text-gray-300 text-sm">{flag}</p>
                          <p className="text-2xl font-bold text-red-400 mt-2">{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Benford's Law Analysis */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">📊 Benford's Law Analysis</h3>
                  <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                    {Object.entries(results.benford_analysis.first_digit_distribution).map(([digit, data]) => (
                      <div key={digit} className="bg-slate-700 rounded-lg p-3 text-center">
                        <p className="text-gray-300 font-semibold">{digit}</p>
                        <p className="text-sm text-gray-400">{data.percentage}%</p>
                        <p className="text-xs text-gray-500 mt-1">Expected: {data.benford_expected.toFixed(1)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white`}>
    <div className="flex items-center justify-between mb-2">
      <p className="text-gray-100 font-semibold text-sm">{title}</p>
      {icon}
    </div>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

const convertToCSV = (data) => {
  const headers = [
    'transaction_id',
    'ledger_date',
    'ledger_amount',
    'bank_txn_id',
    'bank_date',
    'bank_amount',
    'status',
    'risk_score',
    'fraud_flags',
    'vendor_match_score',
    'amount_diff_pct',
  ];

  let csv = headers.join(',') + '\n';

  data.forEach((row) => {
    csv += [
      row.transaction_id || '',
      row.ledger_date || '',
      row.ledger_amount || '',
      row.bank_txn_id || '',
      row.bank_date || '',
      row.bank_amount || '',
      row.status || '',
      row.risk_score || 0,
      (row.fraud_flags || []).join(';'),
      row.vendor_match_score || '',
      row.amount_diff_pct || '',
    ].map(v => `"${v}"`).join(',') + '\n';
  });

  return csv;
};

export default BankReconciliationAdvanced;
