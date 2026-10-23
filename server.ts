import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import { bayoraEngine, sha256, DEFAULT_RESOURCE_LIMITS } from './src/server/bayoraEngine';
import { UserPrincipal, BluePolicy, RedArtifact } from './src/types/bayora';

const app = express();
app.use(express.json({ limit: '64kb' }));

interface AuthenticatedRequest extends Request {
  principal?: UserPrincipal;
  correlationId?: string;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  req.correlationId = `req_${crypto.randomBytes(4).toString('hex')}`;
  const headerUserId = (req.headers['x-bayora-user-id'] as string) || 'usr-red-niraj';
  const principal = bayoraEngine.users.find((u) => u.id === headerUserId && u.status === 'active');

  if (!principal) {
    res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Valid principal authentication is required to access this endpoint.',
        correlation_id: req.correlationId,
      },
    });
    return;
  }

  req.principal = principal;
  next();
}

function sendAccessDenied(res: Response, correlationId?: string, customMessage?: string) {
  res.status(403).json({
    error: {
      code: 'ACCESS_DENIED',
      message: customMessage || 'This resource is unavailable to your role.',
      correlation_id: correlationId,
    },
  });
}

// Health endpoints
app.get('/health/live', (_req, res) => {
  res.json({ status: 'ok', service: 'bayora-api-gateway', timestamp: new Date().toISOString() });
});

app.get('/health/ready', (_req, res) => {
  const verification = bayoraEngine.verifyAuditChain();
  res.json({
    status: 'ready',
    audit_chain_intact: verification.verified,
    runner_pool_nodes: bayoraEngine.cloudNodes.length,
    timestamp: new Date().toISOString(),
  });
});

// Identity & Demo Principals
app.get('/api/v1/auth/principals', (_req, res) => {
  res.json({ principals: bayoraEngine.users });
});

app.post('/api/v1/auth/register', (req: AuthenticatedRequest, res: Response) => {
  const { name, email, role, title } = req.body;
  if (!name || !email || !role) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Name, email, and role are required.' },
    });
    return;
  }
  const allowedRoles = ['red_team', 'blue_team', 'auditor', 'admin'];
  if (!allowedRoles.includes(role)) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid role specified.' },
    });
    return;
  }

  const newUser: UserPrincipal = {
    id: `usr-${role.split('_')[0]}-${crypto.randomBytes(2).toString('hex')}`,
    tenant_id: 'tenant-acme-sec',
    tenant_name: 'Acme AI Safety Lab (Primary Tenant)',
    email: String(email).trim(),
    name: String(name).trim(),
    title: title ? String(title).trim() : `${role.replace('_', ' ').toUpperCase()} Operator`,
    role,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  bayoraEngine.users.push(newUser);
  bayoraEngine.appendAuditEvent({
    tenant_id: newUser.tenant_id,
    run_id: null,
    actor_id: newUser.id,
    actor_name: newUser.name,
    actor_role: newUser.role,
    event_type: 'PRINCIPAL_REGISTERED',
    resource_type: 'user',
    resource_id: newUser.id,
    outcome: 'SUCCESS',
    minimized_payload: { email: newUser.email, assigned_role: newUser.role },
  });

  res.status(201).json({ principal: newUser });
});

app.use('/api/v1', authMiddleware);

app.get('/api/v1/me', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    principal: req.principal,
    permissions: {
      can_read_red_vault: req.principal?.role === 'red_team',
      can_write_red_vault: req.principal?.role === 'red_team',
      can_read_blue_vault: req.principal?.role === 'blue_team',
      can_write_blue_vault: req.principal?.role === 'blue_team',
      can_verify_audit_chain: true,
      can_manage_platform: req.principal?.role === 'admin',
    },
  });
});

// ============================================================================
// NOTIFICATIONS SYSTEM (Automated task completions & manual intervention alerts)
// ============================================================================
app.get('/api/v1/notifications', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ notifications: bayoraEngine.notifications });
});

app.post('/api/v1/notifications/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const notif = bayoraEngine.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
  }
  res.json({ notification: notif });
});

app.post('/api/v1/notifications/mark-all-read', (_req: AuthenticatedRequest, res: Response) => {
  bayoraEngine.notifications.forEach((n) => {
    n.read = true;
  });
  res.json({ success: true, notifications: bayoraEngine.notifications });
});

app.post('/api/v1/notifications/clear', (_req: AuthenticatedRequest, res: Response) => {
  bayoraEngine.notifications = bayoraEngine.notifications.filter((n) => !n.read);
  res.json({ success: true, notifications: bayoraEngine.notifications });
});

app.post('/api/v1/notifications/trigger-demo', (req: AuthenticatedRequest, res: Response) => {
  const { type, title, message, target_tab, action_label } = req.body;
  const created = bayoraEngine.addNotification({
    type: type || 'ACTION_REQUIRED',
    title: title || 'Manual Intervention Required: Policy Rule Approval',
    message:
      message ||
      'Automated quarantine pipeline drafted candidate rule [rule-canary-scrub] for FinAssist LLM. Blue Team review and manual signature required.',
    action_label: action_label || 'Review in Blue Vault',
    target_tab: target_tab || 'blue-vault',
    severity: type === 'SECURITY_ALERT' ? 'critical' : 'high',
  });
  res.status(201).json({ notification: created });
});

// Dashboard Metrics & Overview
app.get('/api/v1/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  const metrics = bayoraEngine.getDashboardMetrics(principal.tenant_id);
  const recentRuns = bayoraEngine.runs
    .filter((r) => r.tenant_id === principal.tenant_id)
    .slice(0, 6);
  const recentFindings = bayoraEngine.findings
    .filter((f) => f.tenant_id === principal.tenant_id)
    .slice(0, 6);
  const recentAuditEvents = bayoraEngine.auditEvents.slice(-8).reverse();

  res.json({
    metrics,
    recent_runs: recentRuns,
    recent_findings: recentFindings,
    recent_audit_events: recentAuditEvents,
  });
});

// Allowlisted Targets (with SSRF prevention check)
app.get('/api/v1/targets', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  const targets = bayoraEngine.targets.filter((t) => t.tenant_id === principal.tenant_id);
  res.json({ targets, detectors: bayoraEngine.detectors });
});

app.post('/api/v1/targets', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  const { name, endpoint_ref, model_id } = req.body;

  const refStr = String(endpoint_ref || '');
  if (!refStr.startsWith('local://mock-adapter/')) {
    bayoraEngine.appendAuditEvent({
      tenant_id: principal.tenant_id,
      run_id: null,
      actor_id: principal.id,
      actor_name: principal.name,
      actor_role: principal.role,
      event_type: 'UNAPPROVED_TARGET_REJECTED',
      resource_type: 'target',
      resource_id: 'unapproved-endpoint',
      outcome: 'DENIED',
      minimized_payload: {
        reason: 'Outbound endpoint not in approved local://mock-adapter/ allowlist (SSRF protection)',
        attempted_scheme: refStr.split(':')[0] || 'unknown',
        http_status: 403,
      },
    });

    res.status(403).json({
      error: {
        code: 'TARGET_NOT_ALLOWLISTED',
        message:
          'Outbound target rejected by egress policy. Only allowlisted local://mock-adapter/* targets are permitted in the sandbox.',
        correlation_id: req.correlationId,
      },
    });
    return;
  }

  const newTarget = {
    id: `target-custom-${crypto.randomBytes(2).toString('hex')}`,
    tenant_id: principal.tenant_id,
    name: String(name || 'Custom Sandbox Target'),
    endpoint_ref: refStr,
    model_id: String(model_id || 'bayora-mock-custom'),
    model_version: '1.0.0-isolated',
    description: 'Authorized local sandbox target registered under strict egress controls.',
    protection_profile: 'policy_enforced' as const,
    allowed: true,
    created_at: new Date().toISOString(),
  };

  bayoraEngine.targets.push(newTarget);
  res.status(201).json({ target: newTarget });
});

// ============================================================================
// RED TEAM VAULT
// ============================================================================
app.get('/api/v1/red-artifacts', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;

  if (principal.role !== 'red_team') {
    bayoraEngine.appendAuditEvent({
      tenant_id: principal.tenant_id,
      run_id: null,
      actor_id: principal.id,
      actor_name: principal.name,
      actor_role: principal.role,
      event_type: 'CROSS_ROLE_READ_DENIED',
      resource_type: 'red_artifact_vault',
      resource_id: 'red_vault_collection',
      outcome: 'DENIED',
      minimized_payload: {
        attempted_by_role: principal.role,
        target_namespace: 'red_vault',
        http_status: 403,
        error_code: 'ACCESS_DENIED',
      },
    });
    sendAccessDenied(res, req.correlationId);
    return;
  }

  const artifacts = bayoraEngine.redArtifacts.filter((a) => a.tenant_id === principal.tenant_id);
  res.json({ artifacts });
});

app.get('/api/v1/red-artifacts/:artifactId', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  const { artifactId } = req.params;
  const artifact = bayoraEngine.redArtifacts.find((a) => a.id === artifactId);

  if (artifact && artifact.tenant_id !== principal.tenant_id) {
    bayoraEngine.appendAuditEvent({
      tenant_id: principal.tenant_id,
      run_id: null,
      actor_id: principal.id,
      actor_name: principal.name,
      actor_role: principal.role,
      event_type: 'CROSS_TENANT_ACCESS_DENIED',
      resource_type: 'red_artifact',
      resource_id: artifactId,
      outcome: 'DENIED',
      minimized_payload: {
        actor_tenant: principal.tenant_id,
        resource_id: artifactId,
        http_status: 403,
        error_code: 'ACCESS_DENIED',
      },
    });
    sendAccessDenied(res, req.correlationId);
    return;
  }

  if (principal.role !== 'red_team' || !artifact) {
    bayoraEngine.appendAuditEvent({
      tenant_id: principal.tenant_id,
      run_id: null,
      actor_id: principal.id,
      actor_name: principal.name,
      actor_role: principal.role,
      event_type: 'CROSS_ROLE_READ_DENIED',
      resource_type: 'red_artifact',
      resource_id: artifactId,
      outcome: 'DENIED',
      minimized_payload: {
        attempted_by_role: principal.role,
        target_namespace: 'red_vault',
        resource_id: artifactId,
        http_status: 403,
        error_code: 'ACCESS_DENIED',
      },
    });
    sendAccessDenied(res, req.correlationId);
    return;
  }

  res.json({ artifact });
});

app.post('/api/v1/red-artifacts', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  if (principal.role !== 'red_team') {
    bayoraEngine.appendAuditEvent({
      tenant_id: principal.tenant_id,
      run_id: null,
      actor_id: principal.id,
      actor_name: principal.name,
      actor_role: principal.role,
      event_type: 'CROSS_ROLE_WRITE_DENIED',
      resource_type: 'red_artifact',
      resource_id: 'new',
      outcome: 'DENIED',
      minimized_payload: { attempted_by_role: principal.role, http_status: 403 },
    });
    sendAccessDenied(res, req.correlationId);
    return;
  }

  const {
    name,
    category,
    severity_estimate,
    synthetic_marker,
    encrypted_payload,
    description,
    expected_secure_behavior,
  } = req.body;

  if (!name || !encrypted_payload || !synthetic_marker) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Artifact name, synthetic_marker, and payload are required.',
      },
    });
    return;
  }

  const payloadStr = String(encrypted_payload).slice(0, 4096);
  const payloadHash = sha256(payloadStr);
  const newArtifact: RedArtifact = {
    id: `art-red-${crypto.randomBytes(2).toString('hex')}`,
    tenant_id: principal.tenant_id,
    owner_id: principal.id,
    owner_name: principal.name,
    name: String(name).trim(),
    category: category || 'prompt_injection',
    severity_estimate: severity_estimate || 'high',
    synthetic_marker: String(synthetic_marker).trim(),
    encrypted_payload: payloadStr,
    payload_hash: payloadHash,
    description: String(description || 'Authorized Red Team adversarial fixture.'),
    expected_secure_behavior: String(
      expected_secure_behavior || 'Model refuses instruction override and withholds synthetic marker.'
    ),
    created_at: new Date().toISOString(),
  };

  bayoraEngine.redArtifacts.unshift(newArtifact);
  bayoraEngine.appendAuditEvent({
    tenant_id: principal.tenant_id,
    run_id: null,
    actor_id: principal.id,
    actor_name: principal.name,
    actor_role: principal.role,
    event_type: 'RED_ARTIFACT_CREATED',
    resource_type: 'red_artifact',
    resource_id: newArtifact.id,
    outcome: 'SUCCESS',
    minimized_payload: {
      artifact_id: newArtifact.id,
      category: newArtifact.category,
      payload_hash: newArtifact.payload_hash,
      raw_secret_omitted: true,
    },
  });

  res.status(201).json({ artifact: newArtifact });
});

// ============================================================================
// BLUE TEAM VAULT
// ============================================================================
app.get('/api/v1/blue-policies', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;

  if (principal.role !== 'blue_team') {
    bayoraEngine.appendAuditEvent({
      tenant_id: principal.tenant_id,
      run_id: null,
      actor_id: principal.id,
      actor_name: principal.name,
      actor_role: principal.role,
      event_type: 'CROSS_ROLE_READ_DENIED',
      resource_type: 'blue_policy_vault',
      resource_id: 'blue_vault_collection',
      outcome: 'DENIED',
      minimized_payload: {
        attempted_by_role: principal.role,
        target_namespace: 'blue_vault',
        http_status: 403,
        error_code: 'ACCESS_DENIED',
      },
    });
    sendAccessDenied(res, req.correlationId);
    return;
  }

  const policies = bayoraEngine.bluePolicies.filter((p) => p.tenant_id === principal.tenant_id);
  res.json({ policies });
});

app.get('/api/v1/blue-policies-summary', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  const summaries = bayoraEngine.bluePolicies
    .filter((p) => p.tenant_id === principal.tenant_id)
    .map((p) => ({
      id: p.id,
      name: p.name,
      policy_version: p.policy_version,
      version_number: p.version_number,
      enabled: p.enabled,
      policy_hash: p.policy_hash,
      created_at: p.created_at,
    }));
  res.json({ policy_summaries: summaries });
});

app.get('/api/v1/blue-policies/:policyId', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  const { policyId } = req.params;
  const policy = bayoraEngine.bluePolicies.find((p) => p.id === policyId);

  if (policy && policy.tenant_id !== principal.tenant_id) {
    bayoraEngine.appendAuditEvent({
      tenant_id: principal.tenant_id,
      run_id: null,
      actor_id: principal.id,
      actor_name: principal.name,
      actor_role: principal.role,
      event_type: 'CROSS_TENANT_ACCESS_DENIED',
      resource_type: 'blue_policy',
      resource_id: policyId,
      outcome: 'DENIED',
      minimized_payload: {
        actor_tenant: principal.tenant_id,
        resource_id: policyId,
        http_status: 403,
        error_code: 'ACCESS_DENIED',
      },
    });
    sendAccessDenied(res, req.correlationId);
    return;
  }

  if (principal.role !== 'blue_team' || !policy) {
    bayoraEngine.appendAuditEvent({
      tenant_id: principal.tenant_id,
      run_id: null,
      actor_id: principal.id,
      actor_name: principal.name,
      actor_role: principal.role,
      event_type: 'CROSS_ROLE_READ_DENIED',
      resource_type: 'blue_policy',
      resource_id: policyId,
      outcome: 'DENIED',
      minimized_payload: {
        attempted_by_role: principal.role,
        target_namespace: 'blue_vault',
        resource_id: policyId,
        http_status: 403,
        error_code: 'ACCESS_DENIED',
      },
    });
    sendAccessDenied(res, req.correlationId);
    return;
  }

  res.json({ policy });
});

app.post('/api/v1/blue-policies', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  if (principal.role !== 'blue_team') {
    bayoraEngine.appendAuditEvent({
      tenant_id: principal.tenant_id,
      run_id: null,
      actor_id: principal.id,
      actor_name: principal.name,
      actor_role: principal.role,
      event_type: 'CROSS_ROLE_WRITE_DENIED',
      resource_type: 'blue_policy',
      resource_id: 'new',
      outcome: 'DENIED',
      minimized_payload: { attempted_by_role: principal.role, http_status: 403 },
    });
    sendAccessDenied(res, req.correlationId);
    return;
  }

  const { name, description, policy_version, change_notes, synthetic_marker, rules, activate_now } =
    req.body;

  const nextVersionNum = bayoraEngine.bluePolicies.length + 1;
  const versionStr = policy_version || `${nextVersionNum}.0.0`;
  const markerStr = synthetic_marker || 'BLUE-SECRET-391';

  const bodyObj = {
    policy_id: `pol-blue-v${nextVersionNum}`,
    version: versionStr,
    classifier_secret_seed: markerStr,
    mode: 'strict_zero_trust',
    block_synthetic_markers: true,
    blocked_patterns: ['RED-SECRET-742', 'RED-SECRET-742-INJECT', 'SYS-CANARY'],
    enforce_structural_delimiters: true,
    enforce_fresh_kv_session: true,
    max_output_chars: 4096,
  };
  const policyBodyStr = JSON.stringify(bodyObj, null, 2);
  const policyHash = sha256(policyBodyStr);

  if (activate_now) {
    bayoraEngine.bluePolicies.forEach((p) => {
      if (p.tenant_id === principal.tenant_id) p.enabled = false;
    });
  }

  const newPolicy: BluePolicy = {
    id: `pol-blue-391-v${nextVersionNum}`,
    tenant_id: principal.tenant_id,
    owner_id: principal.id,
    owner_name: principal.name,
    name: String(name || 'Bayora Zero-Trust Guardrail Policy'),
    description: String(
      description || 'Immutable versioned Blue Team defensive policy enforcing zero-trust guardrails.'
    ),
    policy_version: versionStr,
    version_number: nextVersionNum,
    enabled: Boolean(activate_now),
    synthetic_marker: markerStr,
    policy_body: policyBodyStr,
    rules: rules || bayoraEngine.bluePolicies[1].rules,
    policy_hash: policyHash,
    change_notes: String(change_notes || `Published immutable policy version ${versionStr}`),
    created_at: new Date().toISOString(),
  };

  bayoraEngine.bluePolicies.unshift(newPolicy);

  bayoraEngine.appendAuditEvent({
    tenant_id: principal.tenant_id,
    run_id: null,
    actor_id: principal.id,
    actor_name: principal.name,
    actor_role: principal.role,
    event_type: 'BLUE_POLICY_VERSION_CREATED',
    resource_type: 'blue_policy',
    resource_id: newPolicy.id,
    outcome: 'SUCCESS',
    minimized_payload: {
      policy_id: newPolicy.id,
      policy_version: newPolicy.policy_version,
      policy_hash: newPolicy.policy_hash,
      activated: newPolicy.enabled,
      raw_policy_omitted: true,
    },
  });

  bayoraEngine.addNotification({
    type: 'COMPLETED',
    title: `Blue Policy v${newPolicy.policy_version} Published`,
    message: `New guardrail version authored by ${principal.name}. Active: ${newPolicy.enabled ? 'Yes' : 'No'}.`,
    action_label: 'View in Blue Vault',
    target_tab: 'blue-vault',
    severity: 'info',
  });

  res.status(201).json({ policy: newPolicy });
});

app.post('/api/v1/blue-policies/:policyId/activate', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  if (principal.role !== 'blue_team' && principal.role !== 'admin') {
    sendAccessDenied(res, req.correlationId);
    return;
  }

  const { policyId } = req.params;
  const targetPolicy = bayoraEngine.bluePolicies.find(
    (p) => p.id === policyId && p.tenant_id === principal.tenant_id
  );
  if (!targetPolicy) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Policy version not found.' } });
    return;
  }

  bayoraEngine.bluePolicies.forEach((p) => {
    if (p.tenant_id === principal.tenant_id) {
      p.enabled = p.id === policyId;
    }
  });

  bayoraEngine.appendAuditEvent({
    tenant_id: principal.tenant_id,
    run_id: null,
    actor_id: principal.id,
    actor_name: principal.name,
    actor_role: principal.role,
    event_type: 'BLUE_POLICY_ACTIVATED',
    resource_type: 'blue_policy',
    resource_id: targetPolicy.id,
    outcome: 'SUCCESS',
    minimized_payload: {
      policy_id: targetPolicy.id,
      policy_version: targetPolicy.policy_version,
      policy_hash: targetPolicy.policy_hash,
    },
  });

  // Trigger automated workflow if enabled
  const autoWf = bayoraEngine.workflows.find((w) => w.id === 'wf-auto-verify-policy');
  if (autoWf && autoWf.enabled) {
    autoWf.executions_count += 1;
    autoWf.last_triggered_at = new Date().toISOString();

    bayoraEngine.addNotification({
      type: 'COMPLETED',
      title: 'Automated Regression Triggered for Policy v' + targetPolicy.policy_version,
      message: 'Automated workflow wf-auto-verify-policy dispatched verification run with fresh session isolation.',
      action_label: 'View Verification',
      target_tab: 'blue-vault',
      severity: 'info',
    });
  }

  res.json({ policy: targetPolicy });
});

// ============================================================================
// CAMPAIGNS & BOUNDED TEST RUNS
// ============================================================================
app.get('/api/v1/campaigns', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  const campaigns = bayoraEngine.campaigns.filter((c) => c.tenant_id === principal.tenant_id);
  res.json({ campaigns });
});

app.post('/api/v1/campaigns', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  if (principal.role !== 'red_team' && principal.role !== 'admin') {
    sendAccessDenied(
      res,
      req.correlationId,
      'Only Red Team testers or Administrators can create adversarial test campaigns.'
    );
    return;
  }

  const { name, description, target_id, artifact_ids, active_policy_id, timeout_ms, max_memory_mb } =
    req.body;

  const target = bayoraEngine.targets.find(
    (t) => t.id === target_id && t.tenant_id === principal.tenant_id && t.allowed
  );
  if (!target) {
    res.status(403).json({
      error: {
        code: 'TARGET_NOT_ALLOWLISTED',
        message: 'Selected target is not in the authorized tenant target allowlist.',
      },
    });
    return;
  }

  const policy =
    bayoraEngine.bluePolicies.find((p) => p.id === active_policy_id) ||
    bayoraEngine.bluePolicies.find((p) => p.enabled) ||
    bayoraEngine.bluePolicies[0];

  const newCampaign = {
    id: `camp-${crypto.randomBytes(3).toString('hex')}`,
    tenant_id: principal.tenant_id,
    owner_id: principal.id,
    owner_name: principal.name,
    name: String(name || 'Authorized Adversarial Campaign').trim(),
    description: String(
      description || 'Bounded red-team validation suite with fresh model sessions.'
    ),
    target_id: target.id,
    target_name: target.name,
    artifact_ids:
      Array.isArray(artifact_ids) && artifact_ids.length > 0
        ? artifact_ids
        : bayoraEngine.redArtifacts.map((a) => a.id),
    active_policy_id: policy.id,
    active_policy_version: policy.policy_version,
    detector_ids: bayoraEngine.detectors.map((d) => d.id),
    status: 'ready' as const,
    resource_limits: {
      ...DEFAULT_RESOURCE_LIMITS,
      timeout_ms: Number(timeout_ms) || DEFAULT_RESOURCE_LIMITS.timeout_ms,
      max_memory_mb: Number(max_memory_mb) || DEFAULT_RESOURCE_LIMITS.max_memory_mb,
    },
    created_at: new Date().toISOString(),
  };

  bayoraEngine.campaigns.unshift(newCampaign);
  bayoraEngine.appendAuditEvent({
    tenant_id: principal.tenant_id,
    run_id: null,
    actor_id: principal.id,
    actor_name: principal.name,
    actor_role: principal.role,
    event_type: 'CAMPAIGN_CREATED',
    resource_type: 'campaign',
    resource_id: newCampaign.id,
    outcome: 'SUCCESS',
    minimized_payload: {
      campaign_id: newCampaign.id,
      target_id: newCampaign.target_id,
      artifact_count: newCampaign.artifact_ids.length,
      policy_version: newCampaign.active_policy_version,
    },
  });

  res.status(201).json({ campaign: newCampaign });
});

app.post('/api/v1/campaigns/:campaignId/runs', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  if (principal.role !== 'red_team' && principal.role !== 'blue_team' && principal.role !== 'admin') {
    sendAccessDenied(
      res,
      req.correlationId,
      'Auditors have read-only evidence access and cannot trigger test execution.'
    );
    return;
  }

  const { campaignId } = req.params;
  const campaign = bayoraEngine.campaigns.find(
    (c) => c.id === campaignId && c.tenant_id === principal.tenant_id
  );
  if (!campaign) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Campaign not found.' } });
    return;
  }

  const run = bayoraEngine.executeRunInternal(campaign, principal);
  campaign.status = 'completed';

  res.status(201).json({ run });
});

app.get('/api/v1/runs', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  const runs = bayoraEngine.runs.filter((r) => r.tenant_id === principal.tenant_id);
  res.json({ runs });
});

app.get('/api/v1/runs/:runId', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  const run = bayoraEngine.runs.find(
    (r) => r.id === req.params.runId && r.tenant_id === principal.tenant_id
  );
  if (!run) {
    sendAccessDenied(res, req.correlationId);
    return;
  }
  res.json({ run });
});

app.post('/api/v1/runs/:runId/cancel', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  const run = bayoraEngine.runs.find(
    (r) => r.id === req.params.runId && r.tenant_id === principal.tenant_id
  );
  if (!run) {
    sendAccessDenied(res, req.correlationId);
    return;
  }

  run.status = 'Cancelled';
  run.finished_at = new Date().toISOString();

  bayoraEngine.appendAuditEvent({
    tenant_id: principal.tenant_id,
    run_id: run.id,
    actor_id: principal.id,
    actor_name: principal.name,
    actor_role: principal.role,
    event_type: 'RUN_CANCELLED',
    resource_type: 'test_run',
    resource_id: run.id,
    outcome: 'SUCCESS',
    minimized_payload: {
      run_id: run.id,
      session_id: run.session_id,
      cancelled_by: principal.id,
    },
  });

  res.json({ run });
});

// ============================================================================
// FINDINGS & REMEDIATION VERIFICATION
// ============================================================================
app.get('/api/v1/findings', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  const findings = bayoraEngine.findings.filter((f) => f.tenant_id === principal.tenant_id);
  res.json({ findings });
});

app.patch('/api/v1/findings/:findingId', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  if (principal.role !== 'blue_team' && principal.role !== 'admin') {
    sendAccessDenied(
      res,
      req.correlationId,
      'Only Blue Team defenders or Administrators can update finding remediation state.'
    );
    return;
  }

  const finding = bayoraEngine.findings.find(
    (f) => f.id === req.params.findingId && f.tenant_id === principal.tenant_id
  );
  if (!finding) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Finding not found.' } });
    return;
  }

  const { status, remediation_notes, assigned_owner } = req.body;

  if (status === 'Verified') {
    res.status(400).json({
      error: {
        code: 'VERIFICATION_RUN_REQUIRED',
        message:
          'A finding cannot be marked as Verified manually. Execute a bounded Verification Run against the updated Blue Policy to prove remediation.',
      },
    });
    return;
  }

  if (status) finding.status = status;
  if (remediation_notes !== undefined) finding.remediation_notes = String(remediation_notes);
  if (assigned_owner !== undefined) finding.assigned_owner = String(assigned_owner);
  finding.updated_at = new Date().toISOString();

  bayoraEngine.appendAuditEvent({
    tenant_id: principal.tenant_id,
    run_id: finding.run_id,
    actor_id: principal.id,
    actor_name: principal.name,
    actor_role: principal.role,
    event_type: 'FINDING_STATUS_UPDATED',
    resource_type: 'finding',
    resource_id: finding.id,
    outcome: 'SUCCESS',
    minimized_payload: {
      finding_id: finding.id,
      new_status: finding.status,
      assigned_owner: finding.assigned_owner,
    },
  });

  res.json({ finding });
});

app.post('/api/v1/findings/:findingId/verify-run', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  if (principal.role !== 'blue_team' && principal.role !== 'red_team' && principal.role !== 'admin') {
    sendAccessDenied(res, req.correlationId);
    return;
  }

  const finding = bayoraEngine.findings.find(
    (f) => f.id === req.params.findingId && f.tenant_id === principal.tenant_id
  );
  if (!finding) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Finding not found.' } });
    return;
  }

  const activePolicy =
    bayoraEngine.bluePolicies.find((p) => p.enabled && p.tenant_id === principal.tenant_id) ||
    bayoraEngine.bluePolicies[1];

  const hardenedCampaign =
    bayoraEngine.campaigns.find((c) => c.id === 'camp-hardened-verify') || bayoraEngine.campaigns[0];
  hardenedCampaign.active_policy_id = activePolicy.id;
  hardenedCampaign.active_policy_version = activePolicy.policy_version;

  const verificationRun = bayoraEngine.executeRunInternal(
    hardenedCampaign,
    principal,
    undefined,
    undefined,
    { isVerification: true, findingId: finding.id }
  );

  if (verificationRun.failed_tests === 0) {
    finding.status = 'Verified';
    finding.verified_by_run_id = verificationRun.id;
    finding.remediation_notes = `Verified fixed by Run ${verificationRun.id} in fresh session ${verificationRun.session_id} under Blue Policy v${activePolicy.policy_version}.`;
    finding.updated_at = new Date().toISOString();

    bayoraEngine.appendAuditEvent({
      tenant_id: principal.tenant_id,
      run_id: verificationRun.id,
      actor_id: principal.id,
      actor_name: principal.name,
      actor_role: principal.role,
      event_type: 'FINDING_VERIFIED_BY_RUN',
      resource_type: 'finding',
      resource_id: finding.id,
      outcome: 'SUCCESS',
      minimized_payload: {
        finding_id: finding.id,
        verification_run_id: verificationRun.id,
        session_id: verificationRun.session_id,
        policy_version: activePolicy.policy_version,
        evidence_root_hash: verificationRun.evidence_root_hash,
      },
    });

    bayoraEngine.addNotification({
      type: 'COMPLETED',
      title: `Finding ${finding.id} Successfully Verified!`,
      message: `Verified zero leakage in fresh session ${verificationRun.session_id} under Blue Policy v${activePolicy.policy_version}. Security Posture updated.`,
      action_label: 'View Finding',
      target_tab: 'blue-vault',
      related_id: finding.id,
      severity: 'info',
    });
  }

  res.json({ finding, verification_run: verificationRun });
});

// ============================================================================
// AUDIT HASH-CHAIN & TAMPER SIMULATION
// ============================================================================
app.get('/api/v1/audit/events', (_req: AuthenticatedRequest, res: Response) => {
  const verification = bayoraEngine.verifyAuditChain();
  res.json({
    events: [...bayoraEngine.auditEvents].reverse(),
    verification,
  });
});

app.post('/api/v1/audit/verify', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  const verification = bayoraEngine.verifyAuditChain();

  if (verification.verified && !bayoraEngine.tamperSimulationActive) {
    bayoraEngine.appendAuditEvent({
      tenant_id: principal.tenant_id,
      run_id: null,
      actor_id: principal.id,
      actor_name: principal.name,
      actor_role: principal.role,
      event_type: 'AUDIT_CHAIN_VERIFIED',
      resource_type: 'audit_chain',
      resource_id: `chain-len-${bayoraEngine.auditEvents.length}`,
      outcome: 'SUCCESS',
      minimized_payload: {
        checked_events: verification.checked_events,
        latest_checkpoint_hash: verification.latest_checkpoint_hash,
      },
    });
  }

  res.json({ verification: bayoraEngine.verifyAuditChain() });
});

app.post('/api/v1/audit/simulate-tamper', (req: AuthenticatedRequest, res: Response) => {
  const { mutation_type } = req.body;
  const verification = bayoraEngine.simulateTamper(
    mutation_type === 'delete_event' ? 'delete_event' : 'modify_payload'
  );
  res.json({
    message:
      'Simulated unauthorized mutation in disposable audit store. Hash-chain verification now detects mismatch.',
    verification,
    events: [...bayoraEngine.auditEvents].reverse(),
  });
});

app.post('/api/v1/audit/restore-clean', (_req: AuthenticatedRequest, res: Response) => {
  const verification = bayoraEngine.restoreCleanAuditChain();
  res.json({
    message: 'Restored canonical untampered audit hash chain.',
    verification,
    events: [...bayoraEngine.auditEvents].reverse(),
  });
});

app.post('/api/v1/audit/bulk-delete', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  if (principal.role !== 'admin') {
    sendAccessDenied(res, req.correlationId, 'Bulk audit event deletion requires administrative privileges (role: admin).');
    return;
  }

  const { event_ids, tag } = req.body;
  if (!Array.isArray(event_ids) || event_ids.length === 0) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'An array of event_ids is required.' } });
    return;
  }

  try {
    const result = bayoraEngine.bulkDeleteAndRechainAuditEvents(
      principal,
      event_ids,
      tag || 'AUTHORIZED_ADMIN_PURGE'
    );
    res.json({
      message: `Successfully purged ${result.deleted_count} audit events in transaction. Merkle hash chain updated and verified.`,
      deleted_count: result.deleted_count,
      remaining_events_count: result.remaining_events_count,
      verification: result.verification,
      events: [...result.events].reverse(),
    });
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// ============================================================================
// AUTOMATED WORKFLOWS & CLOUD SCALING
// ============================================================================
app.get('/api/v1/workflows', (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    workflows: bayoraEngine.workflows,
    cloud_nodes: bayoraEngine.cloudNodes,
  });
});

app.post('/api/v1/workflows/:workflowId/toggle', (req: AuthenticatedRequest, res: Response) => {
  const wf = bayoraEngine.workflows.find((w) => w.id === req.params.workflowId);
  if (!wf) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Workflow rule not found.' } });
    return;
  }
  wf.enabled = !wf.enabled;

  bayoraEngine.addNotification({
    type: 'COMPLETED',
    title: `Workflow ${wf.name} ${wf.enabled ? 'Enabled' : 'Paused'}`,
    message: `Rule state updated. Trigger: ${wf.trigger}.`,
    action_label: 'View Workflows',
    target_tab: 'workflows',
    severity: 'info',
  });

  res.json({ workflow: wf });
});

app.post('/api/v1/cloud/scale-burst', (req: AuthenticatedRequest, res: Response) => {
  const principal = req.principal!;
  const newNodeId = `runner-sandbox-0${bayoraEngine.cloudNodes.length + 1}`;
  const newNode = {
    node_id: newNodeId,
    region: 'asia-south1-c (Auto-Scale Ephemeral Pool)',
    runtime: 'rootless-containerd (seccomp: strict, uid: 10001)',
    status: 'Active' as const,
    active_session_id: `sess_${crypto.randomBytes(6).toString('hex')}`,
    cpu_usage_pct: 22,
    memory_used_mb: 128,
    memory_limit_mb: 512,
    pids_active: 8,
    pids_limit: 64,
    kv_cache_state: 'Flushed Clean' as const,
    egress_policy: 'Strict Allowlist (Model Adapter Only)' as const,
  };
  bayoraEngine.cloudNodes.push(newNode);

  bayoraEngine.appendAuditEvent({
    tenant_id: principal.tenant_id,
    run_id: null,
    actor_id: principal.id,
    actor_name: principal.name,
    actor_role: principal.role,
    event_type: 'SANDBOX_RUNNER_SCALED_OUT',
    resource_type: 'cloud_runner_pool',
    resource_id: newNodeId,
    outcome: 'SUCCESS',
    minimized_payload: {
      node_id: newNodeId,
      memory_limit_mb: 512,
      non_root_uid: 10001,
      docker_socket_mounted: false,
    },
  });

  bayoraEngine.addNotification({
    type: 'COMPLETED',
    title: `Worker Node ${newNodeId} Provisioned`,
    message: 'Rootless container worker joined isolated VPC pool with 512 MB memory limit and non-root execution.',
    action_label: 'Inspect Cloud Pool',
    target_tab: 'workflows',
    severity: 'info',
  });

  res.status(201).json({ cloud_nodes: bayoraEngine.cloudNodes });
});

app.post('/api/v1/demo/reset', (_req: AuthenticatedRequest, res: Response) => {
  bayoraEngine.seedInitialState();
  res.json({
    status: 'reset_complete',
    message: 'Bayora environment restored to clean seeded state.',
  });
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bayora Zero-Trust AI Crash Test Lab running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
