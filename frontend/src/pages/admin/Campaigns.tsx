import { useState, useEffect, useCallback } from 'react';
import { Tag, Headphones, Star, Package, Users, Search, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const CAMPAIGNS = [
  { id: 'Discount Campaign', icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'Customer Support Follow-up', icon: Headphones, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'Loyalty Program Enrollment', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { id: 'Product Recommendation Campaign', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

export default function Campaigns({ 
  hideHeader = false,
  onViewInCrm
}: { 
  hideHeader?: boolean;
  onViewInCrm?: (customerId: string) => void;
} = {}) {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("admin_campaigns_tab") || CAMPAIGNS[0].id;
  });

  useEffect(() => {
    localStorage.setItem("admin_campaigns_tab", activeTab);
  }, [activeTab]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCampaignCustomers = useCallback(async (campaignName: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/customers?campaign=${encodeURIComponent(campaignName)}&limit=100`);
      setCustomers(res.data.items || []);
    } catch (err) {
      console.error("Error fetching campaign customers:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaignCustomers(activeTab);
  }, [activeTab, fetchCampaignCustomers]);

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn("flex-1 flex flex-col h-full", hideHeader ? "" : "bg-[#fcfcfd]")}>
      {!hideHeader && (
        <header className="h-16 hidden md:flex flex-col justify-center px-8 border-b border-zinc-200/60 bg-white sticky top-0 z-10 shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Active Campaigns</h1>
          <p className="text-xs text-zinc-500">Track and manage customers assigned to retention campaigns.</p>
        </header>
      )}

      <div className={cn("w-full space-y-4 md:space-y-6 animate-fadeIn", hideHeader ? "pt-0 px-4 md:px-8 py-4 md:py-8" : "px-4 md:px-8 py-4 md:py-8")}>
        
        {/* Mobile: swipeable snap carousel */}
        <div className="flex md:hidden gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CAMPAIGNS.map(campaign => {
            const Icon = campaign.icon;
            const isActive = activeTab === campaign.id;
            return (
              <button
                key={campaign.id}
                onClick={() => setActiveTab(campaign.id)}
                className={cn(
                  "shrink-0 w-[72vw] max-w-[240px] snap-center p-5 rounded-2xl border text-left transition-all duration-300 flex flex-col relative overflow-hidden",
                  isActive
                    ? "bg-white border-brand-300 shadow-lg ring-2 ring-brand-500/20"
                    : "bg-white border-zinc-200 shadow-sm opacity-60"
                )}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 p-3 opacity-25 pointer-events-none">
                    <Sparkles size={52} className="text-brand-400 animate-pulse" />
                  </div>
                )}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border relative z-10",
                  cn(campaign.bg, campaign.color, isActive ? "border-brand-200 shadow-sm" : campaign.border)
                )}>
                  <Icon size={18} />
                </div>
                <div className="mt-3 relative z-10">
                  <h3 className={cn(
                    "font-bold text-[13px] leading-snug",
                    isActive ? "text-brand-900" : "text-zinc-600"
                  )}>{campaign.id}</h3>
                </div>
                <div className="mt-3">
                  <div className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    isActive ? "bg-brand-500 w-10" : "bg-zinc-200 w-5"
                  )} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Desktop cards */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          {CAMPAIGNS.map(campaign => {
            const Icon = campaign.icon;
            const isActive = activeTab === campaign.id;
            return (
              <button
                key={campaign.id}
                onClick={() => setActiveTab(campaign.id)}
                className={cn(
                  "p-6 rounded-3xl border text-left transition-all duration-300 flex flex-col group relative overflow-hidden h-full",
                  isActive
                    ? `shadow-xl bg-white border-brand-300 ring-4 ring-brand-500/10 scale-[1.03] -translate-y-1`
                    : "bg-white border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-lg hover:-translate-y-1"
                )}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 p-4 opacity-50 pointer-events-none transform translate-x-4 -translate-y-4">
                    <Sparkles size={64} className="text-brand-200 animate-pulse" />
                  </div>
                )}
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 relative z-10",
                  isActive ? cn(campaign.bg, campaign.color, "border-brand-200") : cn(campaign.bg, campaign.color, campaign.border)
                )}>
                  <Icon size={22} />
                </div>
                <div className="mt-4 relative z-10 flex flex-col flex-1">
                  <h3 className={cn(
                    "font-bold text-[14px] sm:text-[15px] leading-snug transition-colors duration-300",
                    isActive ? "text-brand-900" : "text-zinc-800 group-hover:text-brand-700"
                  )}>{campaign.id}</h3>
                  <div className="mt-auto pt-5">
                    <div className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      isActive ? "bg-brand-500 w-12" : "bg-zinc-200 w-8 group-hover:w-12 group-hover:bg-brand-400"
                    )} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Data Section */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200/80 flex-1 flex flex-col overflow-hidden min-h-[400px] md:min-h-[500px]">
          <div className="px-8 py-6 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-50"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-gradient-to-br from-indigo-50 to-brand-50 text-brand-600 rounded-2xl border border-brand-100 shadow-inner">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-zinc-900 tracking-tight">Enrolled Customers</h2>
                <p className="text-[13px] text-zinc-500 mt-1 font-medium">Customers currently active in the <span className="font-bold text-brand-600">{activeTab}</span></p>
              </div>
            </div>
            
            <div className="relative w-full md:w-80 shrink-0 relative z-10">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-200 rounded-2xl text-[13px] font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-400 gap-3">
                <Loader2 size={24} className="animate-spin text-brand-500" />
                <span className="text-sm font-medium">Loading campaign roster...</span>
              </div>
            ) : filteredCustomers.length > 0 ? (
              <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left min-w-[600px]">
                <thead className="text-[11px] text-zinc-500 bg-zinc-50/80 uppercase tracking-wider border-b border-zinc-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-8 py-4 font-bold">Customer Name</th>
                    <th className="px-8 py-4 font-bold">Risk Level</th>
                    <th className="px-8 py-4 font-bold">Assigned Date</th>
                    <th className="px-8 py-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredCustomers.map((customer, i) => {
                    const isHigh = customer.churn_risk === "High";
                    const initials = customer.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'NA';
                    const assignedDate = customer.campaign_assigned_date 
                      ? new Date(customer.campaign_assigned_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Recently';

                    return (
                      <tr key={customer.id || i} className="hover:bg-zinc-50/80 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-100 to-indigo-100 text-brand-700 flex items-center justify-center font-black text-xs shrink-0 border border-brand-200 shadow-sm">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 text-[14px]">{customer.name}</div>
                              <div className="text-[12px] font-mono text-zinc-500 mt-0.5 tracking-tight">{customer.id} <span className="text-zinc-300 px-1">•</span> <span className="text-zinc-600 font-semibold">{customer.plan_tier || 'Basic'}</span></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide",
                              isHigh ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                              {customer.churn_risk} Risk
                            </span>
                            <span className="text-[11px] font-semibold text-zinc-500">
                              {Math.round((customer.churn_probability || 0) * 100)}% Prob.
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[13px] text-zinc-600 font-medium">{assignedDate}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {onViewInCrm ? (
                            <button
                              onClick={() => onViewInCrm(customer.id)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all shadow-sm active:scale-95 group/btn cursor-pointer"
                            >
                              View in CRM <ArrowRight size={14} className="text-zinc-400 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all" />
                            </button>
                          ) : (
                            <Link 
                              to="/customers"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all shadow-sm active:scale-95 group/btn"
                            >
                              View in CRM <ArrowRight size={14} className="text-zinc-400 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-3">
                  <Users size={24} className="text-zinc-300" />
                </div>
                <span className="text-sm font-medium text-zinc-500">No customers found in this campaign.</span>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Clear search filter
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
