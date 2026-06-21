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
    <div className="flex-1 flex flex-col h-full bg-[#fcfcfd]">
      <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-200/60 bg-white sticky top-0 z-10 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Campaign Management</h1>
          <p className="text-xs text-zinc-500">Manage and send retention campaigns to your customers.</p>
        </div>
        <Link
          to="/admin/campaigns/new"
          className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={16} />
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
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <p className="font-semibold text-zinc-600 mb-2">No campaigns found</p>
                    <p className="text-xs">Create your first campaign to get started.</p>
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
                      <span className="text-[11px] font-semibold bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md border border-zinc-200">
                        {c.type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-700">
                      {c.recipient_count}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border",
                        c.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        c.status === 'completed' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-zinc-100 text-zinc-600 border-zinc-200"
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
