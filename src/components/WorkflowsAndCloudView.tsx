import React, { useState } from 'react';
import { 
  Server, Cpu, Play, CheckCircle2, ShieldAlert, 
  RefreshCw, Terminal, Layers, Plus, Power, Sparkles, Activity
} from 'lucide-react';
import { WorkflowAutomationRule, CloudSandboxNode } from '../types/bayora';
import { D3ResourceMonitor } from './D3ResourceMonitor';

interface WorkflowsAndCloudViewProps {
  workflowRules: WorkflowAutomationRule[];
  cloudNodes: CloudSandboxNode[];
  onTriggerRule?: (ruleId: string) => void;
  onRefresh?: () => void;
}

export const WorkflowsAndCloudView: React.FC<WorkflowsAndCloudViewProps> = ({
  workflowRules,
  cloudNodes,
  onTriggerRule,
  onRefresh
}) => {
  const [rules, setRules] = useState<WorkflowAutomationRule[]>(workflowRules);
  const [executingRuleId, setExecutingRuleId] = useState<string | null>(null);
  const [scaleCount, setScaleCount] = useState<number>(cloudNodes.length);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    setStatusNotice(`Workflow rule updated.`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleRunRule = (id: string) => {
    setExecutingRuleId(id);
    setTimeout(() => {
      setRules(prev => prev.map(r => r.id === id ? { ...r, executions_count: r.executions_count + 1, last_triggered_at: new Date().toISOString() } : r));
      setExecutingRuleId(null);
      if (onTriggerRule) onTriggerRule(id);
      setStatusNotice(`Workflow executed successfully.`);
      setTimeout(() => setStatusNotice(null), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-neutral-950 font-mono tracking-tight">Automated Workflows & Cloud Sandbox</h1>
            <span className="px-2 py-0.5 text-xs font-mono font-bold tracking-wide uppercase border border-emerald-600 bg-emerald-50 text-emerald-800">
              Auto-Scaling v2.4
            </span>
          </div>
          <p className="text-xs text-neutral-600 mt-1">
            Event-driven red/blue test automation pipelines and hardened zero-state ephemeral runner nodes with strict egress allowlists.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-3 py-2 border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        )}
      </div>

      {statusNotice && (
        <div className="p-3 bg-neutral-900 text-neutral-100 text-xs font-mono border border-neutral-800 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* D3.js Real-Time Resource Monitor Panel */}
      <D3ResourceMonitor nodes={cloudNodes} />

      {/* Cloud Sandbox Runners */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-neutral-700" />
            <h2 className="text-sm font-bold font-mono uppercase tracking-wide text-neutral-900">
              Ephemeral Cloud Sandbox Nodes ({cloudNodes.length} Active Pods)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">
            Read-Only RootFS | PID Max 64 | Non-Root UID 10001
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cloudNodes.map(node => (
            <div key={node.node_id} className="p-4 border border-neutral-200 bg-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-xs font-bold text-neutral-900">{node.node_id}</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border border-neutral-300 bg-neutral-50 text-neutral-700">
                  {node.region}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <div className="flex justify-between text-neutral-500 text-[11px] mb-1">
                    <span>CPU Core Utilization</span>
                    <span className="font-bold text-neutral-800">{node.cpu_usage_pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-200 overflow-hidden">
                    <div 
                      className={`h-full ${node.cpu_usage_pct > 70 ? 'bg-amber-600' : 'bg-neutral-900'}`} 
                      style={{ width: `${node.cpu_usage_pct}%` }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-500 text-[11px] mb-1">
                    <span>Memory Usage</span>
                    <span className="font-bold text-neutral-800">{node.memory_used_mb} / {node.memory_limit_mb} MB</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-200 overflow-hidden">
                    <div 
                      className="h-full bg-neutral-900" 
                      style={{ width: `${(node.memory_used_mb / node.memory_limit_mb) * 100}%` }} 
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">PIDs Active:</span>
                  <span className="font-semibold text-neutral-800">{node.pids_active} / {node.pids_limit} max</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">KV Cache State:</span>
                  <span className="font-bold text-emerald-800">{node.kv_cache_state}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">Egress Boundary:</span>
                  <span className="text-[10px] text-neutral-600 truncate max-w-[150px]">{node.egress_policy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Workflows Engine */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-neutral-700" />
            <h2 className="text-sm font-bold font-mono uppercase tracking-wide text-neutral-900">
              Automated Event Pipelines & CI/CD Guardrails ({rules.length})
            </h2>
          </div>
        </div>

        <div className="border border-neutral-200 bg-white divide-y divide-neutral-200">
          {rules.map(rule => (
            <div key={rule.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/60 transition-colors">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-neutral-950 uppercase">{rule.name}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                    rule.enabled 
                      ? 'border-emerald-600 text-emerald-800 bg-emerald-50'
                      : 'border-neutral-300 text-neutral-500 bg-neutral-100'
                  }`}>
                    {rule.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 font-sans">{rule.description}</p>
                <div className="flex items-center space-x-4 text-[11px] font-mono text-neutral-500 pt-1">
                  <span>Trigger: <strong className="text-neutral-800">{rule.trigger}</strong></span>
                  <span>Action: <strong className="text-neutral-800">{rule.action}</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <div className="text-right font-mono text-xs text-neutral-500 mr-2">
                  <div className="font-bold text-neutral-900 tabular-nums">{rule.executions_count} runs</div>
                  <div className="text-[10px] text-neutral-400">
                    {rule.last_triggered_at ? new Date(rule.last_triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleRule(rule.id)}
                  className={`p-2 border transition-colors ${
                    rule.enabled
                      ? 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                      : 'border-neutral-300 text-neutral-400 hover:text-neutral-700'
                  }`}
                  title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                >
                  <Power className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleRunRule(rule.id)}
                  disabled={executingRuleId === rule.id}
                  className="px-3 py-1.5 border border-neutral-900 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${executingRuleId === rule.id ? 'animate-spin' : ''}`} />
                  <span>{executingRuleId === rule.id ? 'Running...' : 'Run Pipeline'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
