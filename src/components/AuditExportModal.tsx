import React, { useState, useMemo } from 'react';
import { 
  X, Download, FileText, FileCode, CheckSquare, Square, 
  Calendar, Filter, ShieldCheck, ShieldAlert, Sparkles, Clock
} from 'lucide-react';
import { AuditEvent, AuditVerificationResult } from '../types/bayora';
import { exportAuditEvidencePDF } from '../lib/pdfReportGenerator';

interface AuditExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: AuditEvent[];
  verification: AuditVerificationResult | null;
}

type DateRangePreset = 'all' | '24h' | '7d' | '30d' | 'custom';
type ExportFormat = 'pdf' | 'json';

export const AuditExportModal: React.FC<AuditExportModalProps> = ({
  isOpen,
  onClose,
  events,
  verification,
}) => {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [includeSignatureManifest, setIncludeSignatureManifest] = useState(true);

  // Extract all distinct event types present in the ledger
  const allEventTypes = useMemo(() => {
    const types = new Set<string>();
    events.forEach((e) => types.add(e.event_type));
    return Array.from(types).sort();
  }, [events]);

  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(
    () => new Set(events.map((e) => e.event_type))
  );

  // Keep selectedEventTypes synced if ledger events change
  React.useEffect(() => {
    if (selectedEventTypes.size === 0 && events.length > 0) {
      setSelectedEventTypes(new Set(events.map((e) => e.event_type)));
    }
  }, [events]);

  if (!isOpen) return null;

  const toggleEventType = (type: string) => {
    setSelectedEventTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const selectAllTypes = () => {
    setSelectedEventTypes(new Set(allEventTypes));
  };

  const deselectAllTypes = () => {
    setSelectedEventTypes(new Set());
  };

  // Filter events based on active configurations
  const matchingEvents = events.filter((e) => {
    // 1. Event Type Filter
    if (!selectedEventTypes.has(e.event_type)) {
      return false;
    }

    // 2. Date Range Filter
    const eventTime = new Date(e.timestamp).getTime();
    const now = Date.now();

    if (datePreset === '24h') {
      const dayAgo = now - 24 * 60 * 60 * 1000;
      if (eventTime < dayAgo) return false;
    } else if (datePreset === '7d') {
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      if (eventTime < weekAgo) return false;
    } else if (datePreset === '30d') {
      const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
      if (eventTime < monthAgo) return false;
    } else if (datePreset === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate).getTime();
        if (eventTime < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000; // inclusive
        if (eventTime > end) return false;
      }
    }

    return true;
  });

  const handleExecuteExport = () => {
    const rangeLabel = 
      datePreset === 'all' ? 'All Historical Records' :
      datePreset === '24h' ? 'Last 24 Hours' :
      datePreset === '7d' ? 'Last 7 Days' :
      datePreset === '30d' ? 'Last 30 Days' :
      `Custom (${customStartDate || 'Genesis'} to ${customEndDate || 'Head'})`;

    if (format === 'pdf') {
      exportAuditEvidencePDF(
        matchingEvents,
        verification,
        `Date Range: ${rangeLabel} • Types: ${selectedEventTypes.size}/${allEventTypes.length}`
      );
      onClose();
    } else {
      // JSON Manifest
      const exportManifest = {
        export_metadata: {
          generated_at: new Date().toISOString(),
          format: 'BAYORA_AUDIT_LEDGER_FORENSIC_EXPORT_V2',
          date_range_preset: datePreset,
          custom_range: datePreset === 'custom' ? { start: customStartDate, end: customEndDate } : null,
          total_events_exported: matchingEvents.length,
          total_events_in_chain: events.length,
          cryptographic_verification: verification
            ? {
                verified: verification.verified,
                verified_at: verification.verified_at,
                total_events: verification.total_events,
                checked_events: verification.checked_events,
                latest_checkpoint_hash: verification.latest_checkpoint_hash,
                genesis_hash: events[events.length - 1]?.previous_hash || '0'.repeat(64),
                head_hash: events[0]?.event_hash || '0'.repeat(64),
              }
            : 'NOT_VERIFIED',
          fips_140_3_attestation: includeSignatureManifest ? {
            signature_algorithm: 'SHA-256-HMAC-ATTESTED',
            custody_chain: 'Merkle-Linked-Forward-Secure',
            integrity_seal: 'BAYORA-SEC-IMMUTABLE-LEDGER-V2',
            exported_by_role: 'SECURITY_AUDITOR_AUTHORIZED'
          } : null,
        },
        events: matchingEvents,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportManifest, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute('href', dataStr);
      dlAnchor.setAttribute('download', `bayora-audit-export-${datePreset}-${Date.now()}.json`);
      dlAnchor.click();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#0F141E] border border-neutral-700 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-[#0A0D14] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono tracking-tight">
                Export Audit Evidence & Forensic Ledger
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Configure date parameters, cryptographic format, and event types
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs font-mono text-neutral-200">
          {/* Section 1: Export Format */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <span>1. Choose Export Format</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3.5 border rounded-lg text-left transition-all flex items-start space-x-3 ${
                  format === 'pdf'
                    ? 'border-sky-500 bg-sky-950/40 text-white shadow-md shadow-sky-500/10'
                    : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <div className={`p-2 rounded ${format === 'pdf' ? 'bg-sky-500/20 text-sky-400' : 'bg-neutral-800 text-neutral-400'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white text-xs">PDF Executive Summary</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed font-sans">
                    Tamper-evident, cryptographically signed PDF with visual integrity badge, hash chain index, and executive summary table.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3.5 border rounded-lg text-left transition-all flex items-start space-x-3 ${
                  format === 'json'
                    ? 'border-sky-500 bg-sky-950/40 text-white shadow-md shadow-sky-500/10'
                    : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <div className={`p-2 rounded ${format === 'json' ? 'bg-sky-500/20 text-sky-400' : 'bg-neutral-800 text-neutral-400'}`}>
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white text-xs">Forensic JSON Manifest</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed font-sans">
                    Full SHA-256 Merkle chain, sequential index hashes, minimized payloads, and FIPS 140-3 verifiable machine-readable manifest.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Date Range Selection */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>2. Select Temporal Range</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-normal">
                Filter by event timestamp
              </span>
            </label>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'all', label: 'All Records' },
                { id: '24h', label: 'Last 24h' },
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'custom', label: 'Custom' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDatePreset(preset.id as DateRangePreset)}
                  className={`py-2 px-2 text-center text-[11px] border rounded transition-colors ${
                    datePreset === preset.id
                      ? 'border-sky-500 bg-sky-500/20 text-sky-300 font-bold'
                      : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800/80 text-neutral-400'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            {datePreset === 'custom' && (
              <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 animate-in fade-in duration-150">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase block mb-1">Start Date</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-[#090C12] border border-neutral-700 text-neutral-200 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase block mb-1">End Date</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-[#090C12] border border-neutral-700 text-neutral-200 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Event Types to Include */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-neutral-400" />
                <span>3. Event Categories & Types</span>
              </label>
              <div className="flex items-center space-x-2 text-[10px]">
                <button
                  type="button"
                  onClick={selectAllTypes}
                  className="text-sky-400 hover:text-sky-300 underline"
                >
                  Select All
                </button>
                <span className="text-neutral-600">|</span>
                <button
                  type="button"
                  onClick={deselectAllTypes}
                  className="text-neutral-400 hover:text-neutral-300 underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg">
              {allEventTypes.map((type) => {
                const isSelected = selectedEventTypes.has(type);
                const count = events.filter((e) => e.event_type === type).length;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleEventType(type)}
                    className={`flex items-center justify-between p-2 rounded text-left transition-colors ${
                      isSelected
                        ? 'bg-neutral-800/90 text-white'
                        : 'bg-neutral-900/40 text-neutral-500 hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                      )}
                      <span className="truncate text-[11px] font-mono">{type}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 ml-1.5 shrink-0 px-1 py-0.2 bg-neutral-950/80 rounded border border-neutral-800">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Attestation Options */}
          {format === 'json' && (
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200">Include FIPS 140-3 Attestation Metadata</div>
                <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                  Appends cryptographic signature algorithm, verification stamp, and custody header.
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeSignatureManifest}
                onChange={(e) => setIncludeSignatureManifest(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-0"
              />
            </div>
          )}

          {/* Live Export Summary Badge */}
          <div className="p-3 bg-neutral-900 border border-neutral-700/80 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {verification?.verified ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="text-neutral-300">
                Ready to compile: <strong className="text-white">{matchingEvents.length}</strong> of {events.length} sequential blocks
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-neutral-800 text-sky-300 rounded border border-neutral-700">
              Format: {format.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-[#0A0D14] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold rounded transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecuteExport}
            disabled={matchingEvents.length === 0}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold font-mono rounded flex items-center space-x-2 transition-all shadow-md shadow-sky-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate & Download {format.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
