import { useState, useEffect } from 'react';
import { Plus, Tag, Search, ShieldCheck, Headphones, Star, PackageOpen, Sparkles, Send, Edit3, CheckCircle, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const CAMPAIGN_STYLES = [
  { icon: <Tag size={18} />, color: 'from-brand-50 to-indigo-50', textColor: 'text-brand-700', borderColor: 'border-brand-200/50', iconColor: 'text-brand-500', activeRing: 'ring-brand-500' },
  { icon: <Headphones size={18} />, color: 'from-blue-50 to-cyan-50', textColor: 'text-blue-700', borderColor: 'border-blue-200/50', iconColor: 'text-blue-500', activeRing: 'ring-blue-500' },
  { icon: <Star size={18} />, color: 'from-purple-50 to-fuchsia-50', textColor: 'text-purple-700', borderColor: 'border-purple-200/50', iconColor: 'text-purple-500', activeRing: 'ring-purple-500' },
  { icon: <PackageOpen size={18} />, color: 'from-emerald-50 to-teal-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200/50', iconColor: 'text-emerald-500', activeRing: 'ring-emerald-500' },
  { icon: <Sparkles size={18} />, color: 'from-rose-50 to-pink-50', textColor: 'text-rose-700', borderColor: 'border-rose-200/50', iconColor: 'text-rose-500', activeRing: 'ring-rose-500' }
];

export default function CampaignManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success'|'error'}>({ show: false, message: '', type: 'success' });
  const [successModalData, setSuccessModalData] = useState<{show: boolean, count: number, campaignName: string} | null>(null);
  const [confirmModalData, setConfirmModalData] = useState<{show: boolean, count: number, campaignName: string} | null>(null);

  const showToast = (message: string, type: 'success'|'error' = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data);
      if (res.data.length > 0) {
        setActiveTab(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== null) {
      fetchRecipients(activeTab);
    }
  }, [activeTab]);

  const fetchRecipients = async (campaignId: number) => {
    try {
      const res = await api.get(`/campaigns/${campaignId}/recipients`);
      setRecipients(res.data);
    } catch (err) {
      console.error(err);
      setRecipients([]);
    }
  };

  const addRecipientsByRisk = async (risk: string) => {
    if (activeTab === null) return;
    try {
      await api.post(`/campaigns/${activeTab}/recipients`, { risk_levels: [risk] });
      showToast(`Added ${risk} risk customers to campaign!`, 'success');
      fetchRecipients(activeTab);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to add recipients', 'error');
    }
  };

  const removeRecipient = async (customerId: string) => {
    if (activeTab === null) return;
    try {
      await api.delete(`/campaigns/${activeTab}/recipients/${customerId}`);
      fetchRecipients(activeTab);
      showToast('Customer removed from campaign', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to remove recipient', 'error');
    }
  };

  const triggerSendConfirm = () => {
    if (activeTab === null) return;
    if (recipients.length === 0) {
      showToast("Please add recipients first.", 'error');
      return;
    }
    setConfirmModalData({ show: true, count: recipients.length, campaignName: activeCampaign?.name || 'Campaign' });
  };

  const handleSendConfirmed = async () => {
    if (activeTab === null) return;
    setConfirmModalData(null);
    try {
      await api.post(`/campaigns/${activeTab}/send`);
      setSuccessModalData({ show: true, count: recipients.length, campaignName: activeCampaign?.name || 'Campaign' });
      fetchCampaigns();
      fetchRecipients(activeTab);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to send campaign', 'error');
    }
  };

  const filteredRecipients = recipients.filter(r => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.customer_name?.toLowerCase().includes(q) && !r.customer_email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeCampaign = campaigns.find(c => c.id === activeTab);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-4" />
        <h3 className="text-lg font-bold text-zinc-700">Loading campaigns...</h3>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-indigo-50/30 to-slate-50/50 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-100 rounded-full blur-[120px] opacity-30 pointer-events-none" />

      <header className="h-auto md:h-24 pt-6 pb-4 md:py-0 px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between bg-white/60 backdrop-blur-xl border-b border-white/50 sticky top-0 z-20 shrink-0 shadow-[0_4px_30px_rgb(0,0,0,0.02)]">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 drop-shadow-sm flex items-center gap-2">
            Active Campaigns
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 font-medium mt-1">Track and manage customers assigned to retention campaigns.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-10 py-8 z-10 scroll-smooth">

        {/* Swipeable Tabs Row */}
        <div className="mb-10 w-full overflow-hidden">
          <div className="flex overflow-x-auto pb-6 -mb-6 snap-x snap-mandatory hide-scrollbar gap-4 md:gap-5 px-1 pt-2">
            
            {/* Create Campaign Card - Only for admins */}
            {user?.role !== 'user' && (
              <div 
                onClick={() => navigate('/admin/campaigns/new')}
                className="group snap-start shrink-0 w-64 md:w-72 bg-white/50 border-2 border-dashed border-zinc-300 rounded-3xl p-5 cursor-pointer hover:bg-brand-50 hover:border-brand-300 transition-all flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 group-hover:bg-brand-100 group-hover:text-brand-600 flex items-center justify-center mb-3 transition-colors">
                  <Plus size={24} />
                </div>
                <h3 className="text-sm font-bold text-zinc-600 group-hover:text-brand-700">Add New Campaign</h3>
                <p className="text-xs text-zinc-400 mt-1">Create a custom email flow</p>
              </div>
            )}

            {campaigns.map((camp, index) => {
              const isActive = activeTab === camp.id;
              const map = CAMPAIGN_STYLES[index % CAMPAIGN_STYLES.length];
              
              return (
                <div
                  key={camp.id}
                  onClick={() => setActiveTab(camp.id)}
                  className={cn(
                    "snap-start shrink-0 w-64 md:w-72 rounded-3xl p-5 cursor-pointer transition-all duration-300 border bg-white shadow-sm hover:shadow-md relative overflow-hidden flex flex-col justify-between",
                    isActive ? `ring-2 ${map.activeRing} ${map.borderColor} shadow-md scale-[1.02] -translate-y-1` : "border-zinc-200/80 hover:border-zinc-300 opacity-80 hover:opacity-100",
                    isActive ? "z-10" : "z-0"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                      <Sparkles size={48} className={map.textColor} />
                    </div>
                  )}
                  
                  <div>
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm mb-4 transition-colors",
                      isActive ? `bg-gradient-to-br ${map.color} ${map.iconColor}` : "bg-zinc-100 text-zinc-400"
                    )}>
                      {map.icon}
                    </div>
                    <h3 className={cn(
                      "text-[15px] font-black leading-snug tracking-tight mb-1",
                      isActive ? map.textColor : "text-zinc-700"
                    )}>
                      {camp.name}
                    </h3>
                  </div>

                  {isActive && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className={cn("h-1.5 w-12 rounded-full", `bg-gradient-to-r ${map.color}`)} />
                      {user?.role !== 'user' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/campaigns/${camp.id}`);
                          }}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 hover:bg-brand-100 transition-colors"
                        >
                          <Edit3 size={14} /> Custom Email
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-6 md:p-8 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">Enrolled Customers</h2>
                <p className="text-sm font-medium text-zinc-500 mt-0.5">
                  Customers currently active in <strong className="text-brand-600 font-bold">{activeCampaign?.name || 'this campaign'}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto shrink-0">
              {activeCampaign?.status !== 'completed' && activeCampaign?.status !== 'active' && (
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-zinc-200 shadow-sm">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-2 pr-1">Quick Add:</span>
                  <button onClick={() => addRecipientsByRisk('High')} className="px-2.5 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors">High</button>
                  <button onClick={() => addRecipientsByRisk('Medium')} className="px-2.5 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors">Med</button>
                  <button onClick={() => addRecipientsByRisk('Low')} className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors">Low</button>
                </div>
              )}

              {recipients.length > 0 && activeCampaign?.status === 'draft' && (
                <button
                  onClick={triggerSendConfirm}
                  className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
                >
                  <Send size={16} /> Send Now
                </button>
              )}

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto relative">
            {filteredRecipients.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-zinc-500 bg-zinc-50/80 uppercase tracking-wider border-b border-zinc-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-8 py-4 font-bold">Customer Name</th>
                    <th className="px-8 py-4 font-bold">Email</th>
                    <th className="px-8 py-4 font-bold">Risk Level</th>
                    <th className="px-8 py-4 font-bold">Email Status</th>
                    <th className="px-8 py-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredRecipients.map((customer, i) => {
                    const isHigh = customer.customer_risk === "High";
                    const initials = customer.customer_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'NA';
                    return (
                      <tr key={customer.id || i} className="hover:bg-zinc-50/80 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-100 to-indigo-100 text-brand-700 flex items-center justify-center font-black text-xs shrink-0 border border-brand-200 shadow-sm">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 text-[14px]">{customer.customer_name}</div>
                              <div className="text-[12px] font-mono text-zinc-500 mt-0.5">{customer.customer_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[13px] text-zinc-600 font-medium">{customer.customer_email || 'N/A'}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide",
                              isHigh ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                              {customer.customer_risk} Risk
                            </span>
                          </div>
                        </td>
                         <td className="px-8 py-5">
                           <span className={cn(
                             "text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider",
                             customer.email_status === 'sent' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                             customer.email_status === 'failed' ? "bg-rose-50 text-rose-700 border-rose-200" :
                             "bg-zinc-100 text-zinc-600 border-zinc-200"
                           )}>
                             {customer.email_status}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button onClick={() => removeRecipient(customer.customer_id)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Remove</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4">
                  <Users size={32} className="text-zinc-300" />
                </div>
                <span className="text-base font-bold text-zinc-900">No customers enrolled yet</span>
                <p className="text-sm text-zinc-500 mt-2 max-w-sm leading-relaxed">
                  {searchQuery
                    ? "No results match your search."
                    : "To enroll customers, go to the Dashboard and assign them to this campaign."
                  }
                </p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="mt-4 text-sm text-brand-600 hover:text-brand-700 font-bold px-4 py-2 bg-brand-50 rounded-lg">
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl shadow-black/5 border animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={18} className="text-rose-600 shrink-0" />}
          <p className="font-bold text-sm">{toast.message}</p>
          <button onClick={() => setToast(prev => ({...prev, show: false}))} className={`ml-3 p-1 rounded-md transition-colors ${toast.type === 'success' ? 'text-emerald-600 hover:bg-emerald-100' : 'text-rose-600 hover:bg-rose-100'}`}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Confirm Send Modal */}
      {confirmModalData?.show && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 border border-zinc-100 flex flex-col">
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Confirm Dispatch</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Are you sure you want to send <strong className="text-zinc-800">{confirmModalData.campaignName}</strong> to <strong className="text-brand-600 font-bold">{confirmModalData.count} recipient{confirmModalData.count !== 1 ? 's' : ''}</strong>?
            </p>
            
            <div className="flex justify-end gap-3 w-full">
              <button 
                onClick={() => setConfirmModalData(null)}
                className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendConfirmed}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalData?.show && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 border border-zinc-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Emails Sent</h3>
            <p className="text-sm text-zinc-500 mb-6">
              <strong className="text-zinc-800">{successModalData.campaignName}</strong> has been dispatched to <strong className="text-brand-600 font-bold">{successModalData.count} recipient{successModalData.count !== 1 ? 's' : ''}</strong>.
            </p>
            <button 
              onClick={() => setSuccessModalData(null)}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// Add Users icon
const Users = ({ className, size }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
