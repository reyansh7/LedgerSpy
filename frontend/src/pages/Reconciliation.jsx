import React, { useState } from 'react';
import { Upload, Download, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import BankReconciliation from '../../components/BankReconciliation';

const ReconciliationPage = () => {
  const [ledgerFile, setLedgerFile] = useState(null);
  const [bankFile, setBankFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [filter, setFilter] = useState('all');
  const [vendorThreshold, setVendorThreshold] = useState(0.85);
  const [dateTolerance, setDateTolerance] = useState(1);
  const [amountTolerance, setAmountTolerance] = useState(10);

  const handleLedgerFileSelect = (e) => {
    setLedgerFile(e.target.files[0]);
  };

  const handleBankFileSelect = (e) => {
    setBankFile(e.target.files[0]);
  };

  const handleReconcile = async () => {
    if (!ledgerFile) {
      alert('Please select a ledger CSV file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('ledger_file', ledgerFile);
      
      if (bankFile) {
        formData.append('bank_file', bankFile);
      }
      
      formData.append('vendor_threshold', vendorThreshold);
      formData.append('date_tolerance_days', dateTolerance);
      formData.append('amount_tolerance_pct', amountTolerance);

      const endpoint = bankFile 
        ? '/reconciliation/reconcile-with-bank'
        : '/reconciliation/reconcile';

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResults(response.data);
    } catch (error) {
      console.error('Reconciliation error:', error);
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!results) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('ledger_file', ledgerFile);
      if (bankFile) formData.append('bank_file', bankFile);
      formData.append('vendor_threshold', vendorThreshold);
      formData.append('date_tolerance_days', dateTolerance);
      formData.append('amount_tolerance_pct', amountTolerance);

      const response = await api.post('/reconciliation/export-results', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reconciliation_results.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert(`Export error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    if (!results?.transactions) return [];
    
    return results.transactions.filter(t => {
      if (filter === 'all') return true;
      if (filter === 'matched') return t.status === 'Matched';
      if (filter === 'partial') return t.status === 'Partial Match';
      if (filter === 'missing') return t.status === 'Missing' || t.status === 'Extra in Bank';
      return true;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Bank Reconciliation Engine</h1>
          <p className="text-slate-300">Automatically match ledger transactions with bank statements</p>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Ledger Upload */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              1. Upload Ledger
            </h2>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-slate-500 transition">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleLedgerFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-slate-300 hover:text-white transition block">
                    {ledgerFile ? ledgerFile.name : 'Click to select ledger CSV'}
                  </span>
                </div>
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Required columns: transaction_id, timestamp, amount, source_entity, destination_entity
              </p>
            </div>
            {ledgerFile && (
              <p className="text-xs text-green-400 mt-2">✓ File selected</p>
            )}
          </div>

          {/* Bank Statement Upload */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              2. Upload Bank Statement (Optional)
            </h2>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-slate-500 transition">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBankFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-slate-300 hover:text-white transition block">
                    {bankFile ? bankFile.name : 'Click to select bank CSV'}
                  </span>
                </div>
              </label>
              <p className="text-xs text-slate-500 mt-2">
                If not provided, a realistic bank statement will be auto-generated
              </p>
            </div>
            {!bankFile && (
              <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Auto-generation enabled
              </p>
            )}
            {bankFile && (
              <p className="text-xs text-green-400 mt-2">✓ File selected</p>
            )}
          </div>
        </div>

        {/* Parameters Section */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Reconciliation Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm text-slate-300">Vendor Match Threshold</label>
                <span className="text-sm font-semibold text-blue-400">{vendorThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={vendorThreshold}
                onChange={(e) => setVendorThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-2">0.5 = permissive, 1.0 = exact match only</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm text-slate-300">Date Tolerance (Days)</label>
                <span className="text-sm font-semibold text-blue-400">±{dateTolerance}</span>
              </div>
              <input
                type="range"
                min="0"
                max="7"
                step="1"
                value={dateTolerance}
                onChange={(e) => setDateTolerance(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-2">Allow dates within N days difference</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm text-slate-300">Amount Tolerance (%)</label>
                <span className="text-sm font-semibold text-blue-400">±{amountTolerance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={amountTolerance}
                onChange={(e) => setAmountTolerance(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-2">Allow amount differences up to N%</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleReconcile}
            disabled={loading || !ledgerFile}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Running Reconciliation...' : 'Run Reconciliation'}
          </button>

          <button
            onClick={handleExport}
            disabled={!results || loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export Results as CSV
          </button>
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            {/* Display the reconciliation component */}
            <BankReconciliation 
              anomalies={results.transactions.filter(t => t.status !== 'Matched')}
              totalRecords={results.summary.total_transactions}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-xs font-semibold mb-1">TOTAL</p>
                <p className="text-2xl font-bold text-white">
                  {results.summary.total_transactions}
                </p>
              </div>

              <div className="bg-green-900/20 rounded-lg p-4 border border-green-700">
                <p className="text-green-300 text-xs font-semibold mb-1">MATCHED</p>
                <p className="text-2xl font-bold text-green-400">
                  {results.summary.matched.count}
                </p>
                <p className="text-xs text-green-300">
                  {results.summary.matched.percentage.toFixed(1)}%
                </p>
              </div>

              <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-700">
                <p className="text-yellow-300 text-xs font-semibold mb-1">PARTIAL</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {results.summary.partial.count}
                </p>
                <p className="text-xs text-yellow-300">
                  {results.summary.partial.percentage.toFixed(1)}%
                </p>
              </div>

              <div className="bg-red-900/20 rounded-lg p-4 border border-red-700">
                <p className="text-red-300 text-xs font-semibold mb-1">MISSING</p>
                <p className="text-2xl font-bold text-red-400">
                  {results.summary.missing.count}
                </p>
                <p className="text-xs text-red-300">
                  {results.summary.missing.percentage.toFixed(1)}%
                </p>
              </div>

              <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-700">
                <p className="text-purple-300 text-xs font-semibold mb-1">RATE</p>
                <p className="text-2xl font-bold text-purple-400">
                  {results.summary.reconciliation_rate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                All ({results.summary.total_transactions})
              </button>
              <button
                onClick={() => setFilter('matched')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'matched'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Matched ({results.summary.matched.count})
              </button>
              <button
                onClick={() => setFilter('partial')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'partial'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Partial ({results.summary.partial.count})
              </button>
              <button
                onClick={() => setFilter('missing')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === 'missing'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Mismatches ({results.summary.missing.count + results.summary.extra_in_bank.count})
              </button>
            </div>

            {/* Transactions Table */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700 text-slate-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Ledger ID</th>
                      <th className="px-4 py-3 text-right">Ledger Amount</th>
                      <th className="px-4 py-3 text-right">Bank Amount</th>
                      <th className="px-4 py-3 text-right">Diff %</th>
                      <th className="px-4 py-3 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredTransactions.slice(0, 100).map((txn, idx) => (
                      <tr key={idx} className="hover:bg-slate-700 transition">
                        <td className="px-4 py-3">
                          <span
                            className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: txn.color + '20',
                              color: txn.color,
                              border: `1px solid ${txn.color}40`,
                            }}
                          >
                            {txn.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                          {txn.transaction_id || txn.bank_txn_id || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          ${txn.ledger_amount?.toFixed(2) || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          ${txn.bank_amount?.toFixed(2) || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {txn.amount_diff_pct !== null
                            ? `${txn.amount_diff_pct.toFixed(2)}%`
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">
                          {txn.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-700 px-4 py-3 text-slate-400 text-sm flex justify-between items-center">
                <span>Showing {Math.min(filteredTransactions.length, 100)} of {filteredTransactions.length} transactions</span>
                {filteredTransactions.length > 100 && (
                  <span className="text-yellow-400">Displaying first 100 - export CSV for complete results</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!results && !loading && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
            <RefreshCw className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Ready to Reconcile</h3>
            <p className="text-slate-400">Upload a ledger CSV and optionally a bank statement to begin reconciliation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReconciliationPage;
