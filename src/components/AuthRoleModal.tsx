import React from 'react';
import { Shield, User, X, Check, Lock, Building, Users } from 'lucide-react';
import { UserPrincipal, Role } from '../types/bayora';

interface AuthRoleModalProps {
  currentUser: UserPrincipal;
  users: UserPrincipal[];
  onSelectUser: (user: UserPrincipal) => void;
  onClose: () => void;
}

export const AuthRoleModal: React.FC<AuthRoleModalProps> = ({
  currentUser,
  users,
  onSelectUser,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-neutral-950/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-300 max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-neutral-900" />
            <h2 className="text-base font-bold font-mono text-neutral-950">Switch Active Principal (RBAC Simulation)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-neutral-300 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-600">
          Test role-based access control and multi-tenant isolation. All requests pass the principal's ID via the <code className="bg-neutral-100 px-1 py-0.5 border border-neutral-200 font-mono font-bold text-neutral-800">x-bayora-user-id</code> header, strictly verified by the backend engine with default-deny rules.
        </p>

        {/* User Card List */}
        <div className="space-y-2">
          {users.map(u => {
            const isCurrent = u.id === currentUser.id;
            return (
              <div
                key={u.id}
                onClick={() => {
                  onSelectUser(u);
                  onClose();
                }}
                className={`p-3 border cursor-pointer transition-all ${
                  isCurrent
                    ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50 text-neutral-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs">{u.name}</span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                        isCurrent 
                          ? 'border-neutral-700 bg-neutral-800 text-neutral-200' 
                          : 'border-neutral-300 bg-neutral-100 text-neutral-700'
                      }`}>
                        {u.role}
                      </span>
                      {u.tenant_id !== 'tenant_acme_corp' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border border-red-500 bg-red-100 text-red-900">
                          Cross-Tenant ({u.tenant_id})
                        </span>
                      )}
                    </div>
                    <div className={`text-xs mt-0.5 ${isCurrent ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {u.title} • {u.email}
                    </div>
                  </div>

                  {isCurrent ? (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-emerald-600 text-white flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-neutral-400">Switch →</span>
                  )}
                </div>

                <div className={`mt-2 pt-2 border-t text-[11px] font-mono flex items-center justify-between ${
                  isCurrent ? 'border-neutral-800 text-neutral-400' : 'border-neutral-100 text-neutral-500'
                }`}>
                  <span>Tenant: {u.tenant_name}</span>
                  <span>ID: {u.id}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Access Matrix Legend */}
        <div className="p-3 bg-neutral-50 border border-neutral-200 text-xs font-mono space-y-1.5">
          <div className="font-bold uppercase tracking-wider text-neutral-700 text-[10px]">
            Security Separation of Concerns
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600">
            <div>• Red Team: Can create payloads, cannot edit policies</div>
            <div>• Blue Team: Can patch policies, cannot delete audit</div>
            <div>• Auditor: Read-only evidence & verification check</div>
            <div>• Cross-Tenant: Blocked by 403 on all Acme resources</div>
          </div>
        </div>
      </div>
    </div>
  );
};
