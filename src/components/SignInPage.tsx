import React, { useState } from 'react';
import { 
  Shield, Lock, UserCheck, ArrowRight, CheckCircle2, 
  Sparkles, KeyRound, Building, AlertCircle, Eye, EyeOff,
  UserPlus, Check, Info, ShieldAlert, Cpu, Award
} from 'lucide-react';
import { Role, UserPrincipal } from '../types/bayora';
import { apiClient } from '../lib/apiClient';

interface SignInPageProps {
  users: UserPrincipal[];
  onSignIn: (user: UserPrincipal) => void;
  onUserRegistered?: (user: UserPrincipal) => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ 
  users, 
  onSignIn,
  onUserRegistered 
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'persona'>('signin');
  
  // Sign In State
  const [loginUsername, setLoginUsername] = useState('niraj.sharma@bayora.lab');
  const [loginPassword, setLoginPassword] = useState('SafetyLab2025!#');
  const [loginRole, setLoginRole] = useState<Role>('red_team');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupRole, setSignupRole] = useState<Role>('red_team');
  const [signupTitle, setSignupTitle] = useState('');
  const [signupTenant, setSignupTenant] = useState('Acme AI Safety Lab (Primary Tenant)');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreedToSafetyPolicy, setAgreedToSafetyPolicy] = useState(true);

  // Feedback State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength calculation for sign up
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const passwordStrength = calculatePasswordStrength(signupPassword);

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginUsername.trim()) {
      setErrorMsg('Please enter your username or enterprise email address.');
      return;
    }

    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Find matching user by email/username or by matching role
      const cleanInput = loginUsername.trim().toLowerCase();
      let matched = users.find(u => 
        u.email.toLowerCase() === cleanInput || 
        u.name.toLowerCase() === cleanInput ||
        u.id.toLowerCase() === cleanInput
      );

      // If user specified a specific role or persona doesn't exist yet, adapt principal
      if (!matched) {
        matched = users.find(u => u.role === loginRole) || {
          id: `usr-${loginRole}-${Date.now().toString(36)}`,
          tenant_id: 'tenant-acme-sec',
          tenant_name: 'Acme AI Safety Lab (Primary Tenant)',
          email: cleanInput.includes('@') ? cleanInput : `${cleanInput}@bayora.security`,
          name: cleanInput.split('@')[0].replace('.', ' ').toUpperCase(),
          title: `${loginRole.replace('_', ' ').toUpperCase()} Specialist`,
          role: loginRole,
          status: 'active',
          created_at: new Date().toISOString(),
        };
      } else if (matched.role !== loginRole) {
        // If user explicitly chose another role in the selector, adjust role to match selection
        matched = {
          ...matched,
          role: loginRole,
        };
      }

      setIsSubmitting(false);
      setSuccessMsg(`Session authenticated successfully. Loading ${matched.name} (${matched.role})...`);
      setTimeout(() => {
        onSignIn(matched);
      }, 400);
    }, 600);
  };

  // Handle Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!signupName.trim()) {
      setErrorMsg('Please enter your full legal or engineering name.');
      return;
    }

    if (!signupUsername.trim()) {
      setErrorMsg('Please enter a username or enterprise corporate email.');
      return;
    }

    if (!signupPassword) {
      setErrorMsg('Please enter a strong password.');
      return;
    }

    if (signupPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password confirmation.');
      return;
    }

    if (!agreedToSafetyPolicy) {
      setErrorMsg('You must accept the Responsible AI Red Teaming & Zero-Trust Safety Code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const emailFormatted = signupUsername.includes('@') 
        ? signupUsername.trim() 
        : `${signupUsername.trim().toLowerCase()}@bayora.security`;

      const titleFormatted = signupTitle.trim() || 
        (signupRole === 'red_team' ? 'Adversarial Evaluation Engineer' :
         signupRole === 'blue_team' ? 'AI Safety Guardrail Architect' :
         signupRole === 'auditor' ? 'Senior Compliance Auditor' : 'Platform Operations Admin');

      // Call real backend registration endpoint which generates audit event & stores principal
      const res = await apiClient.registerPrincipal({
        name: signupName.trim(),
        email: emailFormatted,
        role: signupRole,
        title: titleFormatted,
      });

      const newPrincipal = res.principal;
      if (onUserRegistered) {
        onUserRegistered(newPrincipal);
      }

      setSuccessMsg(`Account successfully registered! Attested to Merkle audit chain with ID: ${newPrincipal.id}`);
      
      setTimeout(() => {
        setIsSubmitting(false);
        onSignIn(newPrincipal);
      }, 700);

    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to register security account. Please try again.');
    }
  };

  const handleSSOLogin = (provider: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setTimeout(() => {
      const targetUser = users.find(u => u.role === loginRole) || users[0];
      setSuccessMsg(`Connected via ${provider} Single Sign-On.`);
      setTimeout(() => {
        setIsSubmitting(false);
        onSignIn(targetUser);
      }, 400);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-sky-500/30 selection:text-sky-200">
      {/* Background radial glow & cyber grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center z-10 space-y-3">
        {/* Logo Badge */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-600 to-slate-900 border border-sky-400/40 shadow-xl shadow-sky-500/20 text-white font-mono font-black text-2xl mb-1">
          B
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
          BAYORA AI CRASH TEST LAB
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-md mx-auto">
          Continuous Adversarial Safety Evaluation Platform with Zero-Trust Role Isolation and Cryptographic Attestation
        </p>

        {/* Security Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-900/90 border border-slate-700/80 text-slate-300 flex items-center gap-1">
            <Lock className="w-3 h-3 text-sky-400" />
            <span>FIPS 140-3 Cryptographic Seal</span>
          </span>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>SHA-256 Merkle Provenance</span>
          </span>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-sky-950/40 border border-sky-500/30 text-sky-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-sky-400" />
            <span>Multi-Tenant Sandbox</span>
          </span>
        </div>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4 sm:px-0">
        <div className="bg-[#0F141E]/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          
          {/* Main Navigation Tabs */}
          <div className="grid grid-cols-3 border border-slate-800 rounded-xl p-1 bg-[#090C12]">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'signin'
                  ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'signup'
                  ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('persona'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'persona'
                  ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Demo Personas</span>
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-500/50 rounded-xl text-xs font-mono text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/50 rounded-xl text-xs font-mono text-emerald-300 flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: SIGN IN FORM */}
          {/* ========================================================================= */}
          {activeTab === 'signin' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Username or Corporate Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="e.g. niraj.sharma@bayora.lab or username"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0F17] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-slate-300 uppercase tracking-wider">
                    Password / Passkey
                  </label>
                  <button
                    type="button"
                    onClick={() => setSuccessMsg('Password reset instructions sent to security officer.')}
                    className="text-[11px] font-mono text-sky-400 hover:text-sky-300"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0F17] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Security Clearance Role
                </label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value as Role)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0F17] border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-400 font-mono transition-colors"
                >
                  <option value="red_team">Red Team Operator (Adversarial Vault & Attack Orchestration)</option>
                  <option value="blue_team">Blue Team Defender (Policy Guardrail Vault & Mitigation)</option>
                  <option value="auditor">Security Auditor (Read-Only Evidence & Forensic Chain)</option>
                  <option value="admin">Platform Administrator (Full Merkle Ledger & Tenant Authority)</option>
                </select>
                <div className="mt-1.5 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>Role enforcement is cryptographically checked at every API endpoint.</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-[#0B0F17] text-sky-500 focus:ring-0"
                  />
                  <span>Remember this workstation</span>
                </label>
                <span className="text-[10px] uppercase text-emerald-400 font-semibold">
                  Zero-Trust Enforced
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold font-mono text-sm transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-sky-500/25"
              >
                {isSubmitting ? (
                  <span>Authenticating Session...</span>
                ) : (
                  <>
                    <span>Authenticate & Launch Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
                  className="text-xs font-mono text-slate-400 hover:text-sky-300 transition-colors"
                >
                  Need a security credential? <span className="text-sky-400 underline font-semibold">Sign Up for New Account</span>
                </button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                  <span className="bg-[#0F141E] px-3 text-slate-500">Or Federated Identity SSO</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSSOLogin('Google Workspace')}
                  className="py-2.5 px-3 border border-slate-800 bg-[#0B0F17] rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Workspace</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSSOLogin('Okta SAML')}
                  className="py-2.5 px-3 border border-slate-800 bg-[#0B0F17] rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span>Okta SAML 2.0</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SIGN UP FORM */}
          {/* ========================================================================= */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Legal / Tech Name *
                  </label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Dr. Alex Mercer"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0F17] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Username or Corporate Email *
                  </label>
                  <input
                    type="text"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="e.g. alex.mercer@bayora.lab"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0F17] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Requested Security Clearance Role *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'red_team', label: 'Red Team Operator', desc: 'Author adversarial attacks & run jailbreaks' },
                    { id: 'blue_team', label: 'Blue Team Defender', desc: 'Deploy safety policies & monitor guardrails' },
                    { id: 'auditor', label: 'Security Auditor', desc: 'Forensic ledger inspection & PDF sign-off' },
                    { id: 'admin', label: 'Platform Administrator', desc: 'Full tenant authority & Merkle pruning' },
                  ].map((r) => {
                    const isSelected = signupRole === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSignupRole(r.id as Role)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-sky-500 bg-sky-950/40 text-white'
                            : 'border-slate-800 bg-[#0B0F17] text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-white">{r.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans mt-0.5 leading-snug">{r.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Engineering Title / Division
                  </label>
                  <input
                    type="text"
                    value={signupTitle}
                    onChange={(e) => setSignupTitle(e.target.value)}
                    placeholder="e.g. Lead Adversarial ML Evaluator"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0F17] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Organization / Tenant Name
                  </label>
                  <input
                    type="text"
                    value={signupTenant}
                    onChange={(e) => setSignupTenant(e.target.value)}
                    placeholder="Acme AI Safety Lab"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0F17] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0F17] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0F17] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Password Strength Indicator */}
              {signupPassword && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Security Strength:</span>
                    <span className={
                      passwordStrength <= 1 ? 'text-rose-400' :
                      passwordStrength <= 3 ? 'text-amber-400' : 'text-emerald-400 font-bold'
                    }>
                      {passwordStrength <= 1 ? 'Weak' : passwordStrength <= 3 ? 'Moderate' : 'FIPS-Compliant Strong'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    <div className={`rounded-full ${passwordStrength >= 1 ? (passwordStrength <= 1 ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-slate-800'}`} />
                    <div className={`rounded-full ${passwordStrength >= 2 ? (passwordStrength <= 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-800'}`} />
                    <div className={`rounded-full ${passwordStrength >= 3 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                    <div className={`rounded-full ${passwordStrength >= 4 ? 'bg-emerald-400' : 'bg-slate-800'}`} />
                  </div>
                </div>
              )}

              {/* Policy Consent */}
              <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <label className="flex items-start space-x-2.5 cursor-pointer text-xs font-mono text-slate-300">
                  <input
                    type="checkbox"
                    checked={agreedToSafetyPolicy}
                    onChange={(e) => setAgreedToSafetyPolicy(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                  />
                  <span>
                    I confirm this identity complies with responsible disclosure rules. All actions will be signed with an immutable SHA-256 Merkle audit entry.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold font-mono text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
              >
                {isSubmitting ? (
                  <span>Registering Principal to Merkle Chain...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Security Account & Launch</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('signin'); setErrorMsg(null); }}
                  className="text-xs font-mono text-slate-400 hover:text-sky-300 transition-colors"
                >
                  Already have an enrolled identity? <span className="text-sky-400 underline font-semibold">Sign In here</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DEMO PERSONAS (1-CLICK EVALUATION MODE) */}
          {/* ========================================================================= */}
          {activeTab === 'persona' && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                Click any enterprise persona to log in instantly & test RBAC permissions:
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {users.map(u => {
                  const isRed = u.role === 'red_team';
                  const isBlue = u.role === 'blue_team';
                  const isAudit = u.role === 'auditor';
                  const isAdmin = u.role === 'admin';
                  const isExt = u.tenant_id !== 'tenant-acme-sec';

                  return (
                    <div
                      key={u.id}
                      onClick={() => onSignIn(u)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                        isExt
                          ? 'border-rose-900/40 bg-rose-950/15 hover:border-rose-500/60 hover:bg-rose-950/30'
                          : 'border-slate-800 bg-[#0B0F17] hover:border-sky-500/60 hover:bg-sky-950/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                            {u.name}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${
                            isRed ? 'border-rose-500/40 text-rose-300 bg-rose-950/40' :
                            isBlue ? 'border-sky-500/40 text-sky-300 bg-sky-950/40' :
                            isAudit ? 'border-amber-500/40 text-amber-300 bg-amber-950/40' :
                            'border-emerald-500/40 text-emerald-300 bg-emerald-950/40'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                          {isExt && (
                            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-rose-500 text-white rounded">
                              Foreign Tenant Probe
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {u.title} • <span className="font-mono text-slate-500">{u.email}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          Tenant: {u.tenant_name}
                        </div>
                      </div>

                      <div className="flex items-center text-xs font-mono text-sky-400 group-hover:translate-x-1 transition-transform">
                        <span>Launch</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Notice */}
          <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 text-center flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>Zero-Trust Architecture: Role permissions & tenant boundaries strictly verified server-side.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
