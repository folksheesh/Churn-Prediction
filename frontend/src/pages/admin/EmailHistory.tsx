import { useState, useEffect } from 'react';
import { Search, Mail, Clock, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function EmailHistory() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campaigns/logs/history');
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching email history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (log.customer_name || '').toLowerCase().includes(q) ||
        (log.email || '').toLowerCase().includes(q) ||
        (log.campaign_name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-indigo-50/30 to-slate-50/50">
      <header className="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Email History</h1>
          <p className="text-xs text-zinc-500">Track delivery status of all campaign emails sent to customers.</p>
        </div>
      </header>

      <div className="p-8 flex-1 overflow-y-auto">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 p-1 bg-zinc-100 rounded-lg">
            {['all', 'sent', 'failed', 'pending'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-md capitalize transition-all",
                  statusFilter === f
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by customer name, email, or campaign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-zinc-500 bg-zinc-50/80 uppercase tracking-wider border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 font-bold">Recipient</th>
                <th className="px-6 py-4 font-bold">Campaign</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Date Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">Loading email history...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center">
                      <Mail size={32} className="text-zinc-300 mb-2" />
                      <p className="font-semibold text-zinc-600">No emails found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900">{log.customer_name || 'Unknown'}</div>
                      <div className="text-xs text-zinc-500">{log.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-700">{log.campaign_name || 'Deleted Campaign'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.status === 'sent' && <CheckCircle2 size={16} className="text-emerald-500" />}
                        {log.status === 'failed' && <XCircle size={16} className="text-rose-500" />}
                        {log.status === 'pending' && <Clock size={16} className="text-amber-500" />}
                        <span className={cn(
                          "text-xs font-bold uppercase",
                          log.status === 'sent' ? 'text-emerald-700' :
                          log.status === 'failed' ? 'text-rose-700' : 'text-amber-700'
                        )}>
                          {log.status}
                        </span>
                      </div>
                      {log.status === 'failed' && log.error_message && (
                        <div className="text-[10px] text-rose-500 mt-1 max-w-[200px] truncate" title={log.error_message}>
                          {log.error_message}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-xs">
                      {log.sent_at ? new Date(log.sent_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
