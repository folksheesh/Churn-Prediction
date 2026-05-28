import React, { useState, useEffect } from 'react';
import { ShieldAlert, BarChart3, Target, ArrowUpRight, ArrowDownRight, Zap, Info } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  AreaChart,
  Area
} from 'recharts';
import api from '@/lib/api';

export default function Analysis() {
  const [riskData, setRiskData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [factorsData, setFactorsData] = useState<any[]>([]);
  const [totalAnalyzed, setTotalAnalyzed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, riskRes, trendRes, factorsRes] = await Promise.all([
          api.get(`/analytics/overview`),
          api.get(`/analytics/risk-distribution`),
          api.get(`/analytics/historical-trend`),
          api.get(`/analytics/feature-importance`)
        ]);

        setTotalAnalyzed(overviewRes.data.total_customers);

        setRiskData([
          { name: 'Healthy', value: riskRes.data.low_risk, fill: '#10b981' },
          { name: 'Needs Attention', value: riskRes.data.medium_risk, fill: '#f59e0b' },
          { name: 'Critical', value: riskRes.data.high_risk, fill: '#ef4444' },
        ]);

        // Transform trend data to calculate churn rate percentage
        const transformedTrend = trendRes.data.map((t: any) => ({
          month: t.month,
          churnRate: t.active ? Number(((t.churned / t.active) * 100).toFixed(1)) : 0
        }));
        setTrendData(transformedTrend);

        // Transform feature importance into user friendly names
        const nameMapping: Record<string, string> = {
          'days_since_active': 'Days Since Last Active',
          'logins_90d': 'Recent Login Frequency',
          'tickets_opened_90d': 'Support Tickets Opened',
          'days_since_joined': 'Customer Tenure',
          'avg_transaction_value': 'Average Monthly Spend',
          'api_calls_90d': 'System Usage (API Calls)'
        };
        
        const friendlyFactors = factorsRes.data.slice(0, 4).map((f: any) => ({
          factor: nameMapping[f.feature] || f.feature.replace(/_/g, ' '),
          impact: Math.round(f.importance * 100),
          severity: f.importance > 0.15 ? 'high' : 'medium'
        }));
        setFactorsData(friendlyFactors);

      } catch (err) {
        console.error("Error fetching analysis data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading Customer Insights...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Health Insights</h1>
        <p className="text-sm text-slate-500 mt-1">A business-friendly breakdown of customer engagement and retention trends.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Risk Distribution Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ShieldAlert size={18} className="text-blue-600" />
              Customer Health Breakdown
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-6 flex items-center gap-1">
            <Info size={12} /> Shows the distribution of our active customers.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={110} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} name="Total Customers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">Currently analyzing {totalAnalyzed.toLocaleString()} total customers.</p>
        </div>

        {/* Monthly Churn Trend Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              Monthly Engagement Trend
            </h2>
            {trendData.length > 0 && trendData[trendData.length-1].churnRate < trendData[0].churnRate && (
              <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1 border border-emerald-100">
                <ArrowDownRight size={14} /> Improving Trend
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-6 flex items-center gap-1">
            <Info size={12} /> Tracks the percentage of customers dropping off over time. Lower is better.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="churnRate" name="Drop-off Rate" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorChurn)" activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Churn Factors */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-2">
              <Target size={18} className="text-blue-600" />
              Main Reasons for Decreased Engagement
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Info size={12} /> Based on historical data, these factors heavily influence whether a customer stays or leaves.
            </p>
          </div>
          <div className="space-y-5">
            {factorsData.length > 0 ? factorsData.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700 capitalize">{item.factor}</span>
                  <span className="text-slate-500 font-medium text-xs">{item.impact}% impact</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${item.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`} 
                    style={{ width: `${item.impact}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-slate-400 py-4 text-center">Analyzing data to determine top factors...</div>
            )}
          </div>
        </div>

        {/* Retention Recommendations */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col transition-all hover:shadow-md">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-2">
              <Zap size={18} className="text-blue-600" />
              Suggested Actions for Customer Success
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Info size={12} /> Actionable strategies based on current trends.
            </p>
          </div>
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
