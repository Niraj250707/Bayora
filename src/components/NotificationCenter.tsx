import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Check,
  Trash2,
  X,
  Play,
} from 'lucide-react';
import { NotificationItem } from '../types/bayora';
import { apiClient } from '../lib/apiClient';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onNavigateTab: (tab: string) => void;
  onRefreshNotifications: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onNavigateTab,
  onRefreshNotifications,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTION_REQUIRED' | 'COMPLETED'>('ALL');
  const [triggering, setTriggering] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const actionRequiredCount = notifications.filter((n) => n.type === 'ACTION_REQUIRED').length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'ACTION_REQUIRED') return n.type === 'ACTION_REQUIRED';
    if (filter === 'COMPLETED') return n.type === 'COMPLETED';
    return true;
  });

  const handleMarkAsRead = async (id: string) => {
    await apiClient.markNotificationRead(id);
    onRefreshNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await apiClient.markAllNotificationsRead();
    onRefreshNotifications();
  };

  const handleClearRead = async () => {
    await apiClient.clearNotifications();
    onRefreshNotifications();
  };

  const handleNotificationAction = async (notif: NotificationItem) => {
    if (!notif.read) {
      await apiClient.markNotificationRead(notif.id);
      onRefreshNotifications();
    }
    if (notif.target_tab) {
      onNavigateTab(notif.target_tab);
      setIsOpen(false);
    }
  };

  const handleTriggerDemoAlert = async (type: 'ACTION_REQUIRED' | 'COMPLETED') => {
    setTriggering(true);
    try {
      if (type === 'ACTION_REQUIRED') {
        await apiClient.triggerDemoNotification({
          type: 'ACTION_REQUIRED',
          title: 'Manual Intervention Required: Policy Rule Signature',
          message:
            'Workflow wf-auto-quarantine quarantined an indirect injection attempt. Blue Team signature required to activate rule-delimiter-guard v2.1.',
          action_label: 'Review in Blue Vault',
          target_tab: 'blue-vault',
        });
      } else {
        await apiClient.triggerDemoNotification({
          type: 'COMPLETED',
          title: 'Automated Runner Health Check Passed',
          message:
            'Ephemeral runner pool node runner-sandbox-01 finished scheduled cgroup audit. 100% memory caps respected.',
          action_label: 'Inspect Cloud Pool',
          target_tab: 'workflows',
        });
      }
      onRefreshNotifications();
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400"
        title="Automated Workflow Notifications & Alerts"
        aria-label="Workflow Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-sky-500 text-slate-950 rounded-full tabular-nums shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown / Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 sm:w-[420px] max-w-[90vw] z-50 border border-slate-800 bg-[#111622] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">Workflow Notifications</h3>
                {unreadCount > 0 && (
                  <span className="font-mono text-xs text-sky-400 tabular-nums">
                    ({unreadCount} unread)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Automated task completions & manual intervention alerts
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter segment tabs */}
          <div className="px-4 py-2 border-b border-slate-800/80 bg-[#0B0F17]/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filter === 'ALL'
                    ? 'bg-slate-800 text-slate-100 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('ACTION_REQUIRED')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filter === 'ACTION_REQUIRED'
                    ? 'bg-amber-950/40 text-amber-300 font-medium border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Action Required ({actionRequiredCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('COMPLETED')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filter === 'COMPLETED'
                    ? 'bg-slate-800 text-slate-100 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Completed
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark read</span>
                </button>
              )}
            </div>
          </div>

          {/* Notification Items List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No notifications in this view.
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 transition-colors space-y-2 ${
                    !n.read ? 'bg-slate-800/25' : 'hover:bg-slate-800/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {n.type === 'ACTION_REQUIRED' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : n.type === 'SECURITY_ALERT' ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-100">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                      </div>
                    </div>

                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                    <span className="font-mono tabular-nums">
                      {new Date(n.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>

                    {n.action_label && (
                      <button
                        type="button"
                        onClick={() => handleNotificationAction(n)}
                        className="text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1"
                      >
                        <span>{n.action_label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Trigger Demo Alerts Footer */}
          <div className="p-3 bg-[#0B0F17] border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">Simulate Workflow Alert:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={triggering}
                onClick={() => handleTriggerDemoAlert('ACTION_REQUIRED')}
                className="px-2 py-1 text-[11px] font-medium bg-amber-950/40 text-amber-300 border border-amber-500/30 rounded hover:bg-amber-950/60 transition-colors"
              >
                + Manual Action Alert
              </button>
              <button
                type="button"
                disabled={triggering}
                onClick={() => handleTriggerDemoAlert('COMPLETED')}
                className="px-2 py-1 text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded hover:bg-slate-700 transition-colors"
              >
                + Completed Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
