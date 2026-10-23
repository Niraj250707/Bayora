export type Role = 'red_team' | 'blue_team' | 'auditor' | 'admin';

export interface UserPrincipal {
  id: string;
  tenant_id: string;
  tenant_name: string;
  email: string;
  name: string;
  title: string;
  role: Role;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface TargetSystem {
  id: string;
  tenant_id: string;
  name: string;
  endpoint_ref: string;
  model_id: string;
  model_version: string;
  description: string;
  protection_profile: 'unpatched_baseline' | 'policy_enforced' | 'strict_sandbox';
  allowed: boolean;
  created_at: string;
}

export interface RedArtifact {
  id: string;
  tenant_id: string;
  owner_id: string;
  owner_name: string;
  name: string;
  category:
    | 'prompt_injection'
    | 'system_prompt_leakage'
    | 'sensitive_data_disclosure'
    | 'jailbreak_override'
    | 'context_contamination'
    | 'resource_exhaustion'
    | 'cross_tenant_probe';
  severity_estimate: 'critical' | 'high' | 'medium' | 'low';
  synthetic_marker: string;
  encrypted_payload: string;
  payload_hash: string;
  description: string;
  expected_secure_behavior: string;
  created_at: string;
}

export interface BluePolicyRule {
  rule_id: string;
  type: 'block_marker' | 'regex_filter' | 'input_length_cap' | 'context_isolation' | 'output_redaction';
  pattern: string;
  action: 'block_and_redact' | 'refuse_request' | 'enforce_fresh_session' | 'truncate_input';
  description: string;
}

export interface BluePolicy {
  id: string;
  tenant_id: string;
  owner_id: string;
  owner_name: string;
  name: string;
  description: string;
  policy_version: string;
  version_number: number;
  enabled: boolean;
  synthetic_marker: string;
  policy_body: string;
  rules: BluePolicyRule[];
  policy_hash: string;
  change_notes: string;
  created_at: string;
}

export interface DetectorSpec {
  id: string;
  name: string;
  version: string;
  category: string;
  deterministic: boolean;
  confidence_definition: string;
  description: string;
  rule_summary: string;
  created_at: string;
}

export interface ResourceLimits {
  max_cpu_cores: number;
  max_memory_mb: number;
  max_pids: number;
  timeout_ms: number;
  max_input_chars: number;
  max_output_chars: number;
  network_mode: 'model_adapter_only';
  non_root_uid: number;
  read_only_rootfs: boolean;
  docker_socket_mounted: false;
}

export interface Campaign {
  id: string;
  tenant_id: string;
  owner_id: string;
  owner_name: string;
  name: string;
  description: string;
  target_id: string;
  target_name: string;
  artifact_ids: string[];
  active_policy_id: string;
  active_policy_version: string;
  detector_ids: string[];
  status: 'ready' | 'running' | 'completed' | 'archived';
  resource_limits: ResourceLimits;
  created_at: string;
}

export type TestOutcome =
  | 'PASSED'
  | 'FAILED'
  | 'DETECTOR_ERROR'
  | 'EXECUTION_ERROR'
  | 'INCONCLUSIVE';

export interface RunTestItem {
  id: string;
  run_id: string;
  artifact_id: string;
  artifact_name: string;
  category: string;
  session_id: string;
  detector_id: string;
  detector_version: string;
  policy_version: string;
  outcome: TestOutcome;
  reason: string;
  redacted_input: string;
  redacted_output: string;
  latency_ms: number;
  memory_used_mb: number;
  evidence_hash: string;
  timestamp: string;
}

export type RunStatus = 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';

export interface TestRun {
  id: string;
  tenant_id: string;
  campaign_id: string;
  campaign_name: string;
  target_id: string;
  target_name: string;
  model_id: string;
  model_version: string;
  created_by: string;
  created_by_name: string;
  status: RunStatus;
  session_id: string;
  session_isolated: boolean;
  kv_cache_flushed: boolean;
  policy_id: string;
  policy_version: string;
  detector_versions: string[];
  resource_limits: ResourceLimits;
  total_tests: number;
  executed_tests: number;
  passed_tests: number;
  failed_tests: number;
  inconclusive_tests: number;
  findings_count: number;
  median_latency_ms: number;
  p95_latency_ms: number;
  peak_memory_mb: number;
  cpu_utilization_pct: number;
  evidence_root_hash: string;
  started_at: string;
  finished_at: string | null;
  items: RunTestItem[];
  is_verification_run?: boolean;
  verified_finding_id?: string;
}

export type FindingStatus = 'Open' | 'In Progress' | 'Fixed' | 'Accepted Risk' | 'Verified';
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Finding {
  id: string;
  tenant_id: string;
  run_id: string;
  campaign_id: string;
  target_id: string;
  target_name: string;
  title: string;
  category: string;
  severity: FindingSeverity;
  status: FindingStatus;
  detector_id: string;
  detector_version: string;
  policy_version_at_discovery: string;
  detection_reason: string;
  redacted_evidence_summary: string;
  evidence_hash: string;
  remediation_recommendation: string;
  remediation_notes: string;
  assigned_owner: string;
  verified_by_run_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  sequence_no: number;
  tenant_id: string;
  run_id: string | null;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  actor_role: Role;
  event_type: string;
  resource_type: string;
  resource_id: string;
  outcome: 'ALLOWED' | 'DENIED' | 'SUCCESS' | 'FAILURE' | 'TAMPER_ALERT';
  minimized_payload: Record<string, unknown>;
  previous_hash: string;
  event_hash: string;
}

export interface AuditVerificationResult {
  verified: boolean;
  total_events: number;
  checked_events: number;
  first_mismatch_sequence: number | null;
  first_mismatch_event_id: string | null;
  expected_hash: string | null;
  actual_hash: string | null;
  failure_reason: string | null;
  latest_checkpoint_hash: string;
  verified_at: string;
  tamper_simulation_active: boolean;
}

export interface WorkflowAutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  executions_count: number;
  last_triggered_at: string | null;
  description: string;
}

export interface CloudSandboxNode {
  node_id: string;
  region: string;
  runtime: string;
  status: 'Active' | 'Warm Standby' | 'Recycling Session' | 'QUARANTINED';
  active_session_id: string | null;
  cpu_usage_pct: number;
  memory_used_mb: number;
  memory_limit_mb: number;
  pids_active: number;
  pids_limit: number;
  kv_cache_state: 'Flushed Clean' | 'Isolated Active' | 'PURGED_ENFORCED';
  egress_policy: string;
  quarantine_reason?: string;
}

export interface DailyTestingHeatmapPoint {
  date: string;
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  weekIndex: number;
  runsCount: number;
  passedChecks: number;
  failedChecks: number;
  blockedAttacks: number;
  activeRole: 'red_team' | 'blue_team' | 'mixed' | 'idle';
  postureScore: number;
  intensity: number; // 0 to 4
}

export interface NotificationItem {
  id: string;
  type: 'COMPLETED' | 'ACTION_REQUIRED' | 'SECURITY_ALERT';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action_url?: string;
  action_label?: string;
  target_tab?: string;
  related_id?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export interface SecurityPostureScore {
  score: number;
  grade: 'A - Hardened' | 'B - Guardrails Active' | 'C - Remediation Needed' | 'F - Critical Risk';
  finding_resolution_pct: number;
  test_pass_rate_pct: number;
  audit_integrity_factor: number;
  audit_chain_verified: boolean;
  verified_at: string;
  total_findings: number;
  resolved_findings: number;
  total_tests: number;
  passed_tests: number;
  breakdown: {
    findings_score: number;
    tests_score: number;
    audit_score: number;
  };
}

export interface WorkflowTrendDataPoint {
  timestamp: string;
  label: string;
  completedTasks: number;
  failedTasks: number;
  completionRate: number;
  avgLatencyMs: number;
}

export interface UserActivityDataPoint {
  timestamp: string;
  label: string;
  redTeamActions: number;
  blueTeamActions: number;
  auditorActions: number;
  policyDenials: number;
}

export interface DashboardMetrics {
  total_runs: number;
  completed_runs: number;
  failed_runs: number;
  cancelled_runs: number;
  cross_role_denials: number;
  cross_tenant_denials: number;
  fresh_session_coverage_pct: number;
  open_findings_by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  verified_findings_count: number;
  median_run_latency_ms: number;
  p95_run_latency_ms: number;
  audit_chain_verified: boolean;
  audit_events_count: number;
  active_workflows_count: number;
  cloud_nodes: CloudSandboxNode[];
  workflow_trends: WorkflowTrendDataPoint[];
  user_activity_trends: UserActivityDataPoint[];
  testing_heatmap_30d?: DailyTestingHeatmapPoint[];
  global_kill_switch?: {
    active: boolean;
    triggered_at: string | null;
    triggered_by: string | null;
    reason: string | null;
    quarantined_nodes_count: number;
  };
  security_posture: SecurityPostureScore;
  execution_trend: Array<{
    date: string;
    runs: number;
    passed_checks: number;
    failed_checks: number;
    policy_denials: number;
  }>;
}
