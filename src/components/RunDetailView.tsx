import React, { useState } from 'react';
import { 
  ArrowLeft, Download, ShieldCheck, ShieldAlert, Cpu, 
  Clock, Hash, FileJson, FileSpreadsheet, RefreshCw, Layers, FileText
} from 'lucide-react';
import { TestRun, RunTestItem } from '../types/bayora';
import { exportTestRunPDF } from '../lib/pdfReportGenerator';

interface RunDetailViewProps {
  run: TestRun;
  onBack: () => void;
  onRerun?: (runId: string) => void;
}

export const RunDetailView: React.FC<RunDetailViewProps> = ({ run, onBack, onRerun }) => {
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);

  const filteredItems = (run.items || []).filter(item => {
    if (filterOutcome !== 'ALL' && item.outcome !== filterOutcome) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.artifact_name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.evidence_hash.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyRootHash = () => {
    navigator.clipboard.writeText(run.evidence_root_hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(run, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `bayora-run-${run.id}-evidence.json`);
    dlAnchor.click();
  };

  const handleExportCSV = () => {
    const headers = ['ItemID', 'Artifact', 'Category', 'Outcome', 'Detector', 'PolicyVersion', 'LatencyMs', 'EvidenceHash', 'Reason'];
    const rows = (run.items || []).map(i => [
      i.id,
      `"${i.artifact_name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      i.outcome,
      `"${i.detector_id}"`,
      `"${i.policy_version}"`,
      i.latency_ms,
      `"${i.evidence_hash}"`,
      `"${i.reason.replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', encodeURI(csvContent));
    dlAnchor.setAttribute('download', `bayora-run-${run.id}-report.csv`);
    dlAnchor.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            title="Return to Runs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-neutral-950 font-mono tracking-tight">{run.id}</h1>
              <span className={`px-2 py-0.5 text-xs font-mono font-semibold tracking-wide uppercase border ${
                run.status === 'Completed' ? 'border-emerald-700 text-emerald-800 bg-emerald-50' :
                run.status === 'Running' ? 'border-amber-600 text-amber-800 bg-amber-50' :
                'border-neutral-400 text-neutral-700 bg-neutral-100'
              }`}>
                {run.status}
              </span>
              {run.is_verification_run && (
                <span className="px-2 py-0.5 text-xs font-mono font-semibold tracking-wide uppercase border border-blue-600 text-blue-800 bg-blue-50">
                  Remediation Verification
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1 font-mono">
              Campaign: <span className="font-semibold text-neutral-800">{run.campaign_name}</span> | Target: <span className="font-semibold text-neutral-800">{run.target_name} ({run.model_id})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onRerun && (
            <button
              onClick={() => onRerun(run.id)}
              className="px-3 py-2 border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rerun Suite</span>
            </button>
          )}
          <button
            onClick={() => exportTestRunPDF(run)}
            className="px-3 py-2 border border-sky-800 bg-sky-950/60 hover:bg-sky-900/60 text-sky-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            title="Export this test run as a cryptographically signed, tamper-evident PDF summary report"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Signed PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-2 border border-neutral-900 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Export Manifest</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Root & Execution Attestation Card */}
      <div className="p-4 bg-neutral-50 border border-neutral-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold flex items-center space-x-1.5">
              <Hash className="w-3.5 h-3.5 text-neutral-700" />
              <span>Evidence Root Merkle Hash (SHA-256)</span>
            </div>
            <div className="flex items-center space-x-2">
              <code className="text-xs font-mono bg-white px-2.5 py-1 border border-neutral-300 text-neutral-900 break-all select-all font-semibold">
                {run.evidence_root_hash}
              </code>
              <button
                onClick={handleCopyRootHash}
                className="px-2.5 py-1 text-xs border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 font-medium whitespace-nowrap transition-colors"
              >
                {copiedHash ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs font-mono text-neutral-600 border-t lg:border-t-0 pt-2 lg:pt-0 border-neutral-200">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">Session State</span>
              <span className="font-semibold text-emerald-800">
                {run.session_isolated ? 'Fresh Container Isolated' : 'Shared Session'}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">KV Cache Sanitized</span>
              <span className="font-semibold text-emerald-800">
                {run.kv_cache_flushed ? 'Flushed Clean (Cold)' : 'Active State'}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">Policy Applied</span>
              <span className="font-semibold text-neutral-900">{run.policy_version}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 border border-neutral-200 bg-white">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 block">Total Checks</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-neutral-950 mt-1 block">
            {run.total_tests}
          </span>
          <span className="text-[11px] text-neutral-500 font-mono mt-0.5 block">
            {run.executed_tests} executed ({((run.executed_tests / (run.total_tests || 1)) * 100).toFixed(0)}%)
          </span>
        </div>

        <div className="p-3 border border-neutral-200 bg-white">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 block">Passed Tests</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1 block">
            {run.passed_tests}
          </span>
          <span className="text-[11px] text-emerald-700 font-mono mt-0.5 block">
            {((run.passed_tests / (run.executed_tests || 1)) * 100).toFixed(1)}% resilience
          </span>
        </div>

        <div className="p-3 border border-neutral-200 bg-white">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 block">Failed / Vulnerabilities</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-red-700 mt-1 block">
            {run.failed_tests}
          </span>
          <span className="text-[11px] text-red-700 font-mono mt-0.5 block">
            {run.findings_count} security findings generated
          </span>
        </div>

        <div className="p-3 border border-neutral-200 bg-white">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 block">Performance</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-950">
              {run.median_latency_ms}
            </span>
            <span className="text-xs font-mono text-neutral-500">ms median</span>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono mt-0.5 block">
            p95: {run.p95_latency_ms}ms | Peak Mem: {run.peak_memory_mb} MB
          </span>
        </div>
      </div>

      {/* Tests Table and Filters */}
      <div className="border border-neutral-200 bg-white">
        <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-50/50">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-bold text-neutral-900 font-mono uppercase tracking-wide">
              Reproducible Test Evidence Ledger ({filteredItems.length})
            </h3>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Search by artifact, category, hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 text-xs border border-neutral-300 bg-white focus:outline-none focus:border-neutral-900 w-56 font-mono"
            />
            <div className="flex border border-neutral-300 bg-white">
              {(['ALL', 'PASSED', 'FAILED'] as const).map(out => (
                <button
                  key={out}
                  onClick={() => setFilterOutcome(out)}
                  className={`px-3 py-1 text-xs font-mono font-medium transition-colors ${
                    filterOutcome === out
                      ? 'bg-neutral-900 text-white font-semibold'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {out}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100/70 text-neutral-600 font-mono uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3 font-semibold">Outcome</th>
                <th className="py-2.5 px-3 font-semibold">Test Artifact</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold">Detector / Version</th>
                <th className="py-2.5 px-3 font-semibold">Latency</th>
                <th className="py-2.5 px-3 font-semibold">Evidence Hash</th>
                <th className="py-2.5 px-3 font-semibold">Details & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-mono">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500 font-sans text-sm">
                    No test items match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-3 align-top whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-bold border ${
                        item.outcome === 'PASSED'
                          ? 'border-emerald-700 text-emerald-800 bg-emerald-50'
                          : item.outcome === 'FAILED'
                          ? 'border-red-700 text-red-800 bg-red-50'
                          : 'border-neutral-400 text-neutral-700 bg-neutral-100'
                      }`}>
                        {item.outcome === 'PASSED' ? (
                          <ShieldCheck className="w-3 h-3 text-emerald-700 mr-1" />
                        ) : (
                          <ShieldAlert className="w-3 h-3 text-red-700 mr-1" />
                        )}
                        <span>{item.outcome}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 align-top">
                      <div className="font-semibold text-neutral-900 font-sans">{item.artifact_name}</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">{item.artifact_id}</div>
                    </td>

                    <td className="py-3 px-3 align-top text-neutral-700">
                      <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 text-[10px] text-neutral-800">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 align-top text-neutral-600">
                      <div>{item.detector_id}</div>
                      <div className="text-[10px] text-neutral-400">v{item.detector_version}</div>
                    </td>

                    <td className="py-3 px-3 align-top whitespace-nowrap tabular-nums text-neutral-800">
                      <div>{item.latency_ms} ms</div>
                      <div className="text-[10px] text-neutral-400">{item.memory_used_mb} MB</div>
                    </td>

                    <td className="py-3 px-3 align-top">
                      <code className="text-[11px] bg-neutral-100 px-1.5 py-0.5 border border-neutral-200 text-neutral-700 select-all block truncate max-w-[130px]" title={item.evidence_hash}>
                        {item.evidence_hash.substring(0, 14)}...
                      </code>
                    </td>

                    <td className="py-3 px-3 align-top max-w-xs font-sans text-neutral-700">
                      <div className="font-mono text-xs">{item.reason}</div>
                      {item.redacted_output && (
                        <div className="mt-1 p-1.5 bg-neutral-100 border border-neutral-200 text-[11px] font-mono text-neutral-800 break-words">
                          <span className="text-neutral-500 uppercase text-[9px] font-bold block mb-0.5">Redacted Model Response</span>
                          {item.redacted_output}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
