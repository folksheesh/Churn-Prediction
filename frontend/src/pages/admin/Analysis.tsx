import React from 'react';
import { ShieldAlert, BarChart3, Target, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  LineChart,
  Line
} from 'recharts';

const riskData = [
  { name: 'Low Risk', value: 4500, fill: '#10b981' },
  { name: 'Medium Risk', value: 1200, fill: '#f59e0b' },
  { name: 'High Risk', value: 350, fill: '#ef4444' },
];

const trendData = [
  { month: 'Jan', churnRate: 4.2 },
  { month: 'Feb', churnRate: 4.0 },
  { month: 'Mar', churnRate: 4.5 },
  { month: 'Apr', churnRate: 3.8 },
  { month: 'May', churnRate: 3.5 },
  { month: 'Jun', churnRate: 3.2 },
];

export default function Analysis() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Churn Analysis</h1>
        <p className="text-sm text-zinc-500 mt-1">Deep dive into customer churn factors and retention strategies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Risk Distribution Card */}
        <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <ShieldAlert size={18} className="text-blue-600" />
              Customer Risk Distribution
            </h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} width={100} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-zinc-500 mt-2 text-center">Currently analyzing 6,050 active customers.</p>
        </div>

        {/* Monthly Churn Trend Card */}
        <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              Monthly Churn Trend
            </h2>
            <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1">
              <ArrowDownRight size={14} /> 12% vs Last Yr
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} unit="%" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px' }} />
                <Line type="monotone" dataKey="churnRate" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Churn Factors */}
        <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900 mb-6 flex items-center gap-2">
            <Target size={18} className="text-blue-600" />
            Top Churn Factors
          </h2>
          <div className="space-y-5">
            {[
              { factor: 'Low Platform Usage (Last 30d)', impact: 85, severity: 'high' },
              { factor: 'Multiple Unresolved Support Tickets', impact: 62, severity: 'high' },
              { factor: 'Payment Method Expiring', impact: 45, severity: 'medium' },
              { factor: 'Competitor Mentions in Feedback', impact: 30, severity: 'medium' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-zinc-700">{item.factor}</span>
                  <span className="text-zinc-500 font-medium">{item.impact}% correlation</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${item.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`} 
                    style={{ width: `${item.impact}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retention Recommendations */}
        <div className="bg-white p-6 rounded-xl border border-zinc-200/80 shadow-sm flex flex-col">
          <h2 className="text-base font-semibold text-zinc-900 mb-6 flex items-center gap-2">
            <Zap size={18} className="text-blue-600" />
            AI Retention Recommendations
          </h2>
          <div className="space-y-4 flex-1">
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100/50">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Target "Low Usage" Segment</h3>
              <p className="text-xs text-blue-700/80 leading-relaxed">
                Launch an automated re-engagement email campaign for users who haven't logged in for 14+ days. Highlight newly released features.
              </p>
            </div>
            <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
              <h3 className="text-sm font-semibold text-emerald-900 mb-1">Proactive Support Outreach</h3>
              <p className="text-xs text-emerald-700/80 leading-relaxed">
                Flag accounts with 2+ open tickets older than 48 hours to the Customer Success team for immediate personal follow-up.
              </p>
            </div>
            <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100/50">
              <h3 className="text-sm font-semibold text-purple-900 mb-1">Annual Plan Upsell</h3>
              <p className="text-xs text-purple-700/80 leading-relaxed">
                Offer a 15% discount for converting to an annual plan to medium-risk customers with high initial satisfaction scores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
