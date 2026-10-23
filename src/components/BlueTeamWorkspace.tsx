import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Plus,
  CheckCircle2,
  Play,
  RefreshCw,
} from 'lucide-react';
import {
  BluePolicy,
  DetectorSpec,
  Finding,
  FindingStatus,
  Role,
  UserPrincipal,
} from '../types/bayora';
import { apiClient, ApiErrorPayload, BayoraApiError } from '../lib/apiClient';
import {
  AccessDeniedPanel,
  EvidenceHashDisplay,
  FindingStatusLabel,
  SeverityLabel,
} from './SecurityPrimitives';

interface BlueTeamWorkspaceProps {
  principal: UserPrincipal;
  onSwitchRole: (role: Role) => void;
  onSelectRun: (runId: string) => void;
  onDataMutated: () => void;
}

export const BlueTeamWorkspace: React.FC<BlueTeamWorkspaceProps> = ({
  principal,
  onSwitchRole,
  onSelectRun,
  onDataMutated,
}) => {
  const [policies, setPolicies] = useState<BluePolicy[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [detectors, setDetectors] = useState<DetectorSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [vaultError, setVaultError] = useState<ApiErrorPayload | null>(null);
  const [crossRoleProbeError, setCrossRoleProbeError] = useState<ApiErrorPayload | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | FindingStatus>('ALL');
  const [verifyingFindingId, setVerifyingFindingId] = useState<string | null>(null);
  const [manualVerifyWarning, setManualVerifyWarning] = useState<string | null>(null);

  // New Policy Version Form
  const [showNewPolicy, setShowNewPolicy] = useState(false);
  const [polVersion, setPolVersion] = useState('3.0.0');
  const [polMarker, setPolMarker] = useState('BLUE-SECRET-391');
  const [polNotes, setPolNotes] = useState(
    'Hardened canary scrubbing + strict context delimiter framing for multi-turn prompts.'
  );
  const [activateNow, setActivateNow] = useState(true);

  const loadBlueWorkspace = async () => {
    setLoading(true);
    setVaultError(null);
    try {
      const [fndRes, targRes] = await Promise.all([
        apiClient.getFindings(),
        apiClient.getTargets(),
      ]);
      setFindings(fndRes.findings);
      setDetectors(targRes.detectors);

      const polRes = await apiClient.getBluePolicies();
      setPolicies(polRes.policies);
    } catch (err) {
      if (err instanceof BayoraApiError) {
        setVaultError(err.payload);
        setPolicies([]);
      }
    } finally {
      setLoading(false);
      onDataMutated();
    }
  };

  useEffect(() => {
    setCrossRoleProbeError(null);
    setManualVerifyWarning(null);
    loadBlueWorkspace();
  }, [principal.id]);

  const handlePublishPolicyVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.createBluePolicy({
      name: 'Bayora Zero-Trust Guardrail Policy',
      description:
        'Immutable versioned defensive policy enforcing canary interception, prompt-injection refusal, and fresh session isolation.',
      policy_version: polVersion,
      change_notes: polNotes,
      synthetic_marker: polMarker,
      activate_now: activateNow,
    });
    setShowNewPolicy(false);
    await loadBlueWorkspace();
  };

  const handleActivatePolicy = async (policyId: string) => {
    await apiClient.activateBluePolicy(policyId);
    await loadBlueWorkspace();
  };

  const handleStatusChange = async (findingId: string, newStatus: string) => {
    setManualVerifyWarning(null);
    try {
      await apiClient.updateFinding(findingId, { status: newStatus });
      await loadBlueWorkspace();
    } catch (err) {
      if (err instanceof BayoraApiError) {
        setManualVerifyWarning(err.payload.message);
      }
    }
  };

  const handleRunVerification = async (findingId: string) => {
    setVerifyingFindingId(findingId);
    setManualVerifyWarning(null);
    try {
      await apiClient.verifyFindingWithRun(findingId);
      await loadBlueWorkspace();
    } finally {
      setVerifyingFindingId(null);
    }
  };

  const handleAttemptReadRedArtifact = async () => {
    try {
      await apiClient.getRedArtifactById('art-red-742');
    } catch (err) {
      if (err instanceof BayoraApiError) {
        setCrossRoleProbeError(err.payload);
        onDataMutated();
      }
    }
  };

  const filteredFindings =
    statusFilter === 'ALL' ? findings : findings.filter((f) => f.status === statusFilter);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-[#111622] border border-slate-800 rounded-lg animate-pulse" />
        <div className="h-64 bg-[#111622] border border-slate-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border border-slate-800 bg-[#111622] rounded-lg p-6 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Isolated Namespace: Blue Team Policy Vault & Remediation Center</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Defensive Guardrail Policies, Version History & Finding Verification
          </h2>
          <p className="text-sm text-slate-300">
            Manage immutable defensive policy versions (<code className="font-mono text-xs text-sky-300">BLUE-SECRET-391</code>), inspect redacted detector findings, and execute isolated verification runs to prove fixes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleAttemptReadRedArtifact}
            className="px-3.5 py-2 text-xs font-medium text-amber-300 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/40 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Attempt Cross-Role Read of Red Payload (RED-SECRET-742)</span>
          </button>

          {principal.role === 'blue_team' && (
            <button
              type="button"
              onClick={() => setShowNewPolicy(!showNewPolicy)}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish New Policy Version</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Cross-Role Denial Proof */}
      {crossRoleProbeError && (
        <AccessDeniedPanel
          title="Cross-Role Read of Red Artifact (art-red-742) Blocked by Backend"
          targetResource="GET /api/v1/red-artifacts/art-red-742 (Marker: RED-SECRET-742)"
          currentRole={principal.role}
          errorPayload={crossRoleProbeError}
        />
      )}

      {/* Blue Policy Vault Section */}
      {vaultError ? (
        <AccessDeniedPanel
          title="Blue Team Policy Source Vault Access Denied to Current Role"
          targetResource="GET /api/v1/blue-policies (Protected Classifier Weights & BLUE-SECRET-391)"
          currentRole={principal.role}
          errorPayload={vaultError}
          onSwitchRole={onSwitchRole}
          recommendedRole="blue_team"
        />
      ) : (
        <>
          {showNewPolicy && (
            <form
              onSubmit={handlePublishPolicyVersion}
              className="border border-slate-800 bg-[#111622] rounded-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-semibold text-slate-100">
                  Publish Immutable Blue Policy Version
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewPolicy(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Semantic Version Tag
                  </label>
                  <input
                    type="text"
                    required
                    value={polVersion}
                    onChange={(e) => setPolVersion(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-[#0B0F17] border border-slate-700 rounded-md text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Protected Classifier Seed Marker
                  </label>
                  <input
                    type="text"
                    required
                    value={polMarker}
                    onChange={(e) => setPolMarker(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-[#0B0F17] border border-slate-700 rounded-md text-sky-300"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activateNow}
                      onChange={(e) => setActivateNow(e.target.checked)}
                    />
                    <span>Activate immediately for all subsequent test runs</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Immutable Version Change Notes
                </label>
                <input
                  type="text"
                  required
                  value={polNotes}
                  onChange={(e) => setPolNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#0B0F17] border border-slate-700 rounded-md text-slate-100"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors"
                >
                  Commit Immutable Policy Version
                </button>
              </div>
            </form>
          )}

          {/* Blue Policy Versions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {policies.map((pol) => (
              <div
                key={pol.id}
                className="border border-slate-800 bg-[#111622] rounded-lg p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span>{pol.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>Version v{pol.policy_version}</span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-100 mt-0.5">
                        {pol.name}
                      </h3>
                    </div>

                    {pol.enabled ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Active Enforcement</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleActivatePolicy(pol.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
                      >
                        Activate Version
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{pol.description}</p>

                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                    <span>
                      Secret Marker: <code className="font-mono text-sky-300">{pol.synthetic_marker}</code>
                    </span>
                    <span aria-hidden="true">·</span>
                    <EvidenceHashDisplay hash={pol.policy_hash} label="Policy Hash" />
                  </div>

                  <div className="bg-[#0B0F17] border border-slate-800 rounded p-3 space-y-1.5">
                    <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                      <span>Protected Policy Source Body (Blue Team Only)</span>
                      <span className="font-mono text-sky-400">Immutable Record</span>
                    </div>
                    <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto">
                      {pol.policy_body}
                    </pre>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  Change Log: {pol.change_notes}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Findings & Verification Section */}
      <div className="border border-slate-800 bg-[#111622] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Security Findings & Closed-Loop Remediation Verification
            </h3>
            <p className="text-xs text-slate-400">
              A finding can only transition to <strong className="text-emerald-400">Verified</strong> by passing an isolated verification test run under the active Blue Policy
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
            {(['ALL', 'Open', 'In Progress', 'Fixed', 'Verified'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === st
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Findings' : st}
              </button>
            ))}
          </div>
        </div>

        {manualVerifyWarning && (
          <div className="px-6 py-3 bg-amber-950/30 border-b border-amber-500/30 text-xs text-amber-300">
            {manualVerifyWarning}
          </div>
        )}

        <div className="divide-y divide-slate-800">
          {filteredFindings.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No findings match the selected status filter.
            </div>
          ) : (
            filteredFindings.map((fnd) => (
              <div key={fnd.id} className="p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono text-slate-200">{fnd.id}</span>
                      <span aria-hidden="true">·</span>
                      <SeverityLabel severity={fnd.severity} />
                      <span aria-hidden="true">·</span>
                      <FindingStatusLabel status={fnd.status} />
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">
                        Detector: {fnd.detector_id}@{fnd.detector_version}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">
                        Discovered on Policy v{fnd.policy_version_at_discovery}
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-slate-100">{fnd.title}</h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {(principal.role === 'blue_team' || principal.role === 'admin') &&
                      fnd.status !== 'Verified' && (
                        <>
                          <select
                            value={fnd.status}
                            onChange={(e) => handleStatusChange(fnd.id, e.target.value)}
                            className="px-3 py-1.5 text-xs bg-[#0B0F17] border border-slate-700 rounded-md text-slate-200"
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Fixed">Fixed (Ready for Verification)</option>
                            <option value="Accepted Risk">Accepted Risk</option>
                          </select>

                          <button
                            type="button"
                            disabled={verifyingFindingId === fnd.id}
                            onClick={() => handleRunVerification(fnd.id)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            {verifyingFindingId === fnd.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Running Verification...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Run Verification Test (Prove Fix)</span>
                              </>
                            )}
                          </button>
                        </>
                      )}

                    {fnd.verified_by_run_id && (
                      <button
                        type="button"
                        onClick={() => onSelectRun(fnd.verified_by_run_id!)}
                        className="px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/30 border border-emerald-500/30 rounded-md transition-colors whitespace-nowrap"
                      >
                        Verified by Run {fnd.verified_by_run_id} →
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#0B0F17] border border-slate-800 rounded p-3.5 space-y-1.5">
                    <div className="font-semibold text-slate-200">
                      Detector Reason & Redacted Evidence Summary
                    </div>
                    <p className="text-slate-300 leading-relaxed">{fnd.detection_reason}</p>
                    <p className="text-slate-400 font-mono text-[11px]">
                      {fnd.redacted_evidence_summary}
                    </p>
                    <div className="pt-1">
                      <EvidenceHashDisplay hash={fnd.evidence_hash} label="Evidence SHA-256" />
                    </div>
                  </div>

                  <div className="bg-[#0B0F17] border border-slate-800 rounded p-3.5 space-y-1.5">
                    <div className="font-semibold text-sky-300">
                      Recommended Defensive Remediation
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {fnd.remediation_recommendation}
                    </p>
                    <div className="text-slate-400 pt-1">
                      Owner: <span className="text-slate-200">{fnd.assigned_owner}</span> · Notes:{' '}
                      <span className="text-slate-300">{fnd.remediation_notes}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Versioned Detectors Reference Table */}
      <div className="border border-slate-800 bg-[#111622] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-base font-semibold text-slate-100">
            Versioned Deterministic Detector Registry
          </h3>
          <p className="text-xs text-slate-400">
            Every test run records exact detector versions and deterministic confidence definitions
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 bg-[#0B0F17]/60">
                <th className="py-3 px-4">Detector ID & Version</th>
                <th className="py-3 px-4">Name & Scope</th>
                <th className="py-3 px-4">Deterministic Rule</th>
                <th className="py-3 px-4">Confidence Definition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {detectors.map((det) => (
                <tr key={det.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono text-sky-400 tabular-nums">
                    {det.id} (v{det.version})
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100">{det.name}</div>
                    <div className="text-slate-400">{det.description}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{det.rule_summary}</td>
                  <td className="py-3 px-4 font-mono text-emerald-400 tabular-nums">
                    {det.confidence_definition}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
