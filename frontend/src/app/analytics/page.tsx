'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const featureImportance = [
    { feature: 'Days Since Active', importance: 0.35 },
    { feature: 'API Calls (90d)', importance: 0.22 },
    { feature: 'Support Tickets', importance: 0.15 },
    { feature: 'Avg Session', importance: 0.11 },
    { feature: 'Points Wallet', importance: 0.08 },
    { feature: 'Transaction Val', importance: 0.05 },
  ];

  return (
    <>
      <header className="h-16 flex items-center px-8 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">Analytics & Insights</h1>
      </header>

      <div className="p-8 max-w-7xl mx-auto w-full">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Feature Importance</h2>
            <p className="text-xs text-slate-500 mb-6">Key drivers influencing the churn prediction model</p>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureImportance} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={100} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="importance" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Model Performance</h2>
            <p className="text-xs text-slate-500 mb-6">XGBoost validation metrics</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">ROC-AUC</div>
                <div className="text-3xl font-bold text-indigo-600">0.924</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Accuracy</div>
                <div className="text-3xl font-bold text-slate-900">89.5%</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Precision (Churn)</div>
                <div className="text-3xl font-bold text-slate-900">84.2%</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Recall (Churn)</div>
                <div className="text-3xl font-bold text-slate-900">79.1%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
