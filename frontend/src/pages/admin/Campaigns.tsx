import { useState, useEffect, useCallback, useRef } from 'react';
import { Tag, Headphones, Star, Package, Users, Search, Loader2, Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [activeIndex, setActiveIndex] = useState(() => {
    const saved = localStorage.getItem("admin_campaigns_tab");
    const idx = CAMPAIGNS.findIndex(c => c.id === saved);
    return idx >= 0 ? idx : 0;
  });
  const activeTab = CAMPAIGNS[activeIndex].id;

  useEffect(() => {
    localStorage.setItem("admin_campaigns_tab", activeTab);
  }, [activeTab]);

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Touch drag state for carousel
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe left → next
        setActiveIndex(i => Math.min(i + 1, CAMPAIGNS.length - 1));
      } else {
        // swipe right → prev
        setActiveIndex(i => Math.max(i - 1, 0));
      }
    }
  };

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

  const ActiveIcon = CAMPAIGNS[activeIndex].icon;

  return (
    <div className={cn("flex-1 flex flex-col h-full", hideHeader ? "" : "bg-[#fcfcfd]")}>
      {!hideHeader && (
        <header className="h-16 hidden md:flex flex-col justify-center px-8 border-b border-zinc-200/60 bg-white sticky top-0 z-10 shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Active Campaigns</h1>
          <p className="text-xs text-zinc-500">Track and manage customers assigned to retention campaigns.</p>
        </header>
      )}

      <div className={cn("w-full space-y-4 md:space-y-6 animate-fadeIn", hideHeader ? "pt-0 px-4 md:px-8 py-4 md:py-8" : "px-4 md:px-8 py-4 md:py-8")}>
        
        {/* ── MOBILE: Touch-drag carousel ── */}
        <div className="md:hidden">
          {/* Card */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={cn(
              "w-full p-5 rounded-2xl border relative overflow-hidden transition-all duration-300 select-none",
              "bg-white border-brand-300 shadow-lg ring-2 ring-brand-500/20"
            )}
          >
            <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
              <Sparkles size={56} className="text-brand-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm",
                CAMPAIGNS[activeIndex].bg, CAMPAIGNS[activeIndex].color, "border-brand-200"
              )}>
                <ActiveIcon size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Campaign</p>
                <h3 className="font-bold text-[14px] text-brand-900 leading-tight">{activeTab}</h3>
              </div>
            </div>

            {/* Swipe indicator dots + arrows */}
            <div className="flex items-center justify-between mt-4 relative z-10">
              <button
                onClick={() => setActiveIndex(i => Math.max(i - 1, 0))}
                disabled={activeIndex === 0}
                className="p-1.5 rounded-full bg-zinc-100 text-zinc-500 disabled:opacity-30 active:bg-zinc-200"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-1.5">
                {CAMPAIGNS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === activeIndex ? "bg-brand-500 w-6" : "bg-zinc-200 w-2"
                    )}
                  />
                ))}
              </div>
              <button
                onClick={() => setActiveIndex(i => Math.min(i + 1, CAMPAIGNS.length - 1))}
                disabled={activeIndex === CAMPAIGNS.length - 1}
                className="p-1.5 rounded-full bg-zinc-100 text-zinc-500 disabled:opacity-30 active:bg-zinc-200"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <p className="text-center text-[10px] text-zinc-400 mt-2 relative z-10">Geser atau tap panah untuk ganti campaign</p>
          </div>
        </div>

        {/* ── DESKTOP: Card grid ── */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          {CAMPAIGNS.map((campaign, idx) => {
            const Icon = campaign.icon;
            const isActive = idx === activeIndex;
            return (
              <button
                key={campaign.id}
                onClick={() => setActiveIndex(idx)}
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

        {/* ── Data Section ── */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200/80 flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 md:px-8 py-4 md:py-6 border-b border-zinc-100 flex flex-col gap-3 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-gradient-to-br from-indigo-50 to-brand-50 text-brand-600 rounded-xl md:rounded-2xl border border-brand-100">
                <Users size={16} />
              </div>
              <div>
                <h2 className="text-sm md:text-lg font-black text-zinc-900 tracking-tight">Enrolled Customers</h2>
                <p className="text-[11px] md:text-[13px] text-zinc-500 font-medium">Active in <span className="font-bold text-brand-600">{activeTab}</span></p>
              </div>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[12px] md:text-[13px] font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-400 gap-3">
                <Loader2 size={22} className="animate-spin text-brand-500" />
                <span className="text-sm font-medium">Loading...</span>
              </div>
            ) : filteredCustomers.length > 0 ? (
              <>
                {/* Mobile: card list */}
                <div className="md:hidden divide-y divide-zinc-100">
                  {filteredCustomers.map((customer, i) => {
                    const isHigh = customer.churn_risk === "High";
                    const initials = customer.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'NA';
                    const assignedDate = customer.campaign_assigned_date
                      ? new Date(customer.campaign_assigned_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'Recently';
                    return (
                      <div key={customer.id || i} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-100 to-indigo-100 text-brand-700 flex items-center justify-center font-black text-xs shrink-0 border border-brand-200">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-zinc-900 text-[13px] truncate">{customer.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide",
                              isHigh ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                              {customer.churn_risk}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium">{assignedDate}</span>
                          </div>
                        </div>
                        {onViewInCrm ? (
                          <button
                            onClick={() => onViewInCrm(customer.id)}
                            className="shrink-0 px-2.5 py-1.5 text-[11px] font-bold bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg active:bg-zinc-100 flex items-center gap-1"
                          >
                            CRM <ArrowRight size={11} />
                          </button>
                        ) : (
                          <Link
                            to="/customers"
                            className="shrink-0 px-2.5 py-1.5 text-[11px] font-bold bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-lg flex items-center gap-1"
                          >
                            CRM <ArrowRight size={11} />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: table */}
                <table className="hidden md:table w-full text-sm text-left">
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
                                <div className="text-[12px] font-mono text-zinc-500 mt-0.5">{customer.id} <span className="text-zinc-300 px-1">•</span> <span className="text-zinc-600 font-semibold">{customer.plan_tier || 'Basic'}</span></div>
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
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 md:py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4">
                  <Users size={24} className="text-zinc-300" />
                </div>
                <span className="text-sm font-bold text-zinc-600">No customers enrolled yet</span>
                <p className="text-[12px] text-zinc-400 mt-2 max-w-xs leading-relaxed">
                  {searchQuery
                    ? "No results match your search."
                    : "To enroll customers, go to the Dashboard and click 'Send Offer' on high-risk customers. They'll appear here once assigned."
                  }
                </p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="mt-3 text-xs text-brand-600 hover:text-brand-700 font-semibold">
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
