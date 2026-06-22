import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserPlus, Search, MoreHorizontal, Mail, CheckCircle, XCircle,
  Trash2, RefreshCw, Shield, Clock, Users, AlertTriangle,
  X, Send, ChevronDown
} from 'lucide-react';

interface UserItem {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  created_at: string | null;
  last_login: string | null;
}

interface InvitationItem {
  id: number;
  email: string;
  invited_by: string;
  status: string;
  expired_at: string | null;
  created_at: string | null;
}

type Tab = 'all' | 'active' | 'pending';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, invRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/auth/users/invitations')
      ]);
      setUsers(usersRes.data);
      setInvitations(invRes.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviteLoading(true);
    try {
      await api.post('/auth/invite', { email: inviteEmail });
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      fetchData();
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess('');
      }, 2000);
    } catch (err: any) {
      setInviteError(err.response?.data?.detail || 'Failed to send invitation.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResendInvite = async (email: string) => {
    setActionLoading(`resend-${email}`);
    try {
      await api.post('/auth/invite/resend', { email });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to resend invitation.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setActionLoading(`status-${userId}`);
    try {
      await api.put(`/auth/users/${userId}/status`, { status: newStatus });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: number) => {
    setActionLoading(`delete-${userId}`);
    try {
      await api.delete(`/auth/users/${userId}`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'active') return matchesSearch && u.status === 'active';
    if (activeTab === 'pending') return false; // pending tab shows invitations
    return matchesSearch;
  });

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      super_admin: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'Super Admin' },
      company_admin: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Company Admin' },
      user: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700', label: 'User' },
    };
    const c = config[role] || config.user;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text}`}>
        <Shield size={10} /> {c.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
        </span>
      );
    }
    if (status === 'inactive') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={10} /> Pending
      </span>
    );
  };

  return (
    <>
      <header className="h-16 hidden md:flex items-center px-8 border-b border-zinc-200 bg-white sticky top-0 z-10 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">User Management</h1>
      </header>

      <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex flex-col gap-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{users.length}</p>
              <p className="text-xs font-medium text-zinc-500">Total Users</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{users.filter(u => u.status === 'active').length}</p>
              <p className="text-xs font-medium text-zinc-500">Active Users</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{pendingInvitations.length}</p>
              <p className="text-xs font-medium text-zinc-500">Pending Invitations</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100">
            <div className="flex items-center gap-2 bg-zinc-100/50 p-1 rounded-xl">
              {([
                { key: 'all', label: 'All Users' },
                { key: 'active', label: 'Active' },
                { key: 'pending', label: `Pending (${pendingInvitations.length})` },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.key
                      ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
              <button
                onClick={() => { setShowInviteModal(true); setInviteError(''); setInviteSuccess(''); }}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0"
              >
                <UserPlus size={16} /> Invite User
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 flex items-center justify-center text-zinc-400 font-medium">
              <div className="w-8 h-8 border-4 border-zinc-200 border-t-brand-600 rounded-full animate-spin mr-3" />
              Loading users...
            </div>
          ) : activeTab === 'pending' ? (
            /* Pending Invitations Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Invited By</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Expires</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Sent</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvitations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 font-medium">
                        No pending invitations
                      </td>
                    </tr>
                  ) : (
                    pendingInvitations.map(inv => (
                      <tr key={inv.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">
                              <Mail size={14} />
                            </div>
                            <span className="text-sm font-medium text-zinc-900">{inv.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">{inv.invited_by}</td>
                        <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-500">{formatDate(inv.expired_at)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-500">{formatDate(inv.created_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleResendInvite(inv.email)}
                            disabled={actionLoading === `resend-${inv.email}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <RefreshCw size={12} className={actionLoading === `resend-${inv.email}` ? 'animate-spin' : ''} />
                            Resend
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Users Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Created</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-medium">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center text-xs font-bold">
                              {u.name?.substring(0, 2).toUpperCase() || 'NA'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">{u.name}</p>
                              <p className="text-xs text-zinc-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                        <td className="px-6 py-4">{getStatusBadge(u.status)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-500">{formatDate(u.created_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Don't show actions for current user or default admin */}
                            {u.email !== 'admin@churnsense.com' && u.id !== currentUser?.id && (
                              <>
                                <button
                                  onClick={() => handleToggleStatus(u.id, u.status)}
                                  disabled={actionLoading === `status-${u.id}`}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                                    u.status === 'active'
                                      ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                      : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                  }`}
                                >
                                  {u.status === 'active' ? (
                                    <><XCircle size={12} /> Deactivate</>
                                  ) : (
                                    <><CheckCircle size={12} /> Activate</>
                                  )}
                                </button>

                                {deleteConfirm === u.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleDelete(u.id)}
                                      disabled={actionLoading === `delete-${u.id}`}
                                      className="px-2.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="px-2.5 py-1.5 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirm(u.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                )}
                              </>
                            )}
                            {u.email === 'admin@churnsense.com' && (
                              <span className="text-[11px] text-zinc-400 font-medium">System Admin</span>
                            )}
                            {u.id === currentUser?.id && u.email !== 'admin@churnsense.com' && (
                              <span className="text-[11px] text-zinc-400 font-medium">You</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-scaleUp">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Invite User</h3>
                <p className="text-xs text-zinc-500 mt-1">Send an invitation email to a new user.</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                <X size={18} className="text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm font-medium text-rose-700 flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-medium text-emerald-700 flex items-start gap-2">
                  <CheckCircle size={14} className="shrink-0 mt-0.5" /> {inviteSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-zinc-200 rounded-xl bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all"
                  placeholder="user@company.com"
                />
                <p className="text-xs text-zinc-400 mt-2">
                  An invitation email will be sent with a link to activate their account. The link expires in 24 hours.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading || !inviteEmail}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={14} />
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation for mobile (inline in table for desktop) */}
    </>
  );
}
