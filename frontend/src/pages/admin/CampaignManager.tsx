import { useState, useEffect } from 'react';
import { Tag, Search, ArrowRight, ShieldCheck, Headphones, Star, PackageOpen, MoreVertical, Plus, Edit3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const TYPE_MAPPING: Record<string, any> = {
  'discount_campaign': { icon: <Tag size={18} />, color: 'from-brand-50 to-indigo-50', textColor: 'text-brand-700', borderColor: 'border-brand-200/50', iconColor: 'text-brand-500', activeRing: 'ring-brand-500' },
  'customer_support_followup': { icon: <Headphones size={18} />, color: 'from-blue-50 to-cyan-50', textColor: 'text-blue-700', borderColor: 'border-blue-200/50', iconColor: 'text-blue-500', activeRing: 'ring-blue-500' },
  'loyalty_program': { icon: <Star size={18} />, color: 'from-purple-50 to-fuchsia-50', textColor: 'text-purple-700', borderColor: 'border-purple-200/50', iconColor: 'text-purple-500', activeRing: 'ring-purple-500' },
  'product_recommendation': { icon: <PackageOpen size={18} />, color: 'from-emerald-50 to-teal-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200/50', iconColor: 'text-emerald-500', activeRing: 'ring-emerald-500' }
};

const DEFAULT_MAPPING = { icon: <Tag size={18} />, color: 'from-zinc-50 to-slate-50', textColor: 'text-zinc-700', borderColor: 'border-zinc-200/50', iconColor: 'text-zinc-500', activeRing: 'ring-zinc-500' };

export default function CampaignManager() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filteredRecipients = recipients.filter(r => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.customer_name?.toLowerCase().includes(q) && !r.customer_email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeCampaign = campaigns.find(c => c.id === activeTab);

  if (loading) return <div className="p-8 text-zinc-500">Loading campaigns...</div>;

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
          <div className="flex overflow-x-auto pb-6 -mb-6 snap-x snap-mandatory hide-scrollbar gap-4 md:gap-5 px-1 pt-1">
            
            {/* Create Campaign Card */}
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

            {campaigns.map(camp => {
              const isActive = activeTab === camp.id;
              const map = TYPE_MAPPING[camp.type] || DEFAULT_MAPPING;
              
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
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/campaigns/${camp.id}`);
                        }}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 hover:bg-brand-100 transition-colors"
                      >
                        <Edit3 size={14} /> Custom Email
                      </button>
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

            <div className="relative w-full md:w-72 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
              />
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
    </div>
  );
}

// Add Sparkles icon missing from imports above
const Sparkles = ({ className, size }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);
// Add Users icon
const Users = ({ className, size }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
