import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  ArrowRight,
  Lock,
  Cpu,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react';
import {
  AuditEvent,
  DashboardMetrics,
  Finding,
  TestRun,
  UserPrincipal,
} from '../types/bayora';
import {
  EvidenceHashDisplay,
  FindingStatusLabel,
  ResidualRiskPanel,
  RunStatusLabel,
  SeverityLabel,
} from './SecurityPrimitives';
import { D3WorkflowCharts } from './D3WorkflowCharts';

interface OverviewDashboardProps {
  principal: UserPrincipal;
  metrics: DashboardMetrics;
  recentRuns: TestRun[];
  recentFindings: Finding[];
  recentAuditEvents: AuditEvent[];
  onNavigateTab: (tab: string) => void;
  onSelectRun: (runId: string) => void;
  onRefreshData?: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  principal,
  metrics,
  recentRuns,
  recentFindings,
  recentAuditEvents,
  onNavigateTab,
  onSelectRun,
  onRefreshData,
}) => {
  const totalOpenFindings =
    metrics.open_findings_by_severity.critical +
    metrics.open_findings_by_severity.high +
    metrics.open_findings_by_severity.medium +
    metrics.open_findings_by_severity.low;

  return (
    <div className="space-y-8">
      {/* Top 4-Column Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="border border-slate-800 bg-[#111622] rounded-lg p-5 space-y-2">
          <div className="text-xs font-medium text-slate-400">
            Bounded Test Runs & Fresh Sessions
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
              {metrics.total_runs} Runs
            </span>
            <span className="font-mono text-xs text-emerald-400 tabular-nums">
              {metrics.fresh_session_coverage_pct}% Fresh Sessions
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono tabular-nums pt-1">
            {metrics.completed_runs} Completed · {metrics.cancelled_runs} Cancelled · Median{' '}
            {metrics.median_run_latency_ms} ms (p95 {metrics.p95_run_latency_ms} ms)
          </div>
        </div>

        <div className="border border-slate-800 bg-[#111622] rounded-lg p-5 space-y-2">
          <div className="text-xs font-medium text-slate-400">
            Server-Side Policy Denials Enforced
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-amber-400 tabular-nums">
              {metrics.cross_role_denials + metrics.cross_tenant_denials} Blocked
            </span>
            <span className="font-mono text-xs text-slate-300 tabular-nums">
              HTTP 403 Enforced
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono tabular-nums pt-1">
            {metrics.cross_role_denials} Cross-Role Denials · {metrics.cross_tenant_denials}{' '}
            Cross-Tenant Denials
          </div>
        </div>

        <div className="border border-slate-800 bg-[#111622] rounded-lg p-5 space-y-2">
          <div className="text-xs font-medium text-slate-400">
            Open Security Findings by Severity
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-rose-400 tabular-nums">
              {totalOpenFindings} Open
            </span>
            <span className="font-mono text-xs text-emerald-400 tabular-nums">
              {metrics.verified_findings_count} Verified Fixed
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono tabular-nums pt-1">
            {metrics.open_findings_by_severity.critical} Critical ·{' '}
            {metrics.open_findings_by_severity.high} High ·{' '}
            {metrics.open_findings_by_severity.medium} Medium
          </div>
        </div>

        <div className="border border-slate-800 bg-[#111622] rounded-lg p-5 space-y-2">
          <div className="text-xs font-medium text-slate-400">
            Security Posture & Audit Chain
          </div>
          <div className="flex items-baseline justify-between">
            <span
              className={`font-mono text-2xl font-bold tabular-nums ${
                metrics.security_posture?.audit_chain_verified
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {metrics.security_posture ? `${metrics.security_posture.score}/100` : '88/100'}
            </span>
            <span className="font-mono text-xs text-slate-300 tabular-nums">
              {metrics.security_posture?.grade || 'A - Hardened'}
            </span>
          </div>
          <div className="text-xs text-slate-400 pt-1 flex items-center justify-between font-mono">
            <span>
              {metrics.security_posture?.audit_chain_verified
                ? 'SHA-256 Chain Intact'
                : 'Tamper Alert Detected'}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('audit-center')}
              className="text-sky-400 hover:underline font-medium"
            >
              Verify →
            </button>
          </div>
        </div>
      </div>

      {/* D3.js Workflow Completion & User Activity Trends Visualization */}
      <D3WorkflowCharts
        workflowTrends={metrics.workflow_trends || []}
        userActivityTrends={metrics.user_activity_trends || []}
      />

      {/* Residual Risk Panel with Security Posture Score & Live UI Audit Verification */}
      <ResidualRiskPanel
        securityPosture={metrics.security_posture}
        onAuditVerified={onRefreshData}
      />

      {/* Isolation Boundary Architecture + 5-Day Execution Trend Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Isolation Boundary Status */}
        <div className="lg:col-span-7 border border-slate-800 bg-[#111622] rounded-lg p-6 flex flex-col justify-between space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Active Isolation Boundaries & Principal Permissions
              </h3>
              <p className="text-xs text-slate-400">
                Current Principal: <strong className="text-slate-200">{principal.name}</strong> (
                <code className="font-mono text-sky-400">{principal.role}</code> ·{' '}
                <code className="font-mono">{principal.tenant_id}</code>)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('judge-demo')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Live Boundary Proofs</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="border border-slate-800 bg-[#0B0F17] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between font-semibold text-rose-300">
                <span>Red Artifact Vault</span>
                <Lock className="w-3.5 h-3.5" />
              </div>
              <p className="text-slate-400 leading-relaxed">
                Stores <code className="font-mono text-slate-200">RED-SECRET-742</code> and adversarial fixtures.
              </p>
              <div className="pt-1 font-mono text-[11px]">
                {principal.role === 'red_team' ? (
                  <span className="text-emerald-400">Access: Authorized Read/Write</span>
                ) : (
                  <span className="text-rose-400">Access: Server-Side 403 Denied</span>
                )}
              </div>
            </div>

            <div className="border border-slate-800 bg-[#0B0F17] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between font-semibold text-sky-300">
                <span>Blue Policy Vault</span>
                <Lock className="w-3.5 h-3.5" />
              </div>
              <p className="text-slate-400 leading-relaxed">
                Stores <code className="font-mono text-slate-200">BLUE-SECRET-391</code> and versioned defensive rules.
              </p>
              <div className="pt-1 font-mono text-[11px]">
                {principal.role === 'blue_team' ? (
                  <span className="text-emerald-400">Access: Authorized Read/Write</span>
                ) : (
                  <span className="text-rose-400">Access: Server-Side 403 Denied</span>
                )}
              </div>
            </div>

            <div className="border border-slate-800 bg-[#0B0F17] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between font-semibold text-emerald-300">
                <span>Ephemeral Model Sandbox</span>
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <p className="text-slate-400 leading-relaxed">
                Allocates distinct <code className="font-mono text-slate-200">session_id</code> and flushes KV-cache per run.
              </p>
              <div className="pt-1 font-mono text-[11px] text-emerald-400">
                Bounds: 1.0 vCPU · 512 MB · 64 PIDs
              </div>
            </div>
          </div>
        </div>

        {/* Right: 5-Day Test Execution & Denial Telemetry Chart */}
        <div className="lg:col-span-5 border border-slate-800 bg-[#111622] rounded-lg p-6 flex flex-col justify-between space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Test Outcomes & Policy Denials Trend
              </h3>
              <p className="text-xs text-slate-400">
                Passed checks vs. detector failures and blocked cross-role requests
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {metrics.execution_trend.map((day) => {
              const total = Math.max(1, day.passed_checks + day.failed_checks);
              const passPct = Math.round((day.passed_checks / total) * 100);
              const failPct = 100 - passPct;
              return (
                <div key={day.date} className="space-y-1 text-xs font-mono tabular-nums">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>
                      {day.date} ({day.runs} Runs)
                    </span>
                    <span>
                      <span className="text-emerald-400">{day.passed_checks} Pass</span> ·{' '}
                      <span className="text-rose-400">{day.failed_checks} Fail</span> ·{' '}
                      <span className="text-amber-400">{day.policy_denials} Blocked</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#0B0F17] rounded overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500/80"
                      style={{ width: `${passPct}%` }}
                    />
                    <div
                      className="h-full bg-rose-500/80"
                      style={{ width: `${failPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Runs & Recent Findings Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Runs */}
        <div className="border border-slate-800 bg-[#111622] rounded-lg overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">
                Recent Bounded Test Runs
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('red-vault')}
                className="text-xs text-sky-400 hover:underline inline-flex items-center gap-1"
              >
                <span>All Campaigns</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/70">
              {recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-sky-400 font-semibold">{run.id}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-emerald-400">{run.session_id}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">Policy v{run.policy_version}</span>
                    </div>
                    <div className="font-medium text-slate-100">{run.campaign_name}</div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-emerald-400">{run.passed_tests} Pass</div>
                      <div className={run.failed_tests > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                        {run.failed_tests} Fail
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectRun(run.id)}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Findings */}
        <div className="border border-slate-800 bg-[#111622] rounded-lg overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">
                Active Security Findings
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('blue-vault')}
                className="text-xs text-sky-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Remediate in Blue Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/70">
              {recentFindings.map((fnd) => (
                <div key={fnd.id} className="p-4 space-y-1.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-300">{fnd.id}</span>
                      <span className="text-slate-600">·</span>
                      <SeverityLabel severity={fnd.severity} />
                      <span className="text-slate-600">·</span>
                      <FindingStatusLabel status={fnd.status} />
                    </div>
                    <span className="font-mono text-slate-400">
                      Detector: {fnd.detector_id}@{fnd.detector_version}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-100">{fnd.title}</div>
                  <p className="text-slate-400 line-clamp-2">{fnd.detection_reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audit Hash-Chain Events */}
      <div className="border border-slate-800 bg-[#111622] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Recent Tamper-Evident Audit Stream
            </h3>
            <p className="text-xs text-slate-400">
              Every API boundary denial, campaign run, and policy update is cryptographically chained
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('audit-center')}
            className="text-xs text-sky-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Open Full Audit Verifier</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 bg-[#0B0F17]/60">
                <th className="py-3 px-4">Seq #</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Event SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {recentAuditEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono text-slate-300 tabular-nums">
                    #{ev.sequence_no}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-200">{ev.actor_name}</span>
                    <span className="text-slate-500 mx-1.5">·</span>
                    <span className="font-mono text-slate-400">{ev.actor_role}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-sky-300">
                    {ev.event_type} ({ev.resource_id})
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {ev.outcome === 'DENIED' ? (
                      <span className="text-rose-400 font-semibold">DENIED (403)</span>
                    ) : (
                      <span className="text-emerald-400">{ev.outcome}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <EvidenceHashDisplay hash={ev.event_hash} />
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
