import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Calendar, Download, Filter, FileSpreadsheet, LayoutGrid, Layers, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);

  const mockHistoricalData = [
    { month: 'Jan', active: 4000, churned: 240 },
    { month: 'Feb', active: 4200, churned: 210 },
    { month: 'Mar', active: 4100, churned: 290 },
    { month: 'Apr', active: 4500, churned: 180 },
    { month: 'May', active: 4800, churned: 150 },
    { month: 'Jun', active: 5100, churned: 120 },
  ];

  const mockFeatures = [
    { feature: 'Days Since Active', importance: 100 },
    { feature: 'API Calls (90d)', importance: 85 },
    { feature: 'Plan Tier', importance: 60 },
    { feature: 'Logins (90d)', importance: 45 },
    { feature: 'Age', importance: 20 },
  ];

  useEffect(() => {
    Promise.all([
      api.get('/analytics/historical-trend'),
      api.get('/analytics/feature-importance')
    ])
    .then(([trendRes, featuresRes]) => {
      setHistoricalData(trendRes.data && trendRes.data.length > 0 ? trendRes.data : mockHistoricalData);
      
      const featureData = featuresRes.data && featuresRes.data.length > 0 ? featuresRes.data : mockFeatures;
      const maxImp = Math.max(...featureData.map((f: any) => f.importance));
      setFeatures(featureData.map((f: any) => ({
        ...f, 
        importance: Math.round((f.importance / maxImp) * 100) 
      })));
    })
    .catch(err => {
      console.error("Error fetching analytics, using mock data fallback:", err);
      setHistoricalData(mockHistoricalData);
      setFeatures(mockFeatures);
    })
    .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc]">
      <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-200/60 bg-white sticky top-0 z-10 shrink-0">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-900">Deep Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-zinc-200 rounded-md bg-white overflow-hidden shadow-sm">
            <button className="px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 border-r border-zinc-200 flex items-center gap-1.5">
              <Calendar size={13} /> Last 6 Months
            </button>
            <button className="px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-1.5">
              <Filter size={13} /> All Segments
            </button>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-medium bg-zinc-900 text-white px-3 py-1.5 rounded-md shadow-sm hover:bg-zinc-800 transition-colors">
            <Download size={13} /> Export
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 w-full space-y-6">
        
        {/* Main Historical Chart */}
        <div className="saas-card flex flex-col overflow-hidden col-span-full">
          <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
            <div>
              <h2 className="saas-heading flex items-center gap-1.5"><TrendingUp size={16} className="text-zinc-500" /> Retention vs Churn Trend</h2>
              <p className="saas-subtext mt-0.5">Historical overlay of active and churned user cohorts over 6 months</p>
            </div>
          </div>
          <div className="p-6 bg-white w-full">
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={historicalData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#09090b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#09090b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '6px', border: '1px solid #e4e4e7', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.05)', fontSize: '12px', padding: '8px 12px' }}
                  itemStyle={{ color: '#09090b', fontWeight: 600, padding: 0 }}
                  labelStyle={{ color: '#71717a', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="active" stroke="#09090b" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
                <Area type="monotone" dataKey="churned" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorChurn)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analytical Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Feature Importance */}
          <div className="saas-card flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="saas-heading flex items-center gap-1.5"><Layers size={16} className="text-zinc-500" /> ML Feature Importance (XGBoost)</h2>
              <p className="saas-subtext mt-0.5">Top behavioral signals correlated with high churn probability</p>
            </div>
            <div className="p-6 w-full">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={features} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#52525b', fontWeight: 500 }} width={120} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{ borderRadius: '6px', border: '1px solid #e4e4e7', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                  />
                  <Bar dataKey="importance" fill="#27272a" radius={[0, 4, 4, 0]} barSize={24}>
                    {features.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : '#27272a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Placeholder for Cohort Analysis / Segmentation */}
          <div className="saas-card flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
              <div>
                <h2 className="saas-heading flex items-center gap-1.5"><LayoutGrid size={16} className="text-zinc-500" /> Retention by Plan Tier</h2>
                <p className="saas-subtext mt-0.5">Comparative survival rates across subscription levels</p>
              </div>
            </div>
            <div className="p-6 flex flex-col justify-center w-full">
                {/* Mock data for the line chart */}
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={[
                    { month: 'Month 1', Enterprise: 98, Pro: 95, Starter: 85 },
                    { month: 'Month 2', Enterprise: 97, Pro: 90, Starter: 75 },
                    { month: 'Month 3', Enterprise: 96, Pro: 85, Starter: 65 },
                    { month: 'Month 4', Enterprise: 95, Pro: 82, Starter: 55 },
                    { month: 'Month 5', Enterprise: 94, Pro: 78, Starter: 45 },
                    { month: 'Month 6', Enterprise: 92, Pro: 75, Starter: 35 },
                  ]} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '6px', border: '1px solid #e4e4e7', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="Enterprise" stroke="#09090b" strokeWidth={2} dot={{r: 3, strokeWidth: 2}} />
                    <Line type="monotone" dataKey="Pro" stroke="#71717a" strokeWidth={2} dot={{r: 3, strokeWidth: 2}} />
                    <Line type="monotone" dataKey="Starter" stroke="#ef4444" strokeWidth={2} dot={{r: 3, strokeWidth: 2}} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                   <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#09090b]"></div><span className="text-[11px] font-medium text-zinc-600">Enterprise</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#71717a]"></div><span className="text-[11px] font-medium text-zinc-600">Pro</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div><span className="text-[11px] font-medium text-zinc-600">Starter</span></div>
                </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
