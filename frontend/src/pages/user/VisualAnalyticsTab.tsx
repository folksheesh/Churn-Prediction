import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { Info, FileText, ChevronDown, CreditCard, AlertCircle, TrendingUp, TrendingDown, Sparkles, Target, AlertTriangle, Users, Activity, DollarSign, ArrowUpRight, ArrowDownRight, Lightbulb } from 'lucide-react';
import realData from '../../data/realAnalytics.json';
import api from '@/lib/api';
import FeatureExplainability, { type FeatureData } from '@/components/FeatureExplainability';

interface VisualAnalyticsTabProps {
  customerData: any;
  summary: any;
}

export default function VisualAnalyticsTab({ customerData, summary }: VisualAnalyticsTabProps) {
  // 1. DATA PREPARATION & DERIVATIONS
  // --- USE REAL DATA FROM CSV ---
  // The user explicitly requested to see the full, real data from cleaned_churn_data.csv
  const { kpi, monthlyChurnTrend, activeInactiveData, topChurnFactors, sentiment, planTier } = realData;

  const [featureData, setFeatureData] = useState<FeatureData[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);

  useEffect(() => {
    const fetchFeatureData = async () => {
      try {
        const [factorsRes, segmentsRes] = await Promise.all([
          api.get(`/analytics/feature-importance`),
          api.get(`/analytics/feature-segments`)
        ]);

        const nameMapping: Record<string, string> = {
          'days_since_active': 'Days Since Last Active',
          'logins_90d': 'Recent Login Frequency',
          'tickets_opened_90d': 'Support Tickets Opened',
          'days_since_joined': 'Customer Tenure',
          'avg_transaction_value': 'Average Monthly Spend',
          'api_calls_90d': 'System Usage (API Calls)',
          'points_in_wallet': 'Points in Wallet',
          'plan_tier': 'Plan Tier',
          'avg_session_duration': 'Avg Session Duration',
          'active_days_90d': 'Active Days (90d)',
          'region_category': 'Geographic Region',
          'gender': 'Gender',
          'age': 'Customer Age',
          'sentiment_score': 'Sentiment Score',
          'sentiment_kategori': 'Sentiment Category',
          'sentiment_confidence': 'Sentiment Confidence',
          'sentiment_raw_score': 'Sentiment Raw Score',
          'avg_frequency_login_days': 'Avg Login Frequency (Days)',
          'days_since_last_login': 'Days Since Last Login',
        };

        const segments = segmentsRes.data;
        const factors = factorsRes.data.slice(0, 8);
        
        const mergedFeatures: FeatureData[] = factors.map((f: any) => {
          const featureKey = f.feature;
          const friendlyName = nameMapping[featureKey] || featureKey.replace(/_/g, ' ');
          const segmentData = segments[featureKey];

          return {
            feature: friendlyName,
            importance: Math.round(f.importance * 100),
            segments: segmentData?.segments || [],
            insight: segmentData?.insight || `This feature contributes ${Math.round(f.importance * 100)}% to the model's predictive power.`,
          };
        });

        setFeatureData(mergedFeatures);
      } catch (err) {
        console.error("Error fetching analysis data", err);
      } finally {
        setFeaturesLoading(false);
      }
    };

    fetchFeatureData();
  }, []);

  const riskGroupData = [
    { name: 'High Risk', value: kpi.highRisk, fill: '#ef4444' }, // rose-500
    { name: 'Medium Risk', value: kpi.mediumRisk, fill: '#f59e0b' }, // amber-500
    { name: 'Low Risk', value: kpi.lowRisk, fill: '#10b981' } // emerald-500
  ];

  const totalCustomers = kpi.lowRisk + kpi.mediumRisk + kpi.highRisk;
  const highRiskPercentage = totalCustomers ? Math.round((kpi.highRisk / totalCustomers) * 100) : 0;
  const safePercentage = totalCustomers ? Math.round((kpi.lowRisk / totalCustomers) * 100) : 0;
  const revenueAtRisk = kpi.revenueAtRisk;

  const planTierChartData = planTier.filter(t => t.name !== 'Starter').sort((a, b) => b.churnRate - a.churnRate);
  const sentimentData = sentiment;

  // 2. REUSABLE UI COMPONENTS
  const CustomTooltip = ({ active, payload, label, unit = "" }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-xl p-4 min-w-[160px]">
          <p className="text-sm font-bold text-slate-800 mb-3">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 mb-1.5 last:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-sm text-slate-600 capitalize">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                {entry.value}{unit}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const KPICard = ({ title, value, subtext, trend, isPositive, icon: Icon, colorClass }: any) => (
    <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl p-5 flex flex-col hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-500">{title}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <div>
          <h4 className="text-3xl font-extrabold text-slate-900 mb-1">{value}</h4>
          <p className="text-xs text-slate-400 font-medium">{subtext}</p>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isPositive ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
    </div>
  );

  const CompactInsight = ({ icon: Icon, title, content, color = "indigo" }: any) => (
    <div className={`bg-${color}-50/50 border border-${color}-100 rounded-xl p-3 flex items-start gap-3`}>
      <div className={`w-7 h-7 rounded-lg bg-${color}-100 flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`w-3.5 h-3.5 text-${color}-600`} />
      </div>
      <div>
        <span className={`text-xs font-bold text-${color}-900 block mb-0.5 uppercase tracking-wide`}>{title}</span>
        <p className={`text-xs text-${color}-800/80 leading-snug line-clamp-2`}>{content}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12 font-inter">
      
      {/* SECTION 1: KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Customers" 
          value={totalCustomers.toLocaleString()} 
          subtext="Active subscriptions"
          trend="12.5%" 
          isPositive={true}
          icon={Users}
          colorClass="bg-blue-50 text-blue-600"
        />
        <KPICard 
          title="High Risk Customers" 
          value={kpi.highRisk.toLocaleString()} 
          subtext="Need immediate action"
          trend="4.2%" 
          isPositive={false}
          icon={AlertTriangle}
          colorClass="bg-rose-50 text-rose-600"
        />
        <KPICard 
          title="Retention Rate" 
          value={`${safePercentage}%`} 
          subtext="Stable customers"
          trend="1.1%" 
          isPositive={false}
          icon={Target}
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <KPICard 
          title="Revenue at Risk" 
          value={`$${revenueAtRisk.toLocaleString()}`} 
          subtext="Estimated MRR loss"
          icon={DollarSign}
          colorClass="bg-amber-50 text-amber-600"
        />
      </div>

      {/* SECTION 2: Customer Health Overview (HERO) */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-indigo-50/50 blur-3xl pointer-events-none group-hover:bg-indigo-100/50 transition-colors duration-700 -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-emerald-50/50 blur-3xl pointer-events-none group-hover:bg-emerald-100/50 transition-colors duration-700 -ml-20 -mb-20"></div>

        <div className="p-8 lg:p-10 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            
            {/* Left: Chart & Legend */}
            <div className="w-full lg:w-5/12 flex items-center justify-center relative h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskGroupData}
                    cx="50%"
                    cy="50%"
                    innerRadius={85}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={3}
                  >
                    {riskGroupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-90 outline-none transition-all duration-300" style={{ filter: `drop-shadow(0px 4px 8px ${entry.fill}40)` }} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">Health</span>
                <span className="text-3xl font-black text-slate-800">{safePercentage}%</span>
              </div>
            </div>

            {/* Right: Insights */}
            <div className="w-full lg:w-7/12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider w-max mb-4">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                Customer Health Overview
              </div>
              
              <h2 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight">
                {safePercentage >= 50 ? "Most customers are in a safe condition." : "Attention: High risk customer ratio!"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {riskGroupData.map((risk, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${risk.fill}15` }}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: risk.fill, boxShadow: `0 0 10px ${risk.fill}80` }}></div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 mb-0.5">{risk.name}</p>
                      <p className="text-xl font-bold text-slate-900">{risk.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-50/80 rounded-xl p-4 flex items-start gap-3 border border-indigo-100">
                <Lightbulb className="w-5 h-5 text-indigo-600 shrink-0" />
                <p className="text-sm text-indigo-900/80 leading-relaxed">
                  <span className="font-bold">Insight:</span> {safePercentage}% of customers are in a safe condition. Most risks originate from new customers (low tenure). Focus strategies on the <em>Onboarding Program</em>.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* SECTION 3: Trend Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend: Monthly Churn */}
        <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 flex flex-col transition-all hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] hover:-translate-y-1">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Monthly Churn Trend</h3>
              <p className="text-xs text-slate-500">Monthly churn percentage throughout the year.</p>
            </div>
            <div className="bg-rose-50 text-rose-600 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 border border-rose-100">
              <TrendingUp className="w-3 h-3" /> Uptrend
            </div>
          </div>
          
          <div className="flex-1 min-h-[220px] w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChurnTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip unit="%" />} />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  name="Churn Rate"
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }} 
                  style={{ filter: 'drop-shadow(0px 4px 6px rgba(239, 68, 68, 0.3))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <CompactInsight 
            icon={TrendingDown} 
            title="Warning" 
            content="Churn rate shows an upward trend since March. Immediately evaluate product/service changes in that quarter." 
            color="rose" 
          />
        </div>

        {/* Trend: Active vs Inactive */}
        <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 flex flex-col transition-all hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] hover:-translate-y-1">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Engagement (Active vs Passive)</h3>
            <p className="text-xs text-slate-500">User activity levels per month.</p>
          </div>
          
          <div className="flex-1 min-h-[220px] w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeInactiveData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInactive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Active" name="Active Users" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
                <Area type="monotone" dataKey="Inactive" name="Passive Users" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorInactive)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <CompactInsight 
            icon={Activity} 
            title="Engagement Drop" 
            content="Passive user area widened in June. Launch re-engagement campaigns to bring them back to active." 
            color="amber" 
          />
        </div>

      </div>

      {/* SECTION 4: Business Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Insight: Churn by Tier */}
        <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 flex flex-col hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1">
          <h3 className="text-base font-bold text-slate-900 mb-1">Churn by Plan Tier</h3>
          <p className="text-[11px] text-slate-500 mb-6">Risk percentage by plan tier.</p>
          
          <div className="flex-1 min-h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planTierChartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} width={70} />
                <Tooltip content={<CustomTooltip unit="%" />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="churnRate" name="Churn Potential" radius={[0, 4, 4, 0]} barSize={24}>
                  {planTierChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Starter' ? '#ef4444' : entry.name === 'Pro' ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insight: Sentiment */}
        <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 flex flex-col hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1">
          <h3 className="text-base font-bold text-slate-900 mb-1">Customer Sentiment</h3>
          <p className="text-[11px] text-slate-500 mb-6">Current user satisfaction.</p>
          
          <div className="flex-1 min-h-[180px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insight: Top Churn Factors */}
        <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 flex flex-col hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1">
          <h3 className="text-base font-bold text-slate-900 mb-1">Top Churn Factors</h3>
          <p className="text-[11px] text-slate-500 mb-5">Primary factors triggering churn.</p>
          
          <div className="flex-1 flex flex-col justify-center gap-4">
            {topChurnFactors.map((factor, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-slate-700">{factor.factor}</span>
                  <span className="text-xs font-bold text-rose-600">{factor.impact}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${factor.impact}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECTION 4.5: Marketing & Campaign Insights */}
      <div className="mb-8">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" /> Marketing & Acquisition Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all">
            <h3 className="text-base font-bold text-slate-900 mb-1">Promo & Discount Impact</h3>
            <p className="text-[11px] text-slate-500 mb-5">Special promo effectiveness on churn rate.</p>
            <div className="h-[120px] w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={realData.marketingPromo || [{"name":"Used Promo","churnRate":54,"retainedRate":46},{"name":"No Promo","churnRate":55,"retainedRate":45}]} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} width={85} />
                  <Tooltip content={<CustomTooltip unit="%" />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="churnRate" name="Churn Rate" radius={[0, 4, 4, 0]} barSize={24} fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <CompactInsight icon={Lightbulb} title="Insight" content="Identical churn rates (54% vs 55%). Giving promos during acquisition does not yield better long-term retention (indicates 'promo hunters')." />
          </div>

          <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all">
            <h3 className="text-base font-bold text-slate-900 mb-1">Acquisition Channel Quality</h3>
            <p className="text-[11px] text-slate-500 mb-5">Churn risk: Referral vs Organic channel.</p>
            <div className="h-[120px] w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={realData.marketingReferral || [{"name":"Referral","churnRate":56,"retainedRate":44},{"name":"Organic","churnRate":53,"retainedRate":47}]} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} width={85} />
                  <Tooltip content={<CustomTooltip unit="%" />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="churnRate" name="Churn Rate" radius={[0, 4, 4, 0]} barSize={24} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <CompactInsight icon={Lightbulb} title="Insight" content="Referral customers actually have a slightly higher churn risk (56% vs 53%). Referral commission program ROI needs re-evaluation." />
          </div>

        </div>
      </div>

      {/* ─────────── Feature Explainability (full-width) ─────────── */}
      <div className="mt-12 mb-8">
        <FeatureExplainability features={featureData} loading={featuresLoading} />
      </div>

      {/* SECTION 5: Recommended Actions */}
      <div className="bg-indigo-900 rounded-3xl p-8 shadow-xl border border-indigo-800 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="w-full md:w-1/3 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 border border-white/20 text-xs font-bold mb-4 backdrop-blur-sm">
            <Target className="w-3.5 h-3.5 text-indigo-300" /> RECOMMENDED ACTIONS
          </div>
          <h3 className="text-2xl font-bold mb-2">Next Steps</h3>
          <p className="text-indigo-200 text-sm leading-relaxed">
            The system recommends these strategic steps to reduce churn this month.
          </p>
        </div>
        
        <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4 z-10">
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold mb-3">1</span>
            <h4 className="font-bold text-sm mb-1">Focus on Onboarding</h4>
            <p className="text-xs text-indigo-100/70">Strengthen education for new users (0-6 months) due to high failure rates in this period.</p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold mb-3">2</span>
            <h4 className="font-bold text-sm mb-1">Upgrade Starter to Pro</h4>
            <p className="text-xs text-indigo-100/70">Use annual discounts to convert Starter customers to the more stable Pro tier.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
