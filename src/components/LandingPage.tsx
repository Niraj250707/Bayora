import React from 'react';
import {
  Shield,
  Lock,
  Play,
  CheckCircle2,
  ArrowRight,
  FileCode2,
  Database,
  Server,
  Layers,
  GitBranch,
} from 'lucide-react';
import { Role } from '../types/bayora';

interface LandingPageProps {
  onEnterLab: (initialTab?: string, principalId?: string) => void;
  onOpenAuthModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterLab,
  onOpenAuthModal,
}) => {
  const roleCards: Array<{
    principalId: string;
    role: Role;
    name: string;
    title: string;
    targetTab: string;
    summary: string;
    boundaryNote: string;
    actionLabel: string;
  }> = [
    {
      principalId: 'usr-red-niraj',
      role: 'red_team',
      name: 'Niraj Sharma',
      title: 'AI/ML & Adversarial Red-Team Lead',
      targetTab: 'red-vault',
      summary:
        'Manage encrypted attack payloads (RED-SECRET-742), configure bounded test campaigns, and execute adversarial fixtures in fresh sessions.',
      boundaryNote: 'Server-side 403 denied on Blue Policy Vault source.',
      actionLabel: 'Enter Red Team Workspace',
    },
    {
      principalId: 'usr-blue-kaival',
      role: 'blue_team',
      name: 'Kaival Solanki',
      title: 'Full-Stack & Blue-Team Defense Engineer',
      targetTab: 'blue-vault',
      summary:
        'Author immutable defensive policy versions (BLUE-SECRET-391), triage detector findings, and run automated remediation verification suites.',
      boundaryNote: 'Server-side 403 denied on Red Artifact payloads.',
      actionLabel: 'Enter Blue Team Workspace',
    },
    {
      principalId: 'usr-audit-neel',
      role: 'auditor',
      name: 'Neel Patel',
      title: 'Team Lead & AI Security Auditor',
      targetTab: 'audit-center',
      summary:
        'Independently recompute the SHA-256 cryptographic hash chain, inspect redacted evidence provenance, and audit residual risk disclosures.',
      boundaryNote: 'Read-only finalized evidence; raw vault secrets omitted.',
      actionLabel: 'Enter Audit & Evidence Center',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#0B0F17]/95 backdrop-blur border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        >
          Bayora
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <a
            href="#architecture"
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Architecture
          </a>
          <a
            href="#workflow"
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Workflow
          </a>
          <a
            href="#roles"
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Role Workspaces
          </a>
          <a
            href="#automation"
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Cloud & D3 Telemetry
          </a>
          <a
            href="#limitations"
            className="hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Residual Risks
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onEnterLab('dashboard', 'usr-red-niraj')}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Launch Crash Test Lab
          </button>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Split Section */}
        <section className="max-w-[1360px] mx-auto px-6 lg:px-12 pt-14 pb-16 border-b border-slate-800/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
                  <span className="text-sky-400">Hack in Hills ’26</span>
                  <span aria-hidden="true">·</span>
                  <span>Challenge 04: Securing Adversarial AI Safety Testing Infrastructure</span>
                  <span aria-hidden="true">·</span>
                  <span>Team INFINITE HACKERS</span>
                </div>

                <h1
                  className="font-bold tracking-tight text-slate-50 leading-[1.08]"
                  style={{ fontSize: 'clamp(2.35rem, 4vw, 3.75rem)', textWrap: 'balance' }}
                >
                  Break AI Safely. Prove It. Fix It.
                </h1>

                <p className="text-base lg:text-lg text-slate-300 leading-relaxed max-w-[66ch]">
                  Shared AI testing sandboxes risk leaking Red Team attack payloads, exposing Blue Team defensive logic, and contaminating model sessions. Bayora provides a zero-trust coordination, execution, and cryptographic evidence layer where adversarial tests run in bounded ephemeral sessions and every boundary is verifiable.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onEnterLab('judge-demo', 'usr-red-niraj')}
                    className="px-5 py-3 text-sm font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run Interactive Judge Verification Demo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEnterLab('dashboard', 'usr-red-niraj')}
                    className="px-5 py-3 text-sm font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Open Operations Dashboard
                  </button>

                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
                  >
                    Sign In / Switch Principal
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-2">
                  <span>Engineered by Neel Patel</span>
                  <span aria-hidden="true">·</span>
                  <span>Niraj Sharma</span>
                  <span aria-hidden="true">·</span>
                  <span>Kaival Solanki</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-sky-400 font-mono">D3.js Performance Telemetry Enabled</span>
                </div>
              </div>
            </div>

            {/* Right Column: Architectural Trust-Boundary Schematic */}
            <div className="lg:col-span-5 border border-slate-800 bg-[#111622] rounded-xl p-6 flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Three-Plane Zero-Trust Architecture
                  </h2>
                  <p className="text-xs text-slate-400">
                    Server-enforced namespace & session separation
                  </p>
                </div>
                <span className="font-mono text-xs text-sky-400 tabular-nums">
                  SHA-256 Verified
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="border border-slate-800 bg-[#0B0F17] rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-slate-200 font-semibold">
                    <span>01. Control & Vault Plane (Default-Deny RBAC)</span>
                    <span className="font-mono text-slate-400">HTTP 403 Enforced</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="border border-rose-500/30 bg-rose-950/15 rounded p-2.5">
                      <div className="font-semibold text-rose-300">Red Artifact Vault</div>
                      <div className="text-slate-400 mt-0.5 font-mono text-[11px]">
                        Marker: RED-SECRET-742
                      </div>
                      <div className="text-slate-400 mt-1 text-[11px]">
                        Readable only by red_team + scheduled runner
                      </div>
                    </div>
                    <div className="border border-sky-500/30 bg-sky-950/15 rounded p-2.5">
                      <div className="font-semibold text-sky-300">Blue Policy Vault</div>
                      <div className="text-slate-400 mt-0.5 font-mono text-[11px]">
                        Marker: BLUE-SECRET-391
                      </div>
                      <div className="text-slate-400 mt-1 text-[11px]">
                        Readable only by blue_team + evaluator
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-800 bg-[#0B0F17] rounded-lg p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-200 font-semibold">
                    <span>02. Bounded Ephemeral Execution Plane</span>
                    <span className="font-mono text-emerald-400 tabular-nums">
                      1.0 vCPU · 512 MB · 64 PIDs
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Allocates a fresh cryptographic <code className="font-mono text-slate-200">session_id</code> per run, flushes model KV-cache, drops root capabilities (<code className="font-mono text-slate-200">uid: 10001</code>), mounts rootfs read-only, and restricts egress strictly to allowlisted model adapters.
                  </p>
                </div>

                <div className="border border-slate-800 bg-[#0B0F17] rounded-lg p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-200 font-semibold">
                    <span>03. Cryptographic Evidence & Audit Plane</span>
                    <span className="font-mono text-amber-400">Append-Only Chain</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Versioned deterministic detectors score outputs while canonicalized metadata (with raw secrets omitted) is chained via <code className="font-mono text-slate-200">SHA256(event || prev_hash)</code>.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>USP: Protects the people, policies, and evidence involved</span>
                <button
                  type="button"
                  onClick={() => onEnterLab('judge-demo', 'usr-red-niraj')}
                  className="text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Prove Boundary Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Full-width 4-Column Verifiable Metrics Strip below Hero Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 pt-10 border-t border-slate-800/80">
            <div>
              <div className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
                100% Enforced
              </div>
              <div className="text-sm font-medium text-slate-300 mt-1">
                Server-Side Cross-Role Denial
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Verified HTTP 403 on cross-role and cross-tenant object reads with zero secret bytes leaked.
              </p>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
                1 Run = 1 Session
              </div>
              <div className="text-sm font-medium text-slate-300 mt-1">
                Fresh Ephemeral Model Context
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Every run receives a unique cryptographic session ID and clean KV-cache state by default.
              </p>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
                512 MB / 15s Cap
              </div>
              <div className="text-sm font-medium text-slate-300 mt-1">
                Bounded Sandbox Execution
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Non-root runner enforces CPU, memory, PID, output character, and target allowlist limits.
              </p>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
                SHA-256 Linked
              </div>
              <div className="text-sm font-medium text-slate-300 mt-1">
                Tamper-Evident Audit Provenance
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Detects single-byte modifications, event deletions, or sequence reordering across all runs.
              </p>
            </div>
          </div>
        </section>

        {/* Five-Stage End-to-End Workflow */}
        <section
          id="workflow"
          className="max-w-[1360px] mx-auto px-6 lg:px-12 py-16 border-b border-slate-800/80 space-y-10"
        >
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-medium text-sky-400">
              End-to-End Operational Lifecycle
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100">
              Configure → Test → Detect → Remediate → Verify
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every stage operates under explicit server-side authorization and emits minimized, canonicalized audit records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {[
              {
                num: '01. Configure',
                title: 'Select Allowlisted Target & Scope',
                desc: 'Red Team selects an approved model adapter and sets CPU, memory, timeout, and token caps. Arbitrary SSRF URLs are blocked.',
              },
              {
                num: '02. Isolate',
                title: 'Separate Red & Blue Vaults',
                desc: 'Red attack payloads (RED-SECRET-742) and Blue guardrail rules (BLUE-SECRET-391) reside in role-isolated storage namespaces.',
              },
              {
                num: '03. Execute & Detect',
                title: 'Fresh Session & Versioned Scoring',
                desc: 'Bounded runner spawns a fresh model session and evaluates outputs with deterministic versioned detectors.',
              },
              {
                num: '04. Remediate',
                title: 'Publish Immutable Blue Policy',
                desc: 'Blue Team inspects redacted findings, authors Policy v2.0.0 with canary scrubbing, and activates the new guardrail version.',
              },
              {
                num: '05. Verify & Prove',
                title: 'Run Verification & Audit Check',
                desc: 'Automated workflow triggers a fresh verification run to prove the fix and seals the SHA-256 evidence chain for auditors.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="border border-slate-800 bg-[#111622] rounded-lg p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="font-mono text-xs font-semibold text-sky-400">
                    {step.num}
                  </div>
                  <h3 className="text-base font-semibold text-slate-100">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Role Workspaces Entry */}
        <section
          id="roles"
          className="max-w-[1360px] mx-auto px-6 lg:px-12 py-16 border-b border-slate-800/80 space-y-10"
        >
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs font-medium text-sky-400">
                Role-Separated Access Control
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-100">
                Inspect the Platform from Each Security Perspective
              </h2>
              <p className="text-sm text-slate-400">
                Select any principal below to launch directly into their role-scoped workspace and test server-side boundary enforcement.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roleCards.map((card) => (
              <div
                key={card.principalId}
                className="border border-slate-800 bg-[#111622] rounded-lg p-6 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">{card.name}</span>
                    <span className="font-mono">{card.role}</span>
                  </div>
                  <div className="text-xs text-slate-400">{card.title}</div>
                  <p className="text-sm text-slate-300 leading-relaxed pt-1">{card.summary}</p>
                  <div className="pt-2 text-xs text-amber-300/90 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>{card.boundaryNote}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onEnterLab(card.targetTab, card.principalId)}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>{card.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Cloud Infrastructure & Workflow Automation Section */}
        <section
          id="automation"
          className="max-w-[1360px] mx-auto px-6 lg:px-12 py-16 border-b border-slate-800/80 space-y-10"
        >
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-medium text-sky-400">
              Automated Workflows & D3.js Telemetry Engine
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100">
              Continuous Adversarial Validation at Cloud Scale
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Bayora automates the handoff between offensive discovery and defensive remediation, offering real-time notifications when workflow tasks complete or require manual intervention.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 border border-slate-800 bg-[#111622] rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 text-base font-semibold text-slate-100">
                <GitBranch className="w-4 h-4 text-sky-400" />
                <span>Automated Closed-Loop Remediation Pipelines</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                When a Red Team campaign uncovers a canary disclosure or prompt-injection bypass, Bayora’s workflow engine automatically generates a redacted finding, notifies the Blue Team defender via in-app alerts, and—once a new Blue Policy version is activated—automatically dispatches an isolated verification run with a fresh session ID.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="border border-slate-800 bg-[#0B0F17] rounded p-3.5">
                  <div className="font-semibold text-slate-200">Auto-Triage Rules</div>
                  <p className="text-slate-400 mt-1">
                    Routes high/critical detector hits to Blue Team with redacted evidence hashes.
                  </p>
                </div>
                <div className="border border-slate-800 bg-[#0B0F17] rounded p-3.5">
                  <div className="font-semibold text-slate-200">Zero-Trust Verification</div>
                  <p className="text-slate-400 mt-1">
                    Findings cannot be marked Verified without a passing verification run.
                  </p>
                </div>
                <div className="border border-slate-800 bg-[#0B0F17] rounded p-3.5">
                  <div className="font-semibold text-slate-200">Merkle Checkpoints</div>
                  <p className="text-slate-400 mt-1">
                    Every run completion automatically seals and validates the tenant audit chain.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-slate-800 bg-[#111622] rounded-lg p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-base font-semibold text-slate-100">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>Ephemeral Sandbox Runner Pool</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Rootless container workers scale horizontally with strict cgroup bounds, non-root execution (<code className="font-mono text-xs">uid: 10001</code>), read-only root filesystems, and zero Docker socket exposure.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEnterLab('workflows', 'usr-admin-root')}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap"
              >
                Inspect Cloud Pool & Workflows
              </button>
            </div>
          </div>
        </section>

        {/* Honest Residual Risk & Limitations Section */}
        <section
          id="limitations"
          className="max-w-[1360px] mx-auto px-6 lg:px-12 py-16 space-y-8"
        >
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-medium text-amber-400">
              Engineering Honesty & Threat Transparency
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100">
              What Bayora Enforces vs. Disclosed Residual Risks
            </h2>
            <p className="text-sm text-slate-400">
              Security testing infrastructure must never overstate its guarantees. We pair every implemented control with its exact verification method and disclose remaining architectural assumptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-800 bg-[#111622] rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 text-base font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Implemented & Verifiable Controls</span>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-300">
                <li>
                  1. <strong>Server-Side Role & Tenant Isolation:</strong> Every API endpoint validates identity, role, tenant, and object ownership before returning data.
                </li>
                <li>
                  2. <strong>Separated Red & Blue Vaults:</strong> Red payloads (<code className="font-mono text-xs">RED-SECRET-742</code>) and Blue policies (<code className="font-mono text-xs">BLUE-SECRET-391</code>) are blocked from cross-role reads with HTTP 403.
                </li>
                <li>
                  3. <strong>Fresh Model Session Per Run:</strong> Every test run generates a new session identifier and flushes model context by default.
                </li>
                <li>
                  4. <strong>Tamper-Evident SHA-256 Hash Chain:</strong> Recomputes canonical event hashes from Genesis and pinpoints the exact sequence number of any modified or deleted event.
                </li>
              </ul>
            </div>

            <div className="border border-slate-800 bg-[#111622] rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 text-base font-semibold text-amber-400">
                <Shield className="w-4 h-4" />
                <span>Disclosed Residual Risks (Production Roadmap)</span>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-300">
                <li>
                  1. <strong>Shared Kernel Boundary:</strong> Standard Linux containers share a host kernel; production multi-tenant isolation requires hardware-virtualized microVMs (Firecracker / Kata).
                </li>
                <li>
                  2. <strong>Privileged Full-Chain Rewrite:</strong> A hash chain is tamper-evident, not immutable against a root database attacker unless anchored to external append-only WORM storage.
                </li>
                <li>
                  3. <strong>Hardware & Timing Side Channels:</strong> Shared GPU cache and timing side channels are not completely eliminated by container cgroup limits alone.
                </li>
                <li>
                  4. <strong>Scoped Deterministic Evaluation:</strong> Passing a finite set of adversarial fixtures demonstrates those specific controls passed, not universal model safety.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 px-6 lg:px-12 py-8 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-200">Bayora — AI Crash Test Lab</span>
          <span aria-hidden="true">·</span>
          <span>Hack in Hills ’26 (Challenge 04)</span>
          <span aria-hidden="true">·</span>
          <span>Team INFINITE HACKERS (Neel Patel, Niraj Sharma, Kaival Solanki)</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onEnterLab('judge-demo', 'usr-red-niraj')}
            className="hover:text-slate-200 transition-colors"
          >
            Judge Verification Suite
          </button>
          <button
            type="button"
            onClick={() => onEnterLab('workflows', 'usr-audit-neel')}
            className="hover:text-slate-200 transition-colors"
          >
            Threat Model & Residual Risk
          </button>
        </div>
      </footer>
    </div>
  );
};
