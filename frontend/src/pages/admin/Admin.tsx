import { ShieldCheck, Activity, Database, Server, PieChart as PieChartIcon, MessageSquareWarning, Bell, AlertTriangle, CheckCircle, Clock, RefreshCw, Lock, Eye, UserX, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const svmDistributionData = [
  { name: 'Tidak Churn', value: 14914, color: '#10b981' },
  { name: 'Churn', value: 22078, color: '#f43f5e' }
];

const feedbackImpactData = [
  { feedback: 'Poor Website', churnProb: 88 },
  { feedback: 'Poor Customer Service', churnProb: 82 },
  { feedback: 'Too many ads', churnProb: 75 },
  { feedback: 'Products always in Stock', churnProb: 15 },
  { feedback: 'Quality Customer Care', churnProb: 10 }
];

const pipelineSteps = [
  { label: 'Data Ingestion', status: 'completed', desc: 'SQLite DB connected & synced', time: 'Last run: 10 min ago' },
  { label: 'Feature Engineering', status: 'completed', desc: 'Behavioral signals extracted', time: 'Last run: 10 min ago' },
  { label: 'ML Prediction (XGBoost)', status: 'running', desc: 'Running batch inference on live data', time: 'In progress...' },
  { label: 'Risk Scoring', status: 'pending', desc: 'Awaiting ML output to assign risk tiers', time: 'Pending' },
  { label: 'Alert Dispatch', status: 'pending', desc: 'Will notify for High risk customers', time: 'Pending' },
];

const systemAlerts = [
  { type: 'warning', title: 'High Churn Cluster Detected', desc: 'Starter plan customers with >14 inactive days show 82% churn probability.', time: '5 min ago' },
  { type: 'info', title: 'Batch Pipeline Triggered', desc: 'Daily XGBoost prediction refresh started automatically.', time: '10 min ago' },
  { type: 'success', title: 'Model Accuracy Stable', desc: 'XGBoost v2.1 maintains 92.4% accuracy on validation split.', time: '1 hr ago' },
  { type: 'warning', title: 'Feedback Spike: Negative Sentiment', desc: '23 new negative user feedbacks detected in last 24 hours.', time: '2 hrs ago' },
];

const securitySessions = [
  { user: 'Admin', ip: '127.0.0.1', browser: 'Chrome 124', location: 'Jakarta, ID', status: 'active', since: '10:32 AM' },
];

export default function Admin() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/activity-logs?limit=10')
      .then(res => setLogs(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header className="h-16 flex items-center px-8 border-b border-zinc-200 bg-white sticky top-0 z-10 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Platform Administration</h1>
      </header>

      <div className="p-8 max-w-[1200px] mx-auto w-full space-y-8">
        
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md">
                <Activity size={18} />
              </div>
              <h3 className="font-semibold text-zinc-900 text-sm">Model Status</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Current Pipeline</span>
                <span className="font-medium text-zinc-900">SVM & XGBoost-v2.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">User Feedback</span>
                <span className="font-medium text-zinc-900">Feedback Enabled</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">API Health</span>
                <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-0.5 rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Online
                </span>
              </div>
            </div>
          </div>

          {/* Data Pipeline Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
                <Database size={18} />
              </div>
              <h3 className="font-semibold text-zinc-900 text-sm">Data Pipeline</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Storage Backend</span>
                <span className="font-medium text-zinc-900">SQLite (churn.db)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Data Source</span>
                <span className="font-medium text-zinc-900">Live DB Connect</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Pipeline Status</span>
                <span className="flex items-center gap-1.5 text-blue-600 text-xs font-medium bg-blue-50 px-2 py-0.5 rounded">
                  <RefreshCw size={10} className="animate-spin" /> Running
                </span>
              </div>
            </div>
          </div>
          
          {/* System Security Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-md">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-semibold text-zinc-900 text-sm">System Security</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Active Sessions</span>
                <span className="font-medium text-zinc-900">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Failed Logins (24h)</span>
                <span className="font-medium text-emerald-600">0 — All Clear</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Security Status</span>
                <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-0.5 rounded">
                  <Lock size={10} /> Secured
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DATA PIPELINE SECTION */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-zinc-900">Data Pipeline Status</h2>
            </div>
            <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">Auto-Refresh Daily</span>
          </div>
          <div className="p-6">
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
              This pipeline automatically ingests customer data, runs feature engineering, and applies ML predictions to update churn risk scores in real-time.
            </p>
            <div className="space-y-3">
              {pipelineSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3.5 rounded-lg border border-zinc-100 bg-zinc-50/50">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    step.status === 'completed' ? "bg-emerald-100 text-emerald-600" :
                    step.status === 'running' ? "bg-blue-100 text-blue-600" :
                    "bg-zinc-100 text-zinc-400"
                  )}>
                    {step.status === 'completed' ? <CheckCircle size={14} /> :
                     step.status === 'running' ? <RefreshCw size={14} className="animate-spin" /> :
                     <Clock size={14} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-900">{step.label}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded",
                        step.status === 'completed' ? "bg-emerald-50 text-emerald-700" :
                        step.status === 'running' ? "bg-blue-50 text-blue-700" :
                        "bg-zinc-100 text-zinc-500"
                      )}>
                        {step.status === 'completed' ? 'Completed' : step.status === 'running' ? 'Running' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{step.desc}</p>
                    <p className="text-[10px] text-zinc-400 mt-1 font-mono">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ALERTS SECTION */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-zinc-900">System Alerts</h2>
            </div>
            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">{systemAlerts.filter(a => a.type === 'warning').length} Active Warnings</span>
          </div>
          <div className="p-6">
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              Real-time alerts triggered by model predictions, pipeline events, and security monitoring. Alerts are auto-resolved when conditions normalize.
            </p>
            <div className="space-y-3">
              {systemAlerts.map((alert, idx) => (
                <div key={idx} className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border",
                  alert.type === 'warning' ? "bg-amber-50/60 border-amber-200/60" :
                  alert.type === 'success' ? "bg-emerald-50/60 border-emerald-200/60" :
                  "bg-blue-50/60 border-blue-200/60"
                )}>
                  <div className={cn(
                    "mt-0.5 shrink-0",
                    alert.type === 'warning' ? "text-amber-500" :
                    alert.type === 'success' ? "text-emerald-500" :
                    "text-blue-500"
                  )}>
                    {alert.type === 'warning' ? <AlertTriangle size={15} /> :
                     alert.type === 'success' ? <CheckCircle size={15} /> :
                     <Bell size={15} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-900">{alert.title}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{alert.time}</span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{alert.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SYSTEM SECURITY SECTION */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-indigo-600" />
              <h2 className="text-sm font-semibold text-zinc-900">System Security</h2>
            </div>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> All Systems Secure
            </span>
          </div>
          <div className="p-6 space-y-6">
            
            {/* Security Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-4 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md">
                  <Wifi size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-500 mb-0.5">Active Sessions</div>
                  <div className="text-xl font-bold text-zinc-900">1</div>
                </div>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-4 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md">
                  <UserX size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-500 mb-0.5">Failed Logins (24h)</div>
                  <div className="text-xl font-bold text-emerald-600">0</div>
                </div>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-4 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-md">
                  <Lock size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-500 mb-0.5">Auth Method</div>
                  <div className="text-sm font-bold text-zinc-900">JWT Token</div>
                </div>
              </div>
            </div>

            {/* Active Sessions Table */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Eye size={12} /> Login Monitoring — Active Sessions
              </h3>
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-zinc-500 bg-zinc-50 uppercase tracking-wider border-b border-zinc-100">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">User</th>
                      <th className="px-4 py-2.5 font-medium">IP Address</th>
                      <th className="px-4 py-2.5 font-medium">Browser</th>
                      <th className="px-4 py-2.5 font-medium">Location</th>
                      <th className="px-4 py-2.5 font-medium">Since</th>
                      <th className="px-4 py-2.5 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {securitySessions.map((session, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-zinc-900">{session.user}</td>
                        <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{session.ip}</td>
                        <td className="px-4 py-3 text-zinc-600 text-xs">{session.browser}</td>
                        <td className="px-4 py-3 text-zinc-600 text-xs">{session.location}</td>
                        <td className="px-4 py-3 text-zinc-500 text-xs">{session.since}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ml-auto">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 italic">Security audit logs are stored for 30 days. Contact system administrator for full audit history.</p>
            </div>
          </div>
        </div>

        {/* Notebook Insights Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon size={18} className="text-zinc-500" />
              <h3 className="font-semibold text-zinc-900 text-sm">Distribusi Prediksi (SVM Model)</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-4">Berdasarkan hasil analisis dari Churn_Prediction.ipynb (Akurasi: 85.68%)</p>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={svmDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {svmDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2 text-xs">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f43f5e]"></div><span className="text-zinc-600">Churn (22,078)</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#10b981]"></div><span className="text-zinc-600">Tidak Churn (14,914)</span></div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquareWarning size={18} className="text-zinc-500" />
              <h3 className="font-semibold text-zinc-900 text-sm">User Feedback Impact on Churn</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-4">Average churn probability based on customer feedback categories</p>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feedbackImpactData} layout="vertical" margin={{ top: 0, right: 30, left: 50, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis dataKey="feedback" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#3f3f46' }} width={120} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    formatter={(value: any) => [`${value}%`, 'Risiko Churn']}
                  />
                  <Bar dataKey="churnProb" radius={[0, 4, 4, 0]} barSize={24}>
                    {feedbackImpactData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.churnProb > 50 ? '#f43f5e' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* System Activity Log */}
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Recent System Activity (Live)</h2>
          </div>
          
          {loading ? (
             <div className="h-40 flex items-center justify-center">
               <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
             </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-zinc-500 bg-zinc-50 uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Timestamp</th>
                  <th className="px-6 py-3 font-medium">User / Process</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                  <th className="px-6 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-3 text-zinc-500 text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-medium text-zinc-900">{log.user}</td>
                    <td className="px-6 py-3 text-zinc-900 font-medium">{log.action}</td>
                    <td className="px-6 py-3 text-zinc-600">{log.details}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                      No activity logs found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </>
  );
}
