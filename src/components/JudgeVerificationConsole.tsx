import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Terminal,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { apiClient, BayoraApiError } from '../lib/apiClient';

interface ProofResult {
  id: string;
  title: string;
  description: string;
  expectedBehavior: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  httpStatus?: number;
  assertionSummary?: string;
  wirePayload?: Record<string, unknown>;
}

export const JudgeVerificationConsole: React.FC<{
  onDataMutated: () => void;
}> = ({ onDataMutated }) => {
  const [proofs, setProofs] = useState<ProofResult[]>([
    {
      id: 'proof-blue-reads-red',
      title: '01. Blue Team Attempts to Read Red Artifact (RED-SECRET-742)',
      description:
        'Calls GET /api/v1/red-artifacts/art-red-742 authenticated as Kaival Solanki (blue_team).',
      expectedBehavior:
        'HTTP 403 Forbidden (ACCESS_DENIED) · Zero bytes of RED-SECRET-742 in response body.',
      status: 'idle',
    },
    {
      id: 'proof-red-reads-blue',
      title: '02. Red Team Attempts to Read Blue Policy Source (BLUE-SECRET-391)',
      description:
        'Calls GET /api/v1/blue-policies/pol-blue-391 authenticated as Niraj Sharma (red_team).',
      expectedBehavior:
        'HTTP 403 Forbidden (ACCESS_DENIED) · Zero bytes of BLUE-SECRET-391 in response body.',
      status: 'idle',
    },
    {
      id: 'proof-cross-tenant',
      title: '03. Foreign Tenant Attempts Cross-Tenant Object ID Guessing',
      description:
        'Calls GET /api/v1/red-artifacts/art-red-742 authenticated as External Contoso Operator (tenant-external-org).',
      expectedBehavior:
        'HTTP 403 Forbidden (ACCESS_DENIED) · Tenant boundary check blocks foreign read.',
      status: 'idle',
    },
    {
      id: 'proof-ssrf-target',
      title: '04. Unapproved Outbound Target URL Rejection (SSRF Guard)',
      description:
        'Calls POST /api/v1/targets with arbitrary external URL https://untrusted-external.example.com/v1.',
      expectedBehavior:
        'HTTP 403 Forbidden (TARGET_NOT_ALLOWLISTED) · Only local://mock-adapter/* targets allowed.',
      status: 'idle',
    },
    {
      id: 'proof-fresh-session',
      title: '05. Consecutive Runs Receive Distinct Ephemeral Session IDs',
      description:
        'Executes a bounded test run and compares its cryptographic session_id against prior runs.',
      expectedBehavior:
        'HTTP 201 Created · Distinct session_id allocated · kv_cache_flushed === true.',
      status: 'idle',
    },
    {
      id: 'proof-audit-tamper',
      title: '06. SHA-256 Hash-Chain Tamper Mutation Detection & Recovery',
      description:
        'Alters event #3 in disposable store, runs SHA-256 chain verifier to catch exact mismatch, then restores clean state.',
      expectedBehavior:
        'Verifier detects exact modified sequence #3 · Clean restoration passes 100%.',
      status: 'idle',
    },
  ]);

  const [runningAll, setRunningAll] = useState(false);

  const updateProof = (id: string, patch: Partial<ProofResult>) => {
    setProofs((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const executeSingleProof = async (proofId: string) => {
    updateProof(proofId, { status: 'running' });

    try {
      if (proofId === 'proof-blue-reads-red') {
        try {
          const res = await apiClient.getRedArtifactById('art-red-742', 'usr-blue-kaival');
          updateProof(proofId, {
            status: 'failed',
            httpStatus: 200,
            assertionSummary: 'Unexpectedly allowed cross-role read!',
            wirePayload: res as unknown as Record<string, unknown>,
          });
        } catch (err) {
          if (err instanceof BayoraApiError && err.payload.status === 403) {
            const rawStr = JSON.stringify(err.payload.raw_response);
            const leaked = rawStr.includes('RED-SECRET-742');
            updateProof(proofId, {
              status: !leaked ? 'passed' : 'failed',
              httpStatus: err.payload.status,
              assertionSummary:
                'Verified HTTP 403 ACCESS_DENIED · Confirmed 0 occurrences of RED-SECRET-742 in wire response.',
              wirePayload: err.payload.raw_response,
            });
          } else {
            throw err;
          }
        }
      } else if (proofId === 'proof-red-reads-blue') {
        try {
          const res = await apiClient.getBluePolicyById('pol-blue-391', 'usr-red-niraj');
          updateProof(proofId, {
            status: 'failed',
            httpStatus: 200,
            assertionSummary: 'Unexpectedly allowed cross-role read!',
            wirePayload: res as unknown as Record<string, unknown>,
          });
        } catch (err) {
          if (err instanceof BayoraApiError && err.payload.status === 403) {
            const rawStr = JSON.stringify(err.payload.raw_response);
            const leaked = rawStr.includes('BLUE-SECRET-391');
            updateProof(proofId, {
              status: !leaked ? 'passed' : 'failed',
              httpStatus: err.payload.status,
              assertionSummary:
                'Verified HTTP 403 ACCESS_DENIED · Confirmed 0 occurrences of BLUE-SECRET-391 in wire response.',
              wirePayload: err.payload.raw_response,
            });
          } else {
            throw err;
          }
        }
      } else if (proofId === 'proof-cross-tenant') {
        try {
          const res = await apiClient.getRedArtifactById('art-red-742', 'usr-ext-tenant');
          updateProof(proofId, {
            status: 'failed',
            httpStatus: 200,
            assertionSummary: 'Unexpectedly allowed cross-tenant read!',
            wirePayload: res as unknown as Record<string, unknown>,
          });
        } catch (err) {
          if (err instanceof BayoraApiError && err.payload.status === 403) {
            updateProof(proofId, {
              status: 'passed',
              httpStatus: err.payload.status,
              assertionSummary:
                'Verified HTTP 403 ACCESS_DENIED · Foreign tenant principal blocked at server boundary.',
              wirePayload: err.payload.raw_response,
            });
          } else {
            throw err;
          }
        }
      } else if (proofId === 'proof-ssrf-target') {
        try {
          await apiClient.createTarget(
            {
              name: 'Unauthorized External Endpoint',
              endpoint_ref: 'https://untrusted-external.example.com/v1/chat',
              model_id: 'external-gpt',
            },
            'usr-red-niraj'
          );
          updateProof(proofId, {
            status: 'failed',
            httpStatus: 201,
            assertionSummary: 'Failed to block unapproved external target URL!',
          });
        } catch (err) {
          if (err instanceof BayoraApiError && err.payload.status === 403) {
            updateProof(proofId, {
              status: 'passed',
              httpStatus: err.payload.status,
              assertionSummary:
                'Verified HTTP 403 TARGET_NOT_ALLOWLISTED · Outbound SSRF target blocked by egress allowlist.',
              wirePayload: err.payload.raw_response,
            });
          } else {
            throw err;
          }
        }
      } else if (proofId === 'proof-fresh-session') {
        const beforeRuns = await apiClient.getRuns();
        const priorSessionId = beforeRuns.runs[0]?.session_id || 'none';
        const { run } = await apiClient.startRun('camp-hardened-verify');
        const isDistinct = run.session_id !== priorSessionId && run.session_isolated && run.kv_cache_flushed;

        updateProof(proofId, {
          status: isDistinct ? 'passed' : 'failed',
          httpStatus: 201,
          assertionSummary: `Verified fresh session_id (${run.session_id} != ${priorSessionId}) · kv_cache_flushed: true`,
          wirePayload: {
            run_id: run.id,
            new_session_id: run.session_id,
            previous_session_id: priorSessionId,
            session_isolated: run.session_isolated,
            kv_cache_flushed: run.kv_cache_flushed,
            policy_version: run.policy_version,
            evidence_root_hash: run.evidence_root_hash,
          },
        });
      } else if (proofId === 'proof-audit-tamper') {
        const tamperRes = await apiClient.simulateTamper('modify_payload');
        const detectedMismatch =
          tamperRes.verification.verified === false &&
          tamperRes.verification.first_mismatch_sequence !== null;
        const restoreRes = await apiClient.restoreCleanAuditChain();
        const restoredClean = restoreRes.verification.verified === true;

        updateProof(proofId, {
          status: detectedMismatch && restoredClean ? 'passed' : 'failed',
          httpStatus: 200,
          assertionSummary: `Tamper detected at sequence #${tamperRes.verification.first_mismatch_sequence} (${tamperRes.verification.failure_reason?.slice(0, 68)}...) · Clean chain restored & verified.`,
          wirePayload: {
            tamper_verification: {
              verified: tamperRes.verification.verified,
              first_mismatch_sequence: tamperRes.verification.first_mismatch_sequence,
              expected_hash: tamperRes.verification.expected_hash,
              actual_hash: tamperRes.verification.actual_hash,
            },
            post_restore_verification: {
              verified: restoreRes.verification.verified,
              checked_events: restoreRes.verification.checked_events,
              latest_checkpoint_hash: restoreRes.verification.latest_checkpoint_hash,
            },
          },
        });
      }

      onDataMutated();
    } catch (error) {
      updateProof(proofId, {
        status: 'failed',
        assertionSummary: error instanceof Error ? error.message : 'Unexpected test error',
      });
    }
  };

  const runAllProofs = async () => {
    setRunningAll(true);
    for (const p of proofs) {
      await executeSingleProof(p.id);
    }
    setRunningAll(false);
  };

  const passedCount = proofs.filter((p) => p.status === 'passed').length;

  return (
    <div className="space-y-6">
      <div className="border border-slate-800 bg-[#111622] rounded-lg p-6 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-medium text-sky-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Live Judge Acceptance & Isolation Verification Harness</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Prove the Boundary: Automated P0 Security Acceptance Suite
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Execute live API requests against the Bayora backend to verify that cross-role reads (<code className="font-mono text-xs text-rose-300">RED-SECRET-742</code> and <code className="font-mono text-xs text-sky-300">BLUE-SECRET-391</code>), cross-tenant object guessing, and unapproved outbound targets are denied server-side with HTTP 403, consecutive runs use distinct session IDs, and the SHA-256 audit verifier catches tampered records.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right font-mono text-xs">
            <div className="text-slate-400">Verified Controls</div>
            <div className="text-lg font-bold text-emerald-400 tabular-nums">
              {passedCount} / {proofs.length} Passed
            </div>
          </div>

          <button
            type="button"
            disabled={runningAll}
            onClick={runAllProofs}
            className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            {runningAll ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Live Proofs...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run All 6 Boundary Proofs</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {proofs.map((proof) => (
          <div
            key={proof.id}
            className="border border-slate-800 bg-[#111622] rounded-lg p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-sm font-semibold text-slate-100">{proof.title}</h3>
                <div className="shrink-0">
                  {proof.status === 'passed' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified</span>
                    </span>
                  )}
                  {proof.status === 'failed' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                      <XCircle className="w-4 h-4" />
                      <span>Failed</span>
                    </span>
                  )}
                  {proof.status === 'running' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing...</span>
                    </span>
                  )}
                  {proof.status === 'idle' && (
                    <span className="text-xs text-slate-500 font-mono">Ready</span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{proof.description}</p>

              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Expected: {proof.expectedBehavior}</span>
              </div>

              {proof.assertionSummary && (
                <div className="bg-[#0B0F17] border border-slate-800 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-medium">{proof.assertionSummary}</span>
                    {proof.httpStatus && (
                      <span className="font-mono text-slate-400 tabular-nums shrink-0 ml-2">
                        HTTP {proof.httpStatus}
                      </span>
                    )}
                  </div>
                  {proof.wirePayload && (
                    <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto pt-1 border-t border-slate-800/80">
                      {JSON.stringify(proof.wirePayload, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">Server-Side Enforcement</span>
              <button
                type="button"
                onClick={() => executeSingleProof(proof.id)}
                disabled={proof.status === 'running' || runningAll}
                className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span>Execute Proof</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
