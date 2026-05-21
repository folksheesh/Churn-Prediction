import { ShieldCheck, Activity, Database, Server, PieChart as PieChartIcon, MessageSquareWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const svmDistributionData = [
  { name: 'Tidak Churn', value: 14914, color: '#10b981' }, // 40.3%
  { name: 'Churn', value: 22078, color: '#f43f5e' }       // 59.7%
];

const feedbackImpactData = [
  { feedback: 'Poor Website', churnProb: 88 },
  { feedback: 'Poor Customer Service', churnProb: 82 },
  { feedback: 'Too many ads', churnProb: 75 },
  { feedback: 'Products always in Stock', churnProb: 15 },
  { feedback: 'Quality Customer Care', churnProb: 10 }
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

      <div className="p-8 max-w-[1200px] mx-auto w-full space-y-6">
        
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
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
                <span className="text-zinc-500">NLP Insights</span>
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

          <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
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
                <span className="text-zinc-500">Sync Status</span>
                <span className="text-zinc-900 font-medium">Real-time</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
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
                <span className="text-zinc-500">Failed Logins</span>
                <span className="font-medium text-zinc-900">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Audit Logs</span>
                <button className="text-indigo-600 font-medium hover:underline">View logs</button>
              </div>
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
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
              <h3 className="font-semibold text-zinc-900 text-sm">Dampak Feedback terhadap Churn</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-4">Rata-rata probabilitas churn berdasarkan keluhan pelanggan</p>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feedbackImpactData} layout="vertical" margin={{ top: 0, right: 30, left: 50, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis dataKey="feedback" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#3f3f46' }} width={120} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    formatter={(value: number) => [`${value}%`, 'Risiko Churn']}
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
