import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Users, Activity, DollarSign, ArrowUpRight, ArrowDownRight, ShieldAlert, CheckCircle2, BellRing, ArrowRight, Zap, Target, ChevronDown, Headphones, Tag, Star, Package, Loader2, Check, AlertTriangle, UserCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

// Campaign-based triage options
const triageOptions = [
  { value: 'discount_campaign', label: 'Discount Campaign', icon: '🏷️' },
  { value: 'customer_support_followup', label: 'Customer Support Follow-up', icon: '🎧' },
  { value: 'loyalty_program_enrollment', label: 'Loyalty Program Enrollment', icon: '⭐' },
  { value: 'product_recommendation', label: 'Product Recommendation', icon: '📦' },
];

function getSmartDefaultCampaign(row: any): string {
  // AI-powered campaign recommendation based on customer signals
  const signal = (row.signal || '').toLowerCase();
  const score = row.score || 0;
  
  // High inactivity → Loyalty Program to re-engage
  if (signal.includes('inactive') || signal.includes('no login')) {
    return 'loyalty_program_enrollment';
  }
  // Support ticket issues → Customer Support Follow-up
  if (signal.includes('ticket') || signal.includes('support')) {
    return 'customer_support_followup';
  }
  // Very high churn score → Discount to retain
  if (score >= 85) {
    return 'discount_campaign';
  }
  // Low activity → Product Recommendation
  if (signal.includes('low activity')) {
    return 'product_recommendation';
  }
  // Default
  return 'discount_campaign';
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [triageActions, setTriageActions] = useState<Record<string, string>>({});
  const [triageProcessing, setTriageProcessing] = useState<Record<string, 'idle' | 'processing' | 'done' | 'error'>>({});
  const [triageErrors, setTriageErrors] = useState<Record<string, string>>({});
  const [campaignStats, setCampaignStats] = useState<any>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [overviewRes, alertsRes, activityRes, statsRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/critical-alerts?limit=6'),
        api.get('/analytics/activity-logs?limit=5'),
        api.get('/mitigation/stats').catch(() => ({ data: null })),
      ]);

      setMetrics(overviewRes.data);
      const alertData = alertsRes.data;
      setAlerts(alertData);
      setActivities(activityRes.data || []);
      if (statsRes.data) setCampaignStats(statsRes.data);
      
      // Set smart default campaign for each customer
      const defaults: Record<string, string> = {};
      const initialProcessing: Record<string, 'idle' | 'processing' | 'done' | 'error'> = {};
      
      alertData.forEach((row: any) => {
        if (row.mitigation_status === 'Assigned') {
          initialProcessing[row.id] = 'done';
          defaults[row.id] = getSmartDefaultCampaign(row);
        } else {
          defaults[row.id] = getSmartDefaultCampaign(row);
        }
      });
      
      setTriageActions(defaults);
      setTriageProcessing(initialProcessing);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTriageChange = (customerId: string, value: string) => {
    setTriageActions(prev => ({ ...prev, [customerId]: value }));
    // Reset processing state when action changes
    setTriageProcessing(prev => ({ ...prev, [customerId]: 'idle' }));
    setTriageErrors(prev => ({ ...prev, [customerId]: '' }));
  };

  const handleExecuteTriage = async (customerId: string) => {
    const campaign = triageActions[customerId];
    if (!campaign) return;

    setTriageProcessing(prev => ({ ...prev, [customerId]: 'processing' }));
    setTriageErrors(prev => ({ ...prev, [customerId]: '' }));
    
    try {
      // Call campaign assignment API
      const res = await api.post('/mitigation/execute', {
        customer_id: customerId,
        campaign_name: campaign,
        notes: `Assigned from Dashboard triage`,
      });

      setTriageProcessing(prev => ({ ...prev, [customerId]: 'done' }));
      
      // Log result to activities (local state for immediate feedback)
      const label = triageOptions.find(o => o.value === campaign)?.label || campaign;
      const customer = alerts.find(a => a.id === customerId);
      
      setActivities(prev => [{
        timestamp: new Date().toISOString(),
        action: `Campaign Assigned: ${label}`,
        details: `${label} assigned to ${customer?.name || customerId}`,
        user: 'Admin'
      }, ...prev.slice(0, 4)]);

      // Refresh campaign stats
      try {
        const statsRes = await api.get('/mitigation/stats');
        setCampaignStats(statsRes.data);
      } catch {}

    } catch (err: any) {
      console.error("Triage execution failed:", err);
      setTriageProcessing(prev => ({ ...prev, [customerId]: 'error' }));
      setTriageErrors(prev => ({ 
        ...prev, 
        [customerId]: err.response?.data?.detail || 'Assignment failed. Please try again.' 
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-200/60 bg-white sticky top-0 z-10 shrink-0">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-900">Operational Overview</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Live Updates
          </div>
        </div>
      </header>

      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">
        
        {/* Top KPI Widgets - Compact SaaS Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Total Customers" 
            value={metrics?.total_customers?.toLocaleString() || "—"} 
            trend="+2.4%" isPositive={true}
            icon={<Users size={14} />} 
          />
          <MetricCard 
            title="Predicted Churn Rate" 
            value={`${metrics?.churn_rate?.toFixed(2) || 0}%`} 
            trend="-0.5%" isPositive={true}
            icon={<Activity size={14} />} 
          />
          <MetricCard 
            title="MRR At Risk" 
            value={`$${metrics?.at_risk_mrr?.toLocaleString() || "0"}`} 
            trend="+12.5%" isPositive={false}
            icon={<DollarSign size={14} />} 
            alert={true}
          />
          <MetricCard 
            title="Critical Risk Alerts" 
            value={alerts.length.toString()} 
            trend="+3" isPositive={false}
            icon={<ShieldAlert size={14} />} 
            alert={alerts.length > 0}
          />
        </div>

        {/* Campaign Stats Bar */}
        {campaignStats && campaignStats.total_campaigns > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MiniStat label="Total Campaigns" value={campaignStats.total_campaigns} color="bg-zinc-100 text-zinc-700" />
            <MiniStat label="Discount" value={campaignStats.discount_campaigns} color="bg-amber-50 text-amber-700" />
            <MiniStat label="Support Follow-up" value={campaignStats.support_followups} color="bg-blue-50 text-blue-700" />
            <MiniStat label="Loyalty Program" value={campaignStats.loyalty_enrollments} color="bg-purple-50 text-purple-700" />
            <MiniStat label="Product Rec." value={campaignStats.product_recommendations} color="bg-emerald-50 text-emerald-700" />
          </div>
        )}

        {/* Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Operational Column (70%) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* AI Recommendation Strip */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-md p-4 flex gap-4 items-start shadow-sm">
              <div className="mt-0.5 text-indigo-500 bg-indigo-100 p-1.5 rounded-md"><Zap size={16} className="animate-pulse" /></div>
              <div className="flex-1">
                <h3 className="saas-heading text-indigo-950">AI Retention Opportunity Detected</h3>
                <p className="text-[13px] text-indigo-800/80 mt-1 leading-relaxed">
                  Our model recommends assigning targeted retention campaigns to high-risk customers. 
                  Use the triage table below to assign the AI-recommended campaign for each customer.
                </p>
              </div>
              <Link to="/customers" className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded shadow-sm hover:bg-indigo-700 transition-all active:scale-[0.97] hover:shadow shrink-0">
                Open CRM
              </Link>
            </div>

            {/* Operational Triage Table - Campaign-based */}
            <div className="saas-card flex flex-col overflow-hidden flex-1">
              <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                  <h2 className="saas-heading">Needs Immediate Attention</h2>
                </div>
                <Link to="/customers" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                  View all in CRM <ArrowRight size={12} />
                </Link>
              </div>
              
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] text-zinc-400 bg-white uppercase tracking-wider border-b border-zinc-100">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">Customer</th>
                      <th className="px-5 py-2.5 font-medium">Risk Signal</th>
                      <th className="px-5 py-2.5 font-medium">Retention Campaign</th>
                      <th className="px-5 py-2.5 font-medium text-right">Assign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {alerts.map((row, i) => {
                      const currentCampaign = triageActions[row.id] || getSmartDefaultCampaign(row);
                      const processState = triageProcessing[row.id] || 'idle';
                      const errorMsg = triageErrors[row.id] || '';
                      
                      return (
                        <tr key={i} className="hover:bg-zinc-50/50 transition-colors group">
                          <td className="px-5 py-3">
                            <div className="font-medium text-zinc-900 text-[13px]">{row.name}</div>
                            <div className="text-[11px] font-mono text-zinc-500 mt-0.5">{row.id} • {row.plan}</div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-rose-600 text-[13px]">{row.score}% Prob.</span>
                                <div className="w-12 h-1 bg-zinc-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${row.score}%` }}></div>
                                </div>
                              </div>
                              <span className="text-[11px] font-medium text-zinc-600 bg-zinc-100 inline-block px-1.5 py-0.5 rounded w-max">{row.signal}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="relative">
                              <select 
                                value={currentCampaign}
                                onChange={(e) => handleTriageChange(row.id, e.target.value)}
                                disabled={processState === 'done'}
                                className={cn(
                                  "w-full text-[11px] font-semibold pl-3 pr-7 py-1.5 rounded border appearance-none cursor-pointer transition-all",
                                  processState === 'done' 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                )}
                              >
                                {triageOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.icon} {opt.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                            {errorMsg && (
                              <p className="text-[10px] text-rose-500 mt-1">{errorMsg}</p>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {processState === 'done' ? (
                                <>
                                  <span className="text-[11px] font-semibold bg-indigo-50/50 text-indigo-600 border border-indigo-100 px-2.5 py-1.5 rounded flex items-center gap-1.5">
                                    <Tag size={12} /> Assigned
                                  </span>
                                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-1.5 rounded flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Done
                                  </span>
                                </>
                              ) : processState === 'error' ? (
                                <button 
                                  onClick={() => handleExecuteTriage(row.id)}
                                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded transition-all shadow-sm flex items-center gap-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 active:scale-[0.97]"
                                >
                                  <AlertTriangle size={11} /> Retry
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleExecuteTriage(row.id)}
                                  disabled={processState === 'processing'}
                                  className={cn(
                                    "text-[11px] font-semibold px-2.5 py-1.5 rounded transition-all shadow-sm flex items-center gap-1.5",
                                    processState === 'processing' 
                                      ? "bg-zinc-100 text-zinc-400 border border-zinc-200"
                                      : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.97]"
                                  )}
                                >
                                  {processState === 'processing' ? (
                                    <><Loader2 size={12} className="animate-spin" /> Assigning...</>
                                  ) : (
                                    <><Sparkles size={11} /> Assign</>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {alerts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                          <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                          <span className="text-sm font-medium">No critical risks currently active.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Campaign Assignment Integration Banner */}
              {alerts.length > 0 && (
                <div className="px-5 py-3 border-t border-zinc-100 bg-indigo-50/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Sparkles size={14} className="text-indigo-500" />
                    <span className="font-medium">Retention Action Center</span>
                    <span className="text-zinc-400">— All campaign assignments are recorded and tracked in the system</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Context Column (30%) */}
          <div className="flex flex-col gap-6">
            
            {/* System Health / Goal Tracking */}
            <div className="saas-card p-5">
               <h3 className="saas-heading mb-4 flex items-center gap-1.5"><Target size={14} className="text-zinc-500"/> Quarterly Retention Goal</h3>
               <div className="relative pt-1">
                 <div className="flex mb-2 items-center justify-between">
                   <div>
                     <span className="text-2xl font-bold text-zinc-900">92.4%</span>
                   </div>
                   <div className="text-right">
                     <span className="text-xs font-semibold inline-block text-zinc-500">
                       Target: 95.0%
                     </span>
                   </div>
                 </div>
                 <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-zinc-100">
                   <div style={{ width: "85%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-zinc-900"></div>
                 </div>
                 <p className="text-[11px] text-zinc-500 leading-relaxed">
                   You are currently trailing behind the Q3 retention target. Focus on assigning campaigns to high-risk customers.
                 </p>
               </div>
            </div>

            {/* Campaign Summary */}
            <div className="saas-card p-5">
              <h3 className="saas-heading mb-4 flex items-center gap-1.5">
                <Tag size={14} className="text-zinc-500" /> Campaign Summary
              </h3>
              <div className="space-y-2.5">
                {triageOptions.map(opt => {
                  const count = Object.values(triageActions).filter(v => v === opt.value).length;
                  if (count === 0) return null;
                  return (
                    <div key={opt.value} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 font-medium">{opt.icon} {opt.label}</span>
                      <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">{count}</span>
                    </div>
                  );
                })}
                {Object.values(triageProcessing).filter(v => v === 'done').length > 0 && (
                  <div className="pt-2 mt-2 border-t border-zinc-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Assigned
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {Object.values(triageProcessing).filter(v => v === 'done').length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="saas-card flex-1 flex flex-col overflow-hidden min-h-[300px]">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-1.5 bg-zinc-50/50">
                <BellRing size={14} className="text-zinc-500" />
                <h2 className="saas-heading">Live System Feed</h2>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                <div className="relative border-l border-zinc-200 ml-2 space-y-6">
                  {activities.length > 0 ? activities.map((log: any, idx: number) => (
                    <div key={idx} className="relative pl-4">
                      <div className={cn(
                        "absolute w-2 h-2 border-2 rounded-full -left-[5px] top-1",
                        log.action?.includes('Campaign') || log.action?.includes('Assigned')
                          ? "bg-indigo-500 border-indigo-200" 
                          : "bg-white border-zinc-300"
                      )}></div>
                      <div className="text-[10px] text-zinc-400 font-mono mb-0.5">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'}</div>
                      <div className="text-xs font-semibold text-zinc-900">{log.action}</div>
                      <div className="text-[11px] text-zinc-600 mt-0.5">{log.details}</div>
                    </div>
                  )) : (
                    <div className="text-xs text-zinc-500 pl-4">No recent activity detected.</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

function MetricCard({ title, value, trend, isPositive, icon, alert }: { title: string, value: string, trend: string, isPositive: boolean, icon: React.ReactNode, alert?: boolean }) {
  return (
    <div className={cn(
      "saas-card p-4 flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5 duration-200",
      alert ? "border-rose-200/60 bg-rose-50/10" : ""
    )}>
      <div className="flex justify-between items-start mb-1.5">
        <span className="text-[11px] font-medium text-zinc-500 tracking-wide uppercase">{title}</span>
        <div className={cn("p-1.5 rounded-md", alert ? "bg-rose-100 text-rose-600" : "bg-zinc-100 text-zinc-500")}>
          {icon}
        </div>
      </div>
      
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-zinc-900 tracking-tight leading-none">{value}</span>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <span className={cn(
          "text-[10px] font-semibold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5",
          isPositive ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
        )}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </span>
        <span className="text-[11px] text-zinc-400">vs last month</span>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className={cn("rounded-md p-3 text-center", color)}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</div>
    </div>
  );
}
