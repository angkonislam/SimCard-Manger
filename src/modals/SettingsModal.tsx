import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, User, CheckCircle2, AlertTriangle, UserPlus, Mail, Lock, Shield, Crown, UserCog, Trash2, KeyRound } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { validEmail, minLen } from '../lib/validation';

interface Props {
  onClose: () => void;
}

type Role = 'admin' | 'manager' | 'staff';

interface UserProfile {
  id: string;
  email: string;
  role: Role;
  created_at: string;
}

const ROLES: { value: Role; label: string; desc: string; color: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'admin',   label: 'Admin',   desc: 'Full access — manage users, profit, all data', color: 'from-red-500 to-orange-500',  Icon: Crown   },
  { value: 'manager', label: 'Manager', desc: 'All access except user mgmt + profit section', color: 'from-blue-500 to-indigo-500', Icon: UserCog },
  { value: 'staff',   label: 'Staff',   desc: 'Dashboard, customers, invoice creator only',   color: 'from-emerald-500 to-teal-500', Icon: Shield },
];

const roleStyles: Record<Role, { bg: string; text: string; border: string; gradient: string }> = {
  admin:   { bg: 'bg-red-50 dark:bg-red-500/15',         text: 'text-red-700 dark:text-red-300',         border: 'border-red-200 dark:border-red-500/30',         gradient: 'from-red-500 to-orange-500'     },
  manager: { bg: 'bg-blue-50 dark:bg-blue-500/15',       text: 'text-blue-700 dark:text-blue-300',       border: 'border-blue-200 dark:border-blue-500/30',       gradient: 'from-blue-500 to-indigo-500'    },
  staff:   { bg: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-500/30', gradient: 'from-emerald-500 to-teal-500'   },
};

export function SettingsModal({ onClose }: Props) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Create-user form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('staff');

  const t = useToast();
  const { confirm } = useConfirm();
  const flash = (kind: 'ok' | 'err', text: string) => {
    setMsg({ kind, text });
    if (kind === 'ok') t.success(text); else t.error(text);
    setTimeout(() => setMsg(null), 3500);
  };

  // Load current user + all profiles
  const loadUsers = async () => {
    if (!isSupabaseConfigured) return;
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      setUserEmail(u.user.email ?? null);
      setCurrentUserId(u.user.id);
      setCreatedAt(u.user.created_at ?? null);
    }
    const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: true });
    if (data) {
      setUsers(data as UserProfile[]);
      const me = (data as UserProfile[]).find(p => p.id === u.user?.id);
      setCurrentRole(me?.role ?? null);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async () => {
    if (!isSupabaseConfigured) { flash('err', 'Supabase not configured'); return; }
    const ee = validEmail(newEmail); if (ee) { flash('err', ee); return; }
    const pe = minLen(newPassword, 6, 'Password'); if (pe) { flash('err', pe); return; }
    setBusy('createUser');
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const tempClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const { data, error } = await tempClient.auth.signUp({ email: newEmail.trim(), password: newPassword });
      if (error) throw error;
      if (data.user) {
        // Insert profile
        const { error: pErr } = await supabase.from('user_profiles').insert({
          id: data.user.id,
          email: newEmail.trim(),
          role: newRole,
        });
        if (pErr) console.error('Profile insert failed:', pErr);
      }
      const needsConfirm = data.user && !data.session;
      flash('ok', needsConfirm
        ? `User created with ${newRole} role. Email confirmation required.`
        : `User created with ${newRole} role.`);
      setNewEmail('');
      setNewPassword('');
      setNewRole('staff');
      setShowCreateForm(false);
      await loadUsers();
    } catch (e: any) {
      flash('err', e?.message || 'Failed to create user');
    } finally {
      setBusy(null);
    }
  };

  const changeRole = async (id: string, role: Role) => {
    if (!isSupabaseConfigured) return;
    setBusy(`role-${id}`);
    try {
      const { error } = await supabase.from('user_profiles').update({ role }).eq('id', id);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      if (id === currentUserId) setCurrentRole(role);
      flash('ok', 'Role updated');
    } catch (e: any) {
      flash('err', e?.message || 'Failed to update role');
    } finally {
      setBusy(null);
    }
  };

  const sendPasswordReset = async (id: string, email: string) => {
    if (!isSupabaseConfigured) return;
    const ok = await confirm({
      title: 'Send password reset',
      message: `Send password reset email to ${email}?`,
      confirmText: 'Send',
    });
    if (!ok) return;
    setBusy(`reset-${id}`);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      flash('ok', `Reset email sent to ${email}`);
    } catch (e: any) {
      flash('err', e?.message || 'Failed to send reset email');
    } finally {
      setBusy(null);
    }
  };

  const removeUser = async (id: string, email: string) => {
    if (!isSupabaseConfigured) return;
    if (id === currentUserId) { flash('err', "Can't remove yourself"); return; }
    const ok = await confirm({
      title: 'Remove user',
      message: `Remove access for ${email}? Profile will be deleted, but auth account remains.`,
      confirmText: 'Remove',
      danger: true,
    });
    if (!ok) return;
    setBusy(`del-${id}`);
    try {
      const { error } = await supabase.from('user_profiles').delete().eq('id', id);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== id));
      flash('ok', `Removed ${email}`);
    } catch (e: any) {
      flash('err', e?.message || 'Failed to remove user');
    } finally {
      setBusy(null);
    }
  };

  const myStyle = currentRole ? roleStyles[currentRole] : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Settings" className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] w-[92%] max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-md">
              <SettingsIcon className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-gray-200 tracking-tight">Settings</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Account section */}
          {userEmail && (
            <div>
              <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Account Details</p>
              <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Email</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate">{userEmail}</p>
                  </div>
                  {currentRole && myStyle && (
                    <div className={`px-2.5 py-1 rounded-lg ${myStyle.bg} ${myStyle.border} border`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${myStyle.text}`}>{currentRole}</p>
                    </div>
                  )}
                </div>
                {createdAt && (
                  <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                    <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Member since</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-200">
                      {new Date(createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Management — admin only */}
          {currentRole === 'admin' && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">User Management</p>
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:text-emerald-500 flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" /> New
                </button>
              )}
            </div>

            {/* Create user form */}
            {showCreateForm && (
              <div className="p-3 mb-3 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/30 rounded-xl space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="user@example.com"
                    autoComplete="off"
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Password (min 6 chars)"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                {/* Role selector */}
                <div>
                  <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Role</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ROLES.map(r => {
                      const active = newRole === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setNewRole(r.value)}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all active:scale-95 ${
                            active
                              ? `bg-gradient-to-r ${r.color} text-white border-transparent shadow-md`
                              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-500/30'
                          }`}
                        >
                          <r.Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 mt-1.5 ml-1">
                    {ROLES.find(r => r.value === newRole)?.desc}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowCreateForm(false); setNewEmail(''); setNewPassword(''); setNewRole('staff'); }}
                    disabled={!!busy}
                    className="flex-1 py-2.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createUser}
                    disabled={!!busy}
                    className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50"
                  >
                    {busy === 'createUser' ? 'Creating…' : 'Create User'}
                  </button>
                </div>
              </div>
            )}

            {/* Users list */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                {users.length} user{users.length !== 1 ? 's' : ''} with access
              </p>
              {users.length === 0 ? (
                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-center">
                  <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">No users yet. Create one to get started.</p>
                </div>
              ) : (
                users.map(u => {
                  const rs = roleStyles[u.role];
                  const isMe = u.id === currentUserId;
                  return (
                    <div key={u.id} className="p-3 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${rs.gradient} flex items-center justify-center shrink-0`}>
                          <User className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-gray-200 truncate">
                            {u.email} {isMe && <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest ml-1">(you)</span>}
                          </p>
                          <p className="text-[9px] font-bold text-gray-500 dark:text-gray-500 mt-0.5">
                            Added {new Date(u.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </p>
                        </div>
                        <button
                          onClick={() => sendPasswordReset(u.id, u.email)}
                          disabled={!!busy}
                          className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/25 transition-all active:scale-90 disabled:opacity-50"
                          title="Send password reset email"
                        >
                          {busy === `reset-${u.id}` ? <span className="text-[9px] font-black">…</span> : <KeyRound className="w-3 h-3" />}
                        </button>
                        {!isMe && (
                          <button
                            onClick={() => removeUser(u.id, u.email)}
                            disabled={!!busy}
                            className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/25 transition-all active:scale-90 disabled:opacity-50"
                            title="Remove access"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {/* Role chips */}
                      <div className="flex gap-1 flex-wrap">
                        {ROLES.map(r => {
                          const active = u.role === r.value;
                          return (
                            <button
                              key={r.value}
                              onClick={() => !active && changeRole(u.id, r.value)}
                              disabled={!!busy || active}
                              className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:cursor-default ${
                                active
                                  ? `bg-gradient-to-r ${r.color} text-white shadow-sm`
                                  : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:text-gray-800 dark:hover:text-gray-200'
                              }`}
                            >
                              {r.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          )}

          {/* Non-admins see role-only info */}
          {currentRole && currentRole !== 'admin' && (
            <div className="px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold">
              You have <span className="uppercase tracking-widest">{currentRole}</span> access. Contact an admin to change your role or add users.
            </div>
          )}

          {/* Status message */}
          {msg && (
            <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs font-bold ${
              msg.kind === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300'
            }`}>
              {msg.kind === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span className="leading-relaxed">{msg.text}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
