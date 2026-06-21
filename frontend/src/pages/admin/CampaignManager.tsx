import { useState, useEffect } from 'react';
import { Plus, Tag, Search, MoreVertical, Edit, Send, Trash2, LayoutDashboard, Copy, Settings, Check, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function CampaignManager() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete campaign');
    }
  };

  const sendCampaign = async (id: number) => {
    if (!window.confirm('Are you sure you want to send this campaign now? This action cannot be undone.')) return;
    try {
      await api.post(`/campaigns/${id}/send`);
      alert('Campaign sending started!');
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to send campaign');
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-indigo-50/30 to-slate-50/50">
      <header className="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Campaign Management</h1>
          <p className="text-xs text-zinc-500">Manage and send retention campaigns to your customers.</p>
        </div>
        <Link
          to="/admin/campaigns/new"
          className="bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus size={18} />
          Create Campaign
        </Link>
      </header>

      <div className="p-8 flex-1 overflow-y-auto">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 p-1 bg-zinc-100 rounded-lg">
            {['all', 'draft', 'active', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-md capitalize transition-all",
                  filter === f
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
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
                <th className="px-6 py-4 font-bold">Campaign Name</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Recipients</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Created Date</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">Loading campaigns...</td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-gradient-to-tr from-brand-100 to-indigo-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                        <Tag size={28} className="text-brand-600" />
                      </div>
                      <p className="font-bold text-slate-800 text-lg mb-1">No campaigns found</p>
                      <p className="text-sm text-slate-500 mb-6">Create your first retention campaign to start engaging with your at-risk customers.</p>
                      <Link
                        to="/admin/campaigns/new"
                        className="bg-white border border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                      >
                        Create First Campaign
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900">{c.name}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-[200px]">{c.description || 'No description'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100/50">
                        {c.type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-700">
                      {c.recipient_count}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm",
                        c.status === 'active' ? "bg-gradient-to-r from-emerald-500 to-emerald-400 text-white" :
                        c.status === 'completed' ? "bg-slate-100 text-slate-600 border border-slate-200" :
                        "bg-gradient-to-r from-amber-400 to-amber-300 text-amber-900"
                      )}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-xs">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/campaigns/${c.id}`)}
                          className="p-1.5 text-zinc-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Edit / View"
                        >
                          <Edit size={16} />
                        </button>
                        {c.status === 'draft' && (
                          <>
                            <button
                              onClick={() => sendCampaign(c.id)}
                              className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Send Campaign"
                            >
                              <Send size={16} />
                            </button>
                            <button
                              onClick={() => deleteCampaign(c.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
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
