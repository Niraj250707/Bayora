import React, { useEffect, useState } from 'react';
import { 
  Shield, Terminal, Lock, Layers, Activity, FileText, 
  Users, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw,
  ExternalLink, Sparkles, LogIn, LogOut
} from 'lucide-react';
import { 
  AuditEvent, AuditVerificationResult, DashboardMetrics, Finding, 
  NotificationItem, Role, TestRun, UserPrincipal, WorkflowAutomationRule, CloudSandboxNode 
} from './types/bayora';
import { apiClient, setActivePrincipalId } from './lib/apiClient';
import { NotificationCenter } from './components/NotificationCenter';
import { OverviewDashboard } from './components/OverviewDashboard';
import { RedTeamWorkspace } from './components/RedTeamWorkspace';
import { BlueTeamWorkspace } from './components/BlueTeamWorkspace';
import { AuditEvidenceCenter } from './components/AuditEvidenceCenter';
import { WorkflowsAndCloudView } from './components/WorkflowsAndCloudView';
import { JudgeVerificationConsole } from './components/JudgeVerificationConsole';
import { RunDetailView } from './components/RunDetailView';
import { LandingPage } from './components/LandingPage';
import { AuthRoleModal } from './components/AuthRoleModal';
import { SignInPage } from './components/SignInPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [previousTab, setPreviousTab] = useState<string>('overview');
  
  // Data state
  const [principals, setPrincipals] = useState<UserPrincipal[]>([]);
  const [currentPrincipal, setCurrentPrincipal] = useState<UserPrincipal | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [recentRuns, setRecentRuns] = useState<TestRun[]>([]);
  const [recentFindings, setRecentFindings] = useState<Finding[]>([]);
  const [recentAuditEvents, setRecentAuditEvents] = useState<AuditEvent[]>([]);
  const [auditVerification, setAuditVerification] = useState<AuditVerificationResult | null>(null);
  const [workflowRules, setWorkflowRules] = useState<WorkflowAutomationRule[]>([]);
  const [cloudNodes, setCloudNodes] = useState<CloudSandboxNode[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);

  // Modals & UI controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Initial Load
  const loadAllData = async (preferredPrincipalId?: string) => {
    try {
      setIsLoading(true);
      setApiError(null);

      // 1. Fetch Principals
      const principalsRes = await apiClient.getPrincipals();
      setPrincipals(principalsRes.principals);

      const targetId = preferredPrincipalId || principalsRes.principals[0]?.id;
      const targetUser = principalsRes.principals.find(p => p.id === targetId) || principalsRes.principals[0];
      if (targetUser) {
        setCurrentPrincipal(targetUser);
        setActivePrincipalId(targetUser.id);
      }

      // 2. Fetch Dashboard & Metrics
      const dashRes = await apiClient.getDashboard();
      setDashboardMetrics(dashRes.metrics);
      setRecentRuns(dashRes.recent_runs);
      setRecentFindings(dashRes.recent_findings);
      setRecentAuditEvents(dashRes.recent_audit_events);

      // 3. Fetch Audit Evidence
      const auditRes = await apiClient.getAuditEvents();
      setAuditVerification(auditRes.verification);

      // 4. Fetch Workflows & Cloud Nodes
      const wfRes = await apiClient.getWorkflows();
      setWorkflowRules(wfRes.workflows);
      setCloudNodes(wfRes.cloud_nodes);

      // 5. Fetch Notifications
      const notifRes = await apiClient.getNotifications();
      setNotifications(notifRes.notifications);

    } catch (err: any) {
      console.error('Failed to load Bayora data:', err);
      setApiError(err.message || 'Failed to connect to Bayora secure engine');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const refreshNotifications = async () => {
    try {
      const res = await apiClient.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error('Error updating notifications:', err);
    }
  };

  const handleSelectUser = (user: UserPrincipal) => {
    setCurrentPrincipal(user);
    setActivePrincipalId(user.id);
    loadAllData(user.id);
  };

  const handleSignIn = (user: UserPrincipal) => {
    handleSelectUser(user);
    setActiveTab('overview');
  };

  const handleSignOut = () => {
    setActiveTab('signin');
  };

  const handleSwitchRole = (role: Role) => {
    const matching = principals.find(p => p.role === role);
    if (matching) {
      handleSelectUser(matching);
    }
  };

  const handleNavigateTab = (tab: string) => {
    setPreviousTab(activeTab);
    setActiveTab(tab);
    if (tab !== 'run_detail') {
      setSelectedRun(null);
    }
  };

  const handleSelectRun = async (runId: string) => {
    try {
      const res = await apiClient.getRunById(runId);
      setSelectedRun(res.run);
      setActiveTab('run_detail');
    } catch (err: any) {
      console.error('Failed to fetch run details:', err);
    }
  };

  // If in Sign In Mode
  if (activeTab === 'signin') {
    return (
      <SignInPage
        users={principals}
        onSignIn={handleSignIn}
        onUserRegistered={(newUser) => {
          setPrincipals((prev) => [...prev.filter((p) => p.id !== newUser.id), newUser]);
        }}
      />
    );
  }

  // If in Landing Mode
  if (activeTab === 'landing') {
    return (
      <div className="relative">
        {/* Quick Sign In button floating at top right */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('signin')}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-lg shadow-sky-500/20 flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In to Platform</span>
          </button>
        </div>

        <LandingPage
          onEnterLab={(initialTab, principalId) => {
            if (principalId) {
              const chosen = principals.find(p => p.id === principalId);
              if (chosen) {
                setCurrentPrincipal(chosen);
                setActivePrincipalId(chosen.id);
              }
            }
            setActiveTab(initialTab || 'overview');
          }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Top Banner & Navigation Header */}
      <header className="border-b border-neutral-800 bg-[#0f141e]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Challenge Badge */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => handleNavigateTab('overview')}
                className="flex items-center space-x-2 text-left group"
              >
                <div className="w-8 h-8 bg-neutral-900 border border-neutral-700 flex items-center justify-center font-mono font-black text-white text-sm group-hover:border-neutral-500 transition-colors">
                  B
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold tracking-tight text-white text-base">BAYORA</span>
                    <span className="px-1.5 py-0.2 bg-neutral-800 border border-neutral-700 text-[10px] font-mono text-neutral-300 font-semibold uppercase">
                      Lab v2.4
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400">
                    AI Crash Test Lab & Continuous Red Teaming
                  </div>
                </div>
              </button>

              <div className="hidden lg:block h-6 w-px bg-neutral-800" />

              {/* Navigation Tabs */}
              <nav className="hidden md:flex items-center space-x-1">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'red-vault', label: 'Red Vault' },
                  { id: 'blue-vault', label: 'Blue Vault' },
                  { id: 'audit', label: 'Audit Chain & Verifier' },
                  { id: 'workflows', label: 'Workflows & Cloud' },
                  { id: 'judge_demo', label: 'Judge Verification', highlight: true },
                ].map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleNavigateTab(tab.id)}
                      className={`px-3 py-1.5 text-xs font-mono font-medium transition-all ${
                        isActive
                          ? 'border border-neutral-600 bg-neutral-800 text-white font-semibold'
                          : tab.highlight
                          ? 'border border-blue-900/60 bg-blue-950/40 text-blue-300 hover:bg-blue-900/50'
                          : 'border border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right Tools: Notification Center, Persona Switcher, Sign Out */}
            <div className="flex items-center space-x-3">
              {/* Notification Center */}
              <NotificationCenter
                notifications={notifications}
                onNavigateTab={handleNavigateTab}
                onRefreshNotifications={refreshNotifications}
              />

              {/* Persona / RBAC Switcher */}
              {currentPrincipal && (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-2 px-2.5 py-1.5 border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-left transition-colors"
                  title="Click to switch simulated principal and test RBAC"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-white leading-none font-mono">
                      {currentPrincipal.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mt-0.5">
                      {currentPrincipal.role}
                    </div>
                  </div>
                  <Users className="w-3.5 h-3.5 text-neutral-400 ml-1" />
                </button>
              )}

              {/* Sign In / Sign Out Toggle */}
              <button
                onClick={handleSignOut}
                className="px-2.5 py-1.5 border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono flex items-center space-x-1.5 transition-colors"
                title="Switch persona or sign in as different user"
              >
                <LogOut className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden sm:inline">Sign In / Switch</span>
              </button>

              {/* Hackathon Docs & Brief Link */}
              <button
                onClick={() => setActiveTab('landing')}
                className="px-2.5 py-1.5 border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono flex items-center space-x-1.5 transition-colors"
                title="View Hackathon Submission Docs, Problem Statement, and Pitch"
              >
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden sm:inline">Brief</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="md:hidden flex overflow-x-auto border-t border-neutral-800 px-2 py-1 space-x-1 bg-neutral-950">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'red-vault', label: 'Red Vault' },
            { id: 'blue-vault', label: 'Blue Vault' },
            { id: 'audit', label: 'Audit Chain' },
            { id: 'workflows', label: 'Workflows' },
            { id: 'judge_demo', label: 'Judge Demo' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleNavigateTab(tab.id)}
              className={`px-2.5 py-1 text-[11px] font-mono whitespace-nowrap ${
                activeTab === tab.id ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {apiError && (
          <div className="mb-6 p-4 border border-red-800 bg-red-950/50 text-red-300 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={() => loadAllData()}
              className="px-2 py-1 bg-red-900 hover:bg-red-800 text-white font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* View Switcher */}
        {activeTab === 'overview' && dashboardMetrics && currentPrincipal && (
          <OverviewDashboard
            principal={currentPrincipal}
            metrics={dashboardMetrics}
            recentRuns={recentRuns}
            recentFindings={recentFindings}
            recentAuditEvents={recentAuditEvents}
            onNavigateTab={handleNavigateTab}
            onSelectRun={handleSelectRun}
            onRefreshData={loadAllData}
          />
        )}

        {(activeTab === 'red-vault' || activeTab === 'red_team') && currentPrincipal && (
          <RedTeamWorkspace
            principal={currentPrincipal}
            onSwitchRole={handleSwitchRole}
            onSelectRun={handleSelectRun}
            onDataMutated={loadAllData}
          />
        )}

        {(activeTab === 'blue-vault' || activeTab === 'blue_team') && currentPrincipal && (
          <BlueTeamWorkspace
            principal={currentPrincipal}
            onSwitchRole={handleSwitchRole}
            onSelectRun={handleSelectRun}
            onDataMutated={loadAllData}
          />
        )}

        {activeTab === 'audit' && currentPrincipal && (
          <AuditEvidenceCenter
            events={recentAuditEvents}
            verification={auditVerification}
            onRefresh={loadAllData}
            userRole={currentPrincipal.role}
          />
        )}

        {activeTab === 'workflows' && (
          <WorkflowsAndCloudView
            workflowRules={workflowRules}
            cloudNodes={cloudNodes}
            onTriggerRule={() => {
              loadAllData();
            }}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'judge_demo' && (
          <JudgeVerificationConsole
            onDataMutated={loadAllData}
          />
        )}

        {activeTab === 'run_detail' && selectedRun && (
          <RunDetailView
            run={selectedRun}
            onBack={() => handleNavigateTab(previousTab || 'overview')}
            onRerun={(runId) => {
              apiClient.startRun(selectedRun.campaign_id).then(res => {
                setSelectedRun(res.run);
                loadAllData();
              });
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 mt-12 text-xs font-mono text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-neutral-300">BAYORA</span>
            <span>·</span>
            <span>Continuous Adversarial AI Lab</span>
            <span>·</span>
            <span>Cryptographic Merkle Attestation</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Security Posture: {dashboardMetrics?.security_posture?.score ?? 85}/100</span>
            <span>Audit Chain: {dashboardMetrics?.audit_chain_verified ? 'Intact (Verified)' : 'Tamper Detected'}</span>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-neutral-400 hover:text-white underline"
            >
              Simulate Principal ({currentPrincipal?.role || 'Guest'})
            </button>
          </div>
        </div>
      </footer>

      {/* Principal & RBAC Switcher Modal */}
      {isAuthModalOpen && currentPrincipal && (
        <AuthRoleModal
          currentUser={currentPrincipal}
          users={principals}
          onSelectUser={handleSelectUser}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </div>
  );
}
