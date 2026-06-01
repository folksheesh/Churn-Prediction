import { useState, useEffect, useCallback } from 'react';
import { Tag, Headphones, Star, Package, Users, Search, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const CAMPAIGNS = [
  { id: 'Discount Campaign', icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'Customer Support Follow-up', icon: Headphones, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'Loyalty Program Enrollment', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { id: 'Product Recommendation Campaign', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

export default function Campaigns() {
  const [activeTab, setActiveTab] = useState(CAMPAIGNS[0].id);
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
    <div className="flex-1 flex flex-col h-full bg-[#fcfcfd]">
      <header className="h-16 flex flex-col justify-center px-8 border-b border-zinc-200/60 bg-white sticky top-0 z-10 shrink-0">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Active Campaigns</h1>
        <p className="text-xs text-zinc-500">Track and manage customers assigned to retention campaigns.</p>
      </header>

      <div className="p-8 max-w-[1400px] mx-auto w-full space-y-6 animate-fadeIn">
        
        {/* Campaign Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {CAMPAIGNS.map(campaign => {
            const Icon = campaign.icon;
            const isActive = activeTab === campaign.id;
            
            return (
              <button
                key={campaign.id}
                onClick={() => setActiveTab(campaign.id)}
                className={cn(
                  "p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col gap-3",
                  isActive 
                    ? `shadow-md bg-white border-brand-300 ring-1 ring-brand-500/20 scale-[1.02]` 
                    : "bg-white border-zinc-200/60 hover:border-zinc-300 hover:bg-zinc-50/50 hover:shadow-sm"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border",
                  campaign.bg, campaign.color, campaign.border
                )}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className={cn(
                    "font-bold text-[13px] leading-tight",
                    isActive ? "text-brand-900" : "text-zinc-700"
                  )}>{campaign.id}</h3>
                </div>
              </button>
            );
          })}
        </div>

        {/* Data Section */}
        <div className="saas-card flex-1 flex flex-col overflow-hidden min-h-[500px]">
          <div className="p-5 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                <Users size={16} />
              </div>
              <div>
                <h2 className="saas-heading text-base">Enrolled Customers</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Customers currently active in the <span className="font-semibold text-zinc-700">{activeTab}</span></p>
              </div>
            </div>
            
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-500/20 transition-all shadow-sm"
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
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-zinc-400 bg-zinc-50/80 uppercase tracking-wider border-b border-zinc-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Customer Name</th>
                    <th className="px-6 py-3 font-semibold">Risk Level</th>
                    <th className="px-6 py-3 font-semibold">Assigned Date</th>
                    <th className="px-6 py-3 font-semibold text-right">Action</th>
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
                      <tr key={customer.id || i} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-[11px] shrink-0 border border-brand-100">
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900 text-[13px]">{customer.name}</div>
                              <div className="text-[11px] font-mono text-zinc-500 mt-0.5">{customer.id} • {customer.plan_tier || 'Basic'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
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
                        <td className="px-6 py-4">
                          <span className="text-[12px] text-zinc-600 font-medium">{assignedDate}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            to="/customers"
                            className="inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-semibold bg-white border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm active:scale-95"
                          >
                            View in CRM
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
