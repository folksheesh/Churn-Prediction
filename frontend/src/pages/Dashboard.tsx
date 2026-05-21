import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Users, Activity, DollarSign, ArrowUpRight, ArrowDownRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/critical-alerts?limit=6'),
      api.get('/analytics/feature-importance'),
      api.get('/analytics/historical-trend')
    ])
    .then(([overviewRes, alertsRes, featuresRes, trendRes]) => {
      setMetrics(overviewRes.data);
      setAlerts(alertsRes.data);
      
      if (Array.isArray(featuresRes.data)) {
        const maxImp = Math.max(...featuresRes.data.map((f: any) => f.importance));
        setFeatures(featuresRes.data.map((f: any) => ({
          ...f, 
          importance: Math.round((f.importance / maxImp) * 100) 
        })));
      } else {
        setFeatures([]);
      }
      
      setHistoricalData(trendRes.data);
    })
    .catch(err => console.error("Error fetching dashboard data:", err))
    .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-200 bg-white sticky top-0 z-10 shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Intelligence Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">Last updated: Just now</div>
          <button className="text-sm font-medium bg-zinc-900 text-white px-3 py-1.5 rounded-md shadow-sm hover:bg-zinc-800 transition-colors">
            Generate Report
          </button>
        </div>
      </header>

      <div className="p-8 max-w-[1400px] mx-auto w-full space-y-6">
        
        {/* Top KPI Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Total Active Customers" 
            value={metrics?.retained?.toLocaleString() || "—"} 
            trend="+2.4%" isPositive={true}
            icon={<Users size={16} />} 
          />
          <MetricCard 
            title="Predicted Churn Rate" 
            value={`${metrics?.churn_rate?.toFixed(2) || 0}%`} 
            trend="-0.5%" isPositive={true}
            icon={<Activity size={16} />} 
          />
          <MetricCard 
            title="MRR At Risk" 
            value={`$${metrics?.at_risk_mrr?.toLocaleString() || "0"}`} 
            trend="+12.5%" isPositive={false}
            icon={<DollarSign size={16} />} 
            alert={true}
          />
          <MetricCard 
            title="Critical Risk Alerts" 
            value={alerts.length.toString()} 
            trend="+3" isPositive={false}
            icon={<ShieldAlert size={16} />} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Customer Retention Trend</h2>
                <p className="text-sm text-zinc-500 mt-0.5">Historical active vs churned user counts (6 mo)</p>
              </div>
            </div>
            <div className="p-6 flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }}
                    itemStyle={{ color: '#09090b', fontWeight: 500 }}
                  />
                  <Area type="monotone" dataKey="active" stroke="#18181b" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Importance Side Panel */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100">
              <h2 className="text-base font-semibold text-zinc-900">Key Churn Drivers</h2>
              <p className="text-sm text-zinc-500 mt-0.5">XGBoost model feature importance</p>
            </div>
            <div className="p-6 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={features} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#52525b' }} width={110} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Bar dataKey="importance" fill="#a1a1aa" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Operational Triage Table */}
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              <h2 className="text-base font-semibold text-zinc-900">Action Required: Critical Risk</h2>
            </div>
          </div>
          
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 bg-zinc-50 uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Risk Score</th>
                  <th className="px-6 py-3 font-medium">Plan</th>
                  <th className="px-6 py-3 font-medium">Key Signal</th>
                  <th className="px-6 py-3 font-medium text-right">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {alerts.map((row, i) => (
                  <tr key={i} className="hover:bg-zinc-50/80 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="font-medium text-zinc-900">{row.name}</div>
                      <div className="text-[11px] font-mono text-zinc-500">{row.id}</div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-rose-600">{row.score}%</span>
                        <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${row.score}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-zinc-600">{row.plan}</td>
                    <td className="px-6 py-3 text-xs font-medium text-zinc-600">{row.signal}</td>
                    <td className="px-6 py-3 text-right">
                      <button className="text-xs font-medium bg-white border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm">
                        Engage via CS
                      </button>
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                      No critical risk customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}

function MetricCard({ title, value, trend, isPositive, icon, alert = false }: any) {
  return (
    <div className={cn(
      "bg-white border rounded-lg p-5 flex flex-col relative overflow-hidden shadow-sm transition-all hover:shadow-md",
      alert ? "border-rose-200" : "border-zinc-200"
    )}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-medium text-zinc-500">{title}</span>
        <div className="text-zinc-400">
          {icon}
        </div>
      </div>
      
      <div className="mt-1">
        <span className="text-2xl font-bold text-zinc-900 tracking-tight">{value}</span>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <span className={cn(
          "text-[11px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-0.5",
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
