import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Users, Activity, DollarSign, ArrowUpRight, ArrowDownRight, ShieldAlert, BellRing, ArrowRight, Zap, Target, Loader2, Sparkles, AlertTriangle, ChevronRight, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import RetentionActionCenter from '@/components/RetentionActionCenter';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [campaignStats, setCampaignStats] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [mitigatedIds, setMitigatedIds] = useState<Set<string>>(new Set());

  const CACHE_KEY = 'churnsense_admin_dashboard';

  const fetchDashboardData = useCallback(async (bypassCache = false) => {
    // 1. Show cached data instantly (stale-while-revalidate)
    if (!bypassCache) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Use cache if less than 5 minutes old
          if (Date.now() - timestamp < 300_000) {
            setMetrics(data.overview);
            setAlerts(data.alerts);
            setActivities(data.activities || []);
            if (data.campaign_stats) setCampaignStats(data.campaign_stats);
            setLoading(false);
          }
        }
      } catch { /* ignore parse errors */ }
    }

    // 2. Fetch fresh data from the combined bundle endpoint (1 request instead of 4)
    try {
      const res = await api.get('/analytics/dashboard-bundle');
      const bundle = res.data;

      setMetrics(bundle.overview);
      setAlerts(bundle.alerts);
      setActivities(bundle.activities || []);
      if (bundle.campaign_stats) setCampaignStats(bundle.campaign_stats);

      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: bundle,
        timestamp: Date.now(),
      }));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50/30 to-slate-50/50">
        <Loader2 className="w-8 h-8 border-t-indigo-600 rounded-full animate-spin text-brand-600 mb-4" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-indigo-50/30 to-slate-50/50 overflow-y-auto">
      <header className="h-20 hidden md:flex items-center justify-between px-8 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-20 shrink-0 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Operational Overview</h1>
          <p className="text-xs font-medium text-slate-500">Real-time churn intelligence & mitigation tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live System
          </div>
        </div>
      </header>

      <div className="p-8 w-full space-y-8 min-h-screen">
        
        {/* Top KPI Widgets - Premium Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up">
          <MetricCard 
            title="Total Customers" 
            value={metrics?.total_customers?.toLocaleString() || "—"} 
            trend="+2.4%" isPositive={true}
            icon={<Users size={18} />} 
            gradient="from-blue-500 to-indigo-600"
          />
          <MetricCard 
            title="Predicted Churn Rate" 
            value={`${metrics?.churn_rate?.toFixed(2) || 0}%`} 
            trend="-0.5%" isPositive={true}
            icon={<Activity size={18} />} 
            gradient="from-emerald-500 to-teal-600"
          />
          <MetricCard 
            title="MRR At Risk" 
            value={`$${metrics?.at_risk_mrr?.toLocaleString() || "0"}`} 
            trend="+12.5%" isPositive={false}
            icon={<DollarSign size={18} />} 
            gradient="from-amber-500 to-orange-600"
          />
          <MetricCard 
            title="Critical Risk Alerts" 
            value={alerts.length.toString()} 
            trend="+3" isPositive={false}
            icon={<ShieldAlert size={18} />} 
            gradient="from-rose-500 to-pink-600"
            alert={alerts.length > 0}
          />
        </div>

        {/* Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Operational Column (70%) */}
          <div className="lg:col-span-2 flex flex-col gap-8 animate-fade-up">
            
            {/* AI Recommendation Strip */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-brand-900 to-indigo-950 rounded-2xl p-6 shadow-xl border border-indigo-800 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles className="w-32 h-32 text-white" />
              </div>
              <div className="mt-1 bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
                <Zap size={24} className="text-indigo-300 animate-pulse" />
              </div>
              <div className="flex-1 relative z-10">
                <h3 className="text-lg font-bold text-white tracking-tight">AI Retention Opportunities Detected</h3>
                <p className="text-sm text-indigo-200 mt-1.5 leading-relaxed max-w-xl">
                  Our prediction model has identified customers with an elevated risk of churn. Use the mitigation options below to immediately assign AI-recommended retention campaigns.
                </p>
              </div>
              <Link to="/analysis" className="relative z-10 px-5 py-2.5 text-sm font-bold bg-white text-indigo-900 rounded-xl shadow-lg hover:bg-indigo-50 transition-all active:scale-[0.97] hover:shadow-xl shrink-0 flex items-center gap-2 group">
                View Analysis <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Operational Triage Table - Modernized */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200/80 flex flex-col overflow-hidden flex-1">
              <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)] animate-pulse"></div>
                  <h2 className="text-base font-bold text-zinc-900 tracking-tight">Needs Immediate Attention</h2>
                </div>
                <Link to="/customers" className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                  View all <ChevronRight size={14} />
                </Link>
              </div>
              
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="text-[10px] text-zinc-500 bg-zinc-50/80 uppercase tracking-widest border-b border-zinc-100 font-bold">
                    <tr>
                      <th className="px-6 py-4">Customer Details</th>
                      <th className="px-6 py-4">Risk Profile</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {alerts.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-black text-zinc-600 text-xs shadow-sm group-hover:bg-white transition-colors">
                              {row.name?.substring(0, 2).toUpperCase() || 'NA'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900 text-sm">{row.name}</span>
                              <span className="text-[11px] font-mono text-zinc-500 mt-0.5">{row.id} • {row.plan}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-rose-600 text-xs bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">{row.score}% Prob.</span>
                              <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full" style={{ width: `${row.score}%` }}></div>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-zinc-500 tracking-wide uppercase">{row.signal}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           {(row.mitigation_status === 'Assigned' || mitigatedIds.has(row.id)) ? (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                               <Sparkles size={12} /> Assigned
                             </span>
                           ) : (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                               <AlertTriangle size={12} /> Pending
                             </span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {(row.mitigation_status === 'Assigned' || mitigatedIds.has(row.id)) ? (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-zinc-50 text-zinc-400 border border-zinc-200">
                              <Sparkles size={14} /> Mitigated
                            </span>
                          ) : (
                            <button 
                              onClick={() => setSelectedCustomer({
                                ...row,
                                plan_tier: row.plan || 'Basic',
                                age: row.age || '-',
                                churn_probability: row.score ? row.score / 100 : 0,
                                churn_risk: 'High'
                              })}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-[0.97] bg-rose-50 text-rose-700 hover:bg-rose-100 hover:shadow border border-rose-200"
                            >
                              <AlertTriangle size={14} className="animate-pulse"/> Mitigate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {alerts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center text-zinc-500">
                          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
                            <Sparkles size={24} className="text-emerald-500" />
                          </div>
                          <h3 className="text-base font-bold text-zinc-900">All Clear</h3>
                          <span className="text-sm font-medium mt-1 inline-block">No critical risks currently active. Great job!</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Context Column (30% ) */}
          <div className="flex flex-col gap-8 animate-fade-up">
            
            {/* Goal Tracking - Modernized */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200/80 p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
               <h3 className="text-sm font-bold text-zinc-800 mb-6 flex items-center gap-2"><Target size={16} className="text-brand-500"/> Quarterly Retention Target</h3>
               <div className="relative pt-1">
                 <div className="flex mb-3 items-end justify-between">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase mb-1">Current</span>
                     <span className="text-4xl font-black text-zinc-900 tracking-tighter">92.4<span className="text-2xl text-zinc-400">%</span></span>
                   </div>
                   <div className="flex flex-col text-right">
                     <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase mb-1">Goal</span>
                     <span className="text-xl font-bold text-zinc-700">95.0%</span>
                   </div>
                 </div>
                 <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-zinc-100 shadow-inner">
                   <div style={{ width: "85%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full"></div>
                 </div>
                 <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                   You are currently trailing behind the Q3 retention target. Focus on mitigating high-risk customers to close the gap.
                 </p>
               </div>
            </div>

            {/* Campaign Summary - Modernized */}
            {campaignStats && campaignStats.total_campaigns > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200/80 p-6">
                <h3 className="text-sm font-bold text-zinc-800 mb-5 flex items-center gap-2">
                  <BarChart3 size={16} className="text-indigo-500" /> Active Campaigns
                </h3>
                <div className="space-y-4">
                  <CampaignStatRow label="Discount Campaign" value={campaignStats.discount_campaigns} total={campaignStats.total_campaigns} color="bg-amber-500" />
                  <CampaignStatRow label="Support Follow-up" value={campaignStats.support_followups} total={campaignStats.total_campaigns} color="bg-blue-500" />
                  <CampaignStatRow label="Loyalty Program" value={campaignStats.loyalty_enrollments} total={campaignStats.total_campaigns} color="bg-purple-500" />
                  <CampaignStatRow label="Product Rec." value={campaignStats.product_recommendations} total={campaignStats.total_campaigns} color="bg-emerald-500" />
                </div>
              </div>
            )}

            {/* Live Activity Feed - Modernized */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200/80 w-full flex flex-col overflow-hidden h-[420px]">
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center gap-2 bg-white sticky top-0 z-10">
                <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-600">
                  <BellRing size={16} />
                </div>
                <h2 className="text-sm font-bold text-zinc-900 tracking-tight">System Feed</h2>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="relative border-l-2 border-zinc-100 ml-2.5 space-y-8">
                  {activities.length > 0 ? activities.map((log: any, idx: number) => (
                    <div key={idx} className="relative pl-6 group">
                      <div className={cn(
                        "absolute w-3 h-3 rounded-full -left-[7px] top-1.5 transition-transform group-hover:scale-125 shadow-sm",
                        log.action?.includes('Campaign') || log.action?.includes('Assigned') || log.action?.includes('Mitigat')
                          ? "bg-brand-500 ring-4 ring-brand-50" 
                          : "bg-zinc-300 ring-4 ring-white"
                      )}></div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'}</div>
                      <div className="text-sm font-bold text-zinc-800">{log.action}</div>
                      <div className="text-xs text-zinc-500 mt-1 leading-relaxed">{log.details}</div>
                    </div>
                  )) : (
                    <div className="text-sm text-zinc-400 pl-6 italic">No recent activity detected.</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Retention Action Center Modal */}
      {selectedCustomer && (
        <RetentionActionCenter
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onSuccess={() => {
            // Optimistically mark this customer as mitigated immediately
            if (selectedCustomer?.id) {
              setMitigatedIds(prev => new Set(prev).add(selectedCustomer.id));
            }
            setSelectedCustomer(null);
            // Clear cache so the next fetch gets fresh data from server
            localStorage.removeItem(CACHE_KEY);
            fetchDashboardData(true);
          }}
        />
      )}
    </div>
  );
}

// Subcomponents

function MetricCard({ title, value, trend, isPositive, icon, gradient, pulse = false }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col hover:shadow-md transition-all group overflow-hidden relative">
      <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500`}></div>
      <div className="flex items-start justify-between mb-4 relative">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-inner`}>
          {icon}
        </div>
        {pulse && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        )}
      </div>
      <div className="relative">
        <h3 className="text-slate-500 text-sm font-semibold mb-1">{title}</h3>
        <div className="flex items-end gap-3">
          <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
          <div className={cn("flex items-center text-xs font-bold mb-1.5 px-1.5 py-0.5 rounded", isPositive ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50")}>
            {isPositive ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
            {trend}
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignStatRow({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1.5">
        <span className="text-zinc-700">{label}</span>
        <span className="text-zinc-900">{value} <span className="text-zinc-400 font-medium ml-1">({percentage}%)</span></span>
      </div>
      <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
        <div className={cn("h-1.5 rounded-full", color)} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
