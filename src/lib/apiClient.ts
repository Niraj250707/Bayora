import {
  AuditEvent,
  AuditVerificationResult,
  BluePolicy,
  Campaign,
  CloudSandboxNode,
  DashboardMetrics,
  DetectorSpec,
  Finding,
  NotificationItem,
  RedArtifact,
  TargetSystem,
  TestRun,
  UserPrincipal,
  WorkflowAutomationRule,
} from '../types/bayora';

export interface ApiErrorPayload {
  status: number;
  code: string;
  message: string;
  correlation_id?: string;
  raw_response: Record<string, unknown>;
}

export class BayoraApiError extends Error {
  public payload: ApiErrorPayload;
  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'BayoraApiError';
    this.payload = payload;
  }
}

let activePrincipalId = 'usr-red-niraj';

export function setActivePrincipalId(id: string) {
  activePrincipalId = id;
}

export function getActivePrincipalId(): string {
  return activePrincipalId;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  overridePrincipalId?: string
): Promise<T> {
  const principalHeader = overridePrincipalId || activePrincipalId;
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-bayora-user-id': principalHeader,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new BayoraApiError({
      status: response.status,
      code: data?.error?.code || 'HTTP_ERROR',
      message: data?.error?.message || `Request failed with status ${response.status}`,
      correlation_id: data?.error?.correlation_id,
      raw_response: data,
    });
  }

  return data as T;
}

export const apiClient = {
  getPrincipals: () => request<{ principals: UserPrincipal[] }>('/api/v1/auth/principals'),

  registerPrincipal: (body: { name: string; email: string; role: string; title?: string }) =>
    request<{ principal: UserPrincipal }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMe: (overridePrincipalId?: string) =>
    request<{
      principal: UserPrincipal;
      permissions: {
        can_read_red_vault: boolean;
        can_write_red_vault: boolean;
        can_read_blue_vault: boolean;
        can_write_blue_vault: boolean;
        can_verify_audit_chain: boolean;
        can_manage_platform: boolean;
      };
    }>('/api/v1/me', {}, overridePrincipalId),

  getDashboard: () =>
    request<{
      metrics: DashboardMetrics;
      recent_runs: TestRun[];
      recent_findings: Finding[];
      recent_audit_events: AuditEvent[];
    }>('/api/v1/dashboard'),

  getTargets: () =>
    request<{ targets: TargetSystem[]; detectors: DetectorSpec[] }>('/api/v1/targets'),

  createTarget: (
    body: { name: string; endpoint_ref: string; model_id: string },
    overridePrincipalId?: string
  ) =>
    request<{ target: TargetSystem }>(
      '/api/v1/targets',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      overridePrincipalId
    ),

  // Red Vault
  getRedArtifacts: (overridePrincipalId?: string) =>
    request<{ artifacts: RedArtifact[] }>('/api/v1/red-artifacts', {}, overridePrincipalId),

  getRedArtifactById: (artifactId: string, overridePrincipalId?: string) =>
    request<{ artifact: RedArtifact }>(
      `/api/v1/red-artifacts/${artifactId}`,
      {},
      overridePrincipalId
    ),

  createRedArtifact: (body: Partial<RedArtifact>) =>
    request<{ artifact: RedArtifact }>('/api/v1/red-artifacts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Blue Vault
  getBluePolicies: (overridePrincipalId?: string) =>
    request<{ policies: BluePolicy[] }>('/api/v1/blue-policies', {}, overridePrincipalId),

  getBluePoliciesSummary: () =>
    request<{
      policy_summaries: Array<{
        id: string;
        name: string;
        policy_version: string;
        version_number: number;
        enabled: boolean;
        policy_hash: string;
        created_at: string;
      }>;
    }>('/api/v1/blue-policies-summary'),

  getBluePolicyById: (policyId: string, overridePrincipalId?: string) =>
    request<{ policy: BluePolicy }>(`/api/v1/blue-policies/${policyId}`, {}, overridePrincipalId),

  createBluePolicy: (body: {
    name: string;
    description: string;
    policy_version: string;
    change_notes: string;
    synthetic_marker: string;
    activate_now: boolean;
  }) =>
    request<{ policy: BluePolicy }>('/api/v1/blue-policies', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  activateBluePolicy: (policyId: string) =>
    request<{ policy: BluePolicy }>(`/api/v1/blue-policies/${policyId}/activate`, {
      method: 'POST',
    }),

  // Campaigns & Runs
  getCampaigns: () => request<{ campaigns: Campaign[] }>('/api/v1/campaigns'),

  createCampaign: (body: {
    name: string;
    description: string;
    target_id: string;
    artifact_ids: string[];
    active_policy_id: string;
    timeout_ms: number;
    max_memory_mb: number;
  }) =>
    request<{ campaign: Campaign }>('/api/v1/campaigns', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  startRun: (campaignId: string) =>
    request<{ run: TestRun }>(`/api/v1/campaigns/${campaignId}/runs`, {
      method: 'POST',
    }),

  getRuns: () => request<{ runs: TestRun[] }>('/api/v1/runs'),

  getRunById: (runId: string) => request<{ run: TestRun }>(`/api/v1/runs/${runId}`),

  cancelRun: (runId: string) =>
    request<{ run: TestRun }>(`/api/v1/runs/${runId}/cancel`, {
      method: 'POST',
    }),

  // Findings & Remediation Verification
  getFindings: () => request<{ findings: Finding[] }>('/api/v1/findings'),

  updateFinding: (
    findingId: string,
    body: { status?: string; remediation_notes?: string; assigned_owner?: string }
  ) =>
    request<{ finding: Finding }>(`/api/v1/findings/${findingId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  verifyFindingWithRun: (findingId: string) =>
    request<{ finding: Finding; verification_run: TestRun }>(
      `/api/v1/findings/${findingId}/verify-run`,
      {
        method: 'POST',
      }
    ),

  // Audit & Verification
  getAuditEvents: () =>
    request<{ events: AuditEvent[]; verification: AuditVerificationResult }>('/api/v1/audit/events'),

  verifyAuditChain: () =>
    request<{ verification: AuditVerificationResult }>('/api/v1/audit/verify', {
      method: 'POST',
    }),

  simulateTamper: (mutationType: 'modify_payload' | 'delete_event' = 'modify_payload') =>
    request<{
      message: string;
      verification: AuditVerificationResult;
      events: AuditEvent[];
    }>('/api/v1/audit/simulate-tamper', {
      method: 'POST',
      body: JSON.stringify({ mutation_type: mutationType }),
    }),

  restoreCleanAuditChain: () =>
    request<{
      message: string;
      verification: AuditVerificationResult;
      events: AuditEvent[];
    }>('/api/v1/audit/restore-clean', {
      method: 'POST',
    }),

  bulkDeleteAuditEvents: (eventIds: string[], tag?: string) =>
    request<{
      message: string;
      deleted_count: number;
      remaining_events_count: number;
      verification: AuditVerificationResult;
      events: AuditEvent[];
    }>('/api/v1/audit/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ event_ids: eventIds, tag: tag || 'AUTHORIZED_ADMIN_PURGE' }),
    }),

  // Workflows & Cloud Scaling
  getWorkflows: () =>
    request<{ workflows: WorkflowAutomationRule[]; cloud_nodes: CloudSandboxNode[] }>(
      '/api/v1/workflows'
    ),

  toggleWorkflow: (workflowId: string) =>
    request<{ workflow: WorkflowAutomationRule }>(`/api/v1/workflows/${workflowId}/toggle`, {
      method: 'POST',
    }),

  scaleOutCloudPool: () =>
    request<{ cloud_nodes: CloudSandboxNode[] }>('/api/v1/cloud/scale-burst', {
      method: 'POST',
    }),

  // Notifications API
  getNotifications: () =>
    request<{ notifications: NotificationItem[] }>('/api/v1/notifications'),

  markNotificationRead: (id: string) =>
    request<{ notification: NotificationItem }>(`/api/v1/notifications/${id}/read`, {
      method: 'POST',
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean; notifications: NotificationItem[] }>(
      '/api/v1/notifications/mark-all-read',
      { method: 'POST' }
    ),

  clearNotifications: () =>
    request<{ success: boolean; notifications: NotificationItem[] }>('/api/v1/notifications/clear', {
      method: 'POST',
    }),

  triggerDemoNotification: (body?: {
    type?: string;
    title?: string;
    message?: string;
    target_tab?: string;
    action_label?: string;
  }) =>
    request<{ notification: NotificationItem }>('/api/v1/notifications/trigger-demo', {
      method: 'POST',
      body: JSON.stringify(body || {}),
    }),

  resetDemo: () =>
    request<{ status: string; message: string }>('/api/v1/demo/reset', {
      method: 'POST',
    }),
};
