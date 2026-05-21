'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import KpiCard from '@/components/KpiCard';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Users, AlertTriangle, CheckCircle, Activity, LayoutDashboard, Database, Settings } from 'lucide-react';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/risk-distribution')
    ])
    .then(([overviewRes, riskRes]) => {
      setMetrics(overviewRes.data);
      setRiskData(riskRes.data);
    })
    .catch(err => console.error("Error fetching dashboard data:", err))
    .finally(() => setLoading(false));
  }, []);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];
  const pieData = riskData ? [
    { name: 'Low Risk', value: riskData.low_risk },
    { name: 'Medium Risk', value: riskData.medium_risk },
    { name: 'High Risk', value: riskData.high_risk }
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 font-bold">C</div>
          <span className="font-semibold tracking-tight text-slate-900">ChurnSense</span>
        </div>
        
        <div className="p-4 flex-1">
          <div className="text-xs font-semibold text-slate-400 mb-4 px-2 uppercase tracking-wider">Overview</div>
          <nav className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md bg-indigo-50 text-indigo-700">
              <LayoutDashboard size={18} /> Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <Users size={18} /> Customers
            </a>
            <a href="#" className="flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <Activity size={18} /> Analytics
            </a>
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-600">Model Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 flex items-center px-8 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Operational Dashboard</h1>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard 
              title="Total Customers" 
              value={metrics?.total_customers?.toLocaleString() || "—"} 
              icon={<Users size={18} />}
              iconBgColor="bg-blue-100" iconColor="text-blue-600"
            />
            <KpiCard 
              title="Churn Rate" 
              value={`${metrics?.churn_rate || 0}%`} 
              trend="2.4%" 
              isPositive={false}
              icon={<Activity size={18} />}
              iconBgColor="bg-indigo-100" iconColor="text-indigo-600"
            />
            <KpiCard 
              title="Retained Customers" 
              value={metrics?.retained?.toLocaleString() || "—"} 
              trend="98.1%" 
              isPositive={true}
              icon={<CheckCircle size={18} />}
              iconBgColor="bg-emerald-100" iconColor="text-emerald-600"
            />
            <KpiCard 
              title="At-Risk (High)" 
              value={riskData?.high_risk?.toLocaleString() || "—"} 
              trend="14 new" 
              isPositive={false}
              icon={<AlertTriangle size={18} />}
              iconBgColor="bg-rose-100" iconColor="text-rose-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Alerts Table (Hero Element) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-slate-200 bg-white">
                <h2 className="text-sm font-semibold text-slate-900">Critical Risk Alerts</h2>
                <p className="text-xs text-slate-500 mt-1">Customers with &gt;80% churn probability</p>
              </div>
              
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-medium">Customer ID</th>
                      <th className="px-6 py-3 font-medium">Risk Score</th>
                      <th className="px-6 py-3 font-medium">Plan</th>
                      <th className="px-6 py-3 font-medium text-right">Key Signal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { id: '#4092', score: 92, plan: 'Enterprise', signal: 'Logins 90d: 2' },
                      { id: '#1123', score: 88, plan: 'Pro', signal: 'API Calls: 0' },
                      { id: '#8943', score: 85, plan: 'Pro', signal: 'Support Tickets: 4' },
                      { id: '#2291', score: 81, plan: 'Starter', signal: 'Days inactive: 45' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-700 flex items-center font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 shadow-[0_0_4px_rgba(244,63,94,0.5)]"></span>
                          {row.id}
                        </td>
                        <td className="px-6 py-4 font-semibold text-rose-600">{row.score}%</td>
                        <td className="px-6 py-4 text-slate-600">{row.plan}</td>
                        <td className="px-6 py-4 text-right text-xs font-medium text-slate-500">{row.signal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk Distribution Chart */}
            <div className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm">
              <div className="px-6 py-5 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-900">Risk Distribution</h2>
                <p className="text-xs text-slate-500 mt-1">Customer base by probability</p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#0f172a', fontWeight: '500' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex gap-4 mt-2">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center text-xs font-medium text-slate-600">
                      <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: COLORS[index] }}></span>
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
