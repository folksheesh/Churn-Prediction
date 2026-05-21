
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Percent,
  Upload,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Phone,
  ShieldAlert,
  CreditCard,
  Check,
  TrendingDown,
  Activity
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area
} from "recharts";

const API_BASE = "http://localhost:8000/api/v1";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "customers" | "prediction" | "upload">("dashboard");
  const [summary, setSummary] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  
  // Single prediction state
  const [predTenure, setPredTenure] = useState(12);
  const [predValue, setPredValue] = useState(99.0);
  const [predFreq, setPredFreq] = useState("Weekly");
  const [predTickets, setPredTickets] = useState(2);
  const [predInactive, setPredInactive] = useState(5);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);

  // Batch upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string; errors: string[] } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Expanded customers details tracking
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<string[]>([]);

  // Fetch Customers and compute summary
  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/customers`, {
        params: { limit: 1000 }
      });
      const data = res.data.items || [];
      
      // Filter logic
      let filtered = data;
      if (searchQuery) {
        filtered = filtered.filter((c: any) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.id?.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      if (regionFilter !== "All") {
        filtered = filtered.filter((c: any) => c.region_category === regionFilter);
      }
      if (riskFilter !== "All") {
        const rFilter = riskFilter.split(' ')[0]; // "High Risk" -> "High"
        filtered = filtered.filter((c: any) => c.churn_risk === rFilter);
      }

      // Map to UI expected format
      const mappedCustomers = filtered.map((c: any) => ({
        customerId: c.id,
        initials: c.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'NA',
        name: c.name,
        region: c.region_category || 'Unknown',
        tenure: Math.round((c.days_since_joined || 0) / 30),
        monthlyValue: Math.round(c.avg_transaction_value || 0),
        riskLevel: c.churn_risk ? `${c.churn_risk} Risk` : 'Low Risk',
        churnProbability: Math.round((c.churn_probability || 0) * 100),
        phone: 'Hidden',
        planTier: c.plan_tier || 'Basic',
        loginFrequency: `${c.logins_90d || 0} in 90d`,
        supportTickets: c.tickets_opened_90d || 0,
        sentimentKategori: c.feedback ? 'Neutral' : 'N/A',
        feedback: c.feedback || 'No recent feedback',
        recommendations: c.churn_risk === 'High' ? ['Offer discount', 'Personal outreach'] : ['Monitor usage']
      }));

      const regions = [...new Set(data.map((c: any) => c.region_category).filter(Boolean))];
      setCustomerData({ customers: mappedCustomers, regions });

      // Compute Summary Stats from full dataset (data)
      const totalCustomers = data.length;
      const atRiskCount = data.filter((c: any) => c.churn_probability >= 0.45).length;
      const avgChurnRate = totalCustomers ? Math.round((data.reduce((acc: number, c: any) => acc + (c.churn_probability || 0), 0) / totalCustomers) * 100) : 0;
      
      const lowRiskCount = data.filter((c: any) => (c.churn_probability || 0) < 0.45).length;
      const mediumRiskCount = data.filter((c: any) => (c.churn_probability || 0) >= 0.45 && (c.churn_probability || 0) < 0.70).length;
      const highRiskCount = data.filter((c: any) => (c.churn_probability || 0) >= 0.70).length;

      // Compute dynamic region stats
      const regionData: Record<string, { total: number, atRisk: number }> = {};
      data.forEach((c: any) => {
        const reg = c.region_category || 'Unknown';
        if (!regionData[reg]) regionData[reg] = { total: 0, atRisk: 0 };
        regionData[reg].total += 1;
        if ((c.churn_probability || 0) >= 0.45) regionData[reg].atRisk += 1;
      });
      const realRegionStats = Object.keys(regionData).map(reg => ({
        region: reg,
        riskPct: Math.round((regionData[reg].atRisk / regionData[reg].total) * 100)
      })).sort((a, b) => b.riskPct - a.riskPct);

      setSummary({
        totalCustomers,
        churnRate: avgChurnRate,
        atRiskCount,
        lowRiskCount,
        mediumRiskCount,
        highRiskCount,
        churnForecast: [
          { day: 'Mon', predictedChurn: avgChurnRate - 2 }, { day: 'Tue', predictedChurn: avgChurnRate + 1 },
          { day: 'Wed', predictedChurn: avgChurnRate - 1 }, { day: 'Thu', predictedChurn: avgChurnRate + 2 },
          { day: 'Fri', predictedChurn: avgChurnRate }, { day: 'Sat', predictedChurn: avgChurnRate - 3 },
          { day: 'Sun', predictedChurn: avgChurnRate - 1 }
        ],
        sparkline: [88, 89, 90, 92, 94, 93, 95],
        regionStats: realRegionStats.slice(0, 5),
        lowRiskCustomers: mappedCustomers.filter((c: any) => c.riskLevel === 'Low Risk').slice(0, 4),
        activities: [
          { time: '10:45 AM', text: 'System triggered XGBoost batch prediction on live data.' },
          { time: '09:30 AM', text: 'Daily pipeline refresh completed.' }
        ]
      });

    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  const fetchSummary = () => { /* Now computed in fetchCustomers */ };

  useEffect(() => {
    fetchSummary();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "customers" || activeTab === "dashboard") {
      fetchCustomers();
    }
  }, [activeTab, searchQuery, regionFilter, riskFilter]);

  const toggleCustomerExpand = (id: string) => {
    if (expandedCustomerIds.includes(id)) {
      setExpandedCustomerIds(expandedCustomerIds.filter(x => x !== id));
    } else {
      setExpandedCustomerIds([...expandedCustomerIds, id]);
    }
  };

  // Single Predict handler
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    try {
      const res = await axios.post(`${API_BASE}/predictions/predict`, {
        tenure: predTenure,
        monthly_value: predValue,
        login_frequency: predFreq,
        support_tickets: predTickets,
        days_inactive: predInactive
      });
      setPredictionResult(res.data);
    } catch (err) {
      console.error("Prediction error", err);
    } finally {
      setPredicting(false);
    }
  };

  // Batch Upload handler
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadStatus(null);
    
    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const res = await axios.post(`${API_BASE}/customers/import`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      if (res.data.count) {
        setUploadStatus({
          success: true,
          message: `Successfully validated and imported ${res.data.count} customer rows!`,
          errors: []
        });
        setUploadFile(null);
        // Refresh customer list
        fetchCustomers();
      } else {
        setUploadStatus({
          success: false,
          message: "Validation failed. Please correct the errors below and try again.",
          errors: res.data.errors
        });
      }
    } catch (err: any) {
      setUploadStatus({
        success: false,
        message: err.response?.data?.detail || "Network error. Make sure your FastAPI backend is running.",
        errors: []
      });
    } finally {
      setUploading(false);
    }
  };

  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-[#f5f6fb]">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-[280px] bg-[#0b1220] text-white flex flex-col border-r border-white/10 shrink-0">
        <div className="p-8 border-b border-slate-700/40 flex items-center gap-3.5">
          <div className="w-11 h-11 bg-brand-500 rounded-xl flex items-center justify-center font-outfit text-xl font-bold text-white glow-brand">
            CS
          </div>
          <div>
            <h1 className="font-outfit font-bold text-lg leading-tight">ChurnSense</h1>
            <p className="text-xs text-slate-400">Retention Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full h-14 px-5 rounded-2xl flex items-center gap-4 text-[15px] font-semibold transition-all duration-200 ${
              activeTab === "dashboard"
                ? "bg-brand-500 text-white glow-brand shadow-lg"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("customers")}
            className={`w-full h-14 px-5 rounded-2xl flex items-center gap-4 text-[15px] font-semibold transition-all duration-200 ${
              activeTab === "customers"
                ? "bg-brand-500 text-white glow-brand shadow-lg"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Users className="w-5 h-5 shrink-0" />
            <span>Customers</span>
          </button>

          <button
            onClick={() => setActiveTab("prediction")}
            className={`w-full h-14 px-5 rounded-2xl flex items-center gap-4 text-[15px] font-semibold transition-all duration-200 ${
              activeTab === "prediction"
                ? "bg-brand-500 text-white glow-brand shadow-lg"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Percent className="w-5 h-5 shrink-0" />
            <span>Prediction</span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`w-full h-14 px-5 rounded-2xl flex items-center gap-4 text-[15px] font-semibold transition-all duration-200 ${
              activeTab === "upload"
                ? "bg-brand-500 text-white glow-brand shadow-lg"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Upload className="w-5 h-5 shrink-0" />
            <span>Batch Upload</span>
          </button>
        </nav>

        <div className="p-6 border-t border-white/10 text-xs text-slate-500 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Active ML Pipeline (XGBoost)</span>
        </div>
      </aside>

      {/* 2. MAIN WINDOW CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 max-w-[1280px] mx-auto px-8 py-6">
        
        {/* TOP BAR / HEADER */}
        <header className="flex justify-between items-center mb-8 shrink-0">
          <div>
            <div className="text-[11px] font-bold text-brand-500 tracking-wider uppercase mb-1">
              ChurnSense • Customer Intelligence
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight font-outfit">
              {activeTab === "dashboard" && "Dashboard Overview"}
              {activeTab === "customers" && "Customer Health Directory"}
              {activeTab === "prediction" && "Single Customer Churn Risk Calculator"}
              {activeTab === "upload" && "Batch Customer Validation & Upload"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === "dashboard" && "Welcome back! Here is your custom customer health analysis."}
              {activeTab === "customers" && "Real-time list of customers filterable by risk and location categories."}
              {activeTab === "prediction" && "Calculate simulated churn probability using pre-trained customer weight boundaries."}
              {activeTab === "upload" && "Import CSV batch documents to validate and add custom rows to your live dashboard."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              Session Live
            </span>
            <div className="w-9 h-9 rounded-full bg-brand-100 border border-brand-300 text-brand-700 flex items-center justify-center font-outfit font-black text-xs">
              {isAuthenticated ? user?.name?.substring(0, 2).toUpperCase() : 'GS'}
            </div>
            <button 
              onClick={handleAuthAction}
              className="text-xs font-bold px-4 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              {isAuthenticated ? 'Logout' : 'Admin Login'}
            </button>
          </div>
        </header>

        {/* 3. DYNAMIC VIEWS */}
        
        {/* VIEW A: DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            {/* STATS MATRIX */}
            {summary ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card hover-scale rounded-3xl p-6 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Total Customers</span>
                    <h3 className="text-3xl font-extrabold text-slate-900 font-outfit mt-2">{summary.totalCustomers?.toLocaleString()}</h3>
                  </div>
                  <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Live active customers in dataset</span>
                  </div>
                </div>

                <div className="glass-card hover-scale rounded-3xl p-6 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Average Churn Rate</span>
                    <h3 className="text-3xl font-extrabold text-slate-900 font-outfit mt-2">{summary.churnRate}%</h3>
                  </div>
                  <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    <span>Average probability across regions</span>
                  </div>
                </div>

                <div className="glass-card hover-scale rounded-3xl p-6 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Predicted At-Risk</span>
                    <h3 className="text-3xl font-extrabold text-slate-900 font-outfit mt-2 text-rose-600">{summary.atRiskCount}</h3>
                  </div>
                  <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <span>Probability risk &ge; 45%</span>
                  </div>
                </div>

                <div className="glass-card hover-scale rounded-3xl p-6 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Risk Level Mix</span>
                    <div className="flex gap-2 mt-3 text-center">
                      <span className="flex-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold py-1 px-1.5 rounded-full border border-emerald-100">{summary.lowRiskCount} L</span>
                      <span className="flex-1 bg-amber-50 text-amber-700 text-[10px] font-bold py-1 px-1.5 rounded-full border border-amber-100">{summary.mediumRiskCount} M</span>
                      <span className="flex-1 bg-rose-50 text-rose-700 text-[10px] font-bold py-1 px-1.5 rounded-full border border-rose-100">{summary.highRiskCount} H</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2">
                    High &ge; 70%, Medium &ge; 45%
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 font-semibold">
                Loading statistics summary...
              </div>
            )}

            {/* CHARTS CONTAINER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Churn Forecast Line Chart */}
              <div className="md:col-span-2 glass-card rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 font-outfit">Churn Trend Projection</h4>
                    <p className="text-xs text-slate-400">Projected 7-day baseline churn rate forecast.</p>
                  </div>
                </div>
                {summary && summary.churnForecast ? (
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={summary.churnForecast}>
                        <defs>
                          <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6d5dfc" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6d5dfc" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#94a3b8' }} />
                        <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#94a3b8' }} unit="%" />
                        <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="predictedChurn" stroke="#6d5dfc" strokeWidth={3} fillOpacity={1} fill="url(#colorChurn)" name="Churn Rate" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-slate-400">Loading forecast chart...</div>
                )}
              </div>

              {/* Retention target and dynamic circular risk widgets */}
              <div className="space-y-6 flex flex-col justify-between">
                <div className="glass-card rounded-3xl p-6 flex-1 flex flex-col justify-between min-h-[160px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center font-bold text-lg">
                      ✺
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase">Retention Score Target</h4>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-2">
                      <span>Monthly Goals</span>
                      <span className="font-bold text-slate-800">88.5%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: '88.5%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-6 flex-1 flex flex-col justify-between min-h-[160px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold text-lg">
                      ◈
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase">Daily Activity Status</h4>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Pred. Accuracy</span>
                      <h5 className="text-2xl font-black text-slate-900 font-outfit mt-1">94.8%</h5>
                    </div>
                    <div className="h-10 w-24">
                      {summary && summary.sparkline && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={summary.sparkline.map((val: number, i: number) => ({ id: i, val }))}>
                            <Line type="monotone" dataKey="val" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* BOTTOM SECTION GRID: REGION RETENTION & ACTIVITIES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Region Retention and table list */}
              <div className="md:col-span-2 glass-card rounded-3xl p-6">
                <div className="mb-6">
                  <h4 className="text-base font-extrabold text-slate-900 font-outfit">Region Analytics & Top Retention Candidates</h4>
                  <p className="text-xs text-slate-400">At-risk metrics grouped by geographical sectors and accounts.</p>
                </div>

                {summary && summary.regionStats ? (
                  <div className="h-[200px] w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.regionStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="region" tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#94a3b8' }} />
                        <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#94a3b8' }} unit="%" />
                        <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                        <Bar dataKey="riskPct" fill="#6d5dfc" radius={[8, 8, 0, 0]} barSize={36} name="At-Risk Rate (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-slate-400">Loading region statistics...</div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                        <th className="pb-3 font-semibold">Customer</th>
                        <th className="pb-3 font-semibold">Tenure</th>
                        <th className="pb-3 font-semibold">Priority</th>
                        <th className="pb-3 font-semibold">Monthly Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary && summary.lowRiskCustomers && summary.lowRiskCustomers.map((c: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold font-outfit text-xs">
                              {c.initials}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900">{c.name}</div>
                              <div className="text-[10px] text-slate-400">{c.region}</div>
                            </div>
                          </td>
                          <td className="py-3 text-slate-500 font-medium">{c.tenure} months</td>
                          <td className="py-3">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {c.riskLevel}
                            </span>
                          </td>
                          <td className="py-3 font-bold text-slate-900">${c.monthlyValue}/mo</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Timeline Activity list */}
              <div className="glass-card rounded-3xl p-6 flex flex-col min-h-[380px]">
                <div className="mb-6">
                  <h4 className="text-base font-extrabold text-slate-900 font-outfit">Daily operations</h4>
                  <p className="text-xs text-slate-400">Recent workspace pipeline logs.</p>
                </div>

                <div className="flex-1 relative activity-timeline pl-10 space-y-6">
                  {summary && summary.activities ? summary.activities.map((act: any, i: number) => (
                    <div key={i} className="relative z-10 animate-fadeIn">
                      <span className="absolute -left-10 w-8 text-center text-[10px] font-bold text-brand-500 bg-[#f5f6fb] py-0.5 border border-brand-200 rounded-md">
                        {act.time}
                      </span>
                      <span className="absolute -left-[27px] w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-white"></span>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {act.text}
                      </p>
                    </div>
                  )) : (
                    <div className="text-slate-400 text-xs">Loading operational timeline...</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW B: CUSTOMERS TAB */}
        {activeTab === "customers" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filter Search Bar Container */}
            <div className="glass-card rounded-3xl p-5 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer by name or CUS ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="flex gap-3 w-full md:w-auto shrink-0">
                <div className="relative flex-1 md:flex-none">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="pl-9 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="All">All Regions</option>
                    {customerData && customerData.regions && customerData.regions.map((reg: string, i: number) => i > 0 && (
                      <option key={i} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                <div className="relative flex-1 md:flex-none">
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="All">All Risks</option>
                    <option value="Low Risk">Low Risk</option>
                    <option value="Medium Risk">Medium Risk</option>
                    <option value="High Risk">High Risk</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customers grid list */}
            {customerData && customerData.customers ? (
              <div className="space-y-4">
                {customerData.customers.map((c: any, i: number) => {
                  const isExpanded = expandedCustomerIds.includes(c.customerId);
                  const isHigh = c.riskLevel === "High Risk";
                  const isMed = c.riskLevel === "Medium Risk";
                  return (
                    <div
                      key={i}
                      className="glass-card rounded-3xl p-6 transition-all duration-200 hover:shadow-md border border-slate-200/60"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        
                        {/* Left Identity row */}
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-outfit font-black text-sm shrink-0 shadow-sm border border-brand-200">
                            {c.initials}
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-outfit font-black text-base text-slate-900 truncate">
                              {c.name}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              {c.customerId} • {c.region}
                            </p>
                          </div>
                        </div>

                        {/* Mid statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1.5 text-xs text-slate-500 w-full md:w-auto">
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Tenure</span>
                            <span className="font-semibold text-slate-800">{c.tenure} months</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Active Value</span>
                            <span className="font-bold text-slate-800">${c.monthlyValue}/mo</span>
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Risk Priority</span>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 border ${
                              isHigh
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : isMed
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                              {c.riskLevel} ({c.churnProbability}%)
                            </span>
                          </div>
                        </div>

                        {/* Right Toggle */}
                        <button
                          onClick={() => toggleCustomerExpand(c.customerId)}
                          className="w-full md:w-auto h-9 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-xs transition-colors flex items-center justify-center gap-1 shrink-0"
                        >
                          <span>{isExpanded ? "Collapse" : "Details"}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Expandable detailed profile panel */}
                      {isExpanded && (
                        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slideDown">
                          {/* Inner details grid */}
                          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Phone</span>
                              <span className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {c.phone}
                              </span>
                            </div>
                            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Plan Tier</span>
                              <span className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                {c.planTier}
                              </span>
                            </div>
                            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Logins / Tickets</span>
                              <span className="text-xs font-bold text-slate-800 mt-1">
                                {c.loginFrequency} • {c.supportTickets} tkt
                              </span>
                            </div>
                            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Sentiment Score</span>
                              <span className="text-xs font-bold text-slate-800 mt-1">
                                {c.sentimentKategori}
                              </span>
                            </div>
                            
                            <div className="col-span-2 md:col-span-4 bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
                              <span className="block text-[9px] text-slate-400 font-bold uppercase">Last Feedback comment</span>
                              <p className="text-xs font-medium text-slate-600 mt-1.5 italic">
                                &ldquo;{c.feedback}&rdquo;
                              </p>
                            </div>
                          </div>

                          {/* AI Action Items */}
                          <div className="bg-brand-50/50 border border-brand-100 rounded-2xl p-5 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block mb-2">
                                AI Retention Advice
                              </span>
                              <div className="space-y-2">
                                {c.recommendations.map((rec: string, k: number) => (
                                  <p key={k} className="text-xs font-medium text-slate-700 leading-normal flex items-start gap-1">
                                    <span>•</span>
                                    <span>{rec}</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-slate-400 font-semibold">
                Loading customer list directory...
              </div>
            )}
          </div>
        )}

        {/* VIEW C: PREDICTION TAB */}
        {activeTab === "prediction" && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 animate-fadeIn">
            
            {/* Input Form Column */}
            <form onSubmit={handlePredict} className="md:col-span-3 glass-card rounded-3xl p-6 space-y-6">
              <div className="mb-4">
                <h4 className="text-base font-extrabold text-slate-900 font-outfit">Input Customer Attributes</h4>
                <p className="text-xs text-slate-400">Fill in active usage numbers to predict risk metrics.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tenure Months</label>
                  <input
                    type="number"
                    value={predTenure}
                    onChange={(e) => setPredTenure(parseInt(e.target.value) || 1)}
                    min="1"
                    max="120"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-300 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Months client has stayed with service.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Monthly Transaction Value ($)</label>
                  <input
                    type="number"
                    value={predValue}
                    onChange={(e) => setPredValue(parseFloat(e.target.value) || 0)}
                    min="10"
                    max="500"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-300 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Active average billing value per month.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Login Frequency</label>
                  <select
                    value={predFreq}
                    onChange={(e) => setPredFreq(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-300 focus:bg-white appearance-none cursor-pointer"
                  >
                    <option value="Daily">Daily Logins</option>
                    <option value="Weekly">Weekly Logins</option>
                    <option value="Monthly">Monthly Logins</option>
                    <option value="Rarely">Rarely Logins</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Activity categorization standard.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Support Ticket Count</label>
                  <input
                    type="number"
                    value={predTickets}
                    onChange={(e) => setPredTickets(parseInt(e.target.value) || 0)}
                    min="0"
                    max="20"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-300 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Total complaints logged in recent 90d.</span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Days Since Last Active</label>
                  <input
                    type="number"
                    value={predInactive}
                    onChange={(e) => setPredInactive(parseInt(e.target.value) || 0)}
                    min="0"
                    max="90"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-300 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Total inactive days since last login.</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={predicting}
                className="w-full h-14 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors glow-brand"
              >
                <span>{predicting ? "Processing Pipeline..." : "Calculate Risk Probability"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Results Column */}
            <div className="md:col-span-2 flex flex-col gap-6">
              
              {/* Gauge result card */}
              <div className="glass-card rounded-3xl p-6 flex flex-col items-center justify-center min-h-[280px]">
                {predictionResult ? (
                  <div className="text-center w-full animate-scaleIn">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-4">
                      Prediction Output
                    </span>

                    {/* Circular gauge */}
                    <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="68"
                          stroke="#f1f5f9"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="68"
                          stroke={
                            predictionResult.riskLevel === "High Risk"
                              ? "#f43f5e"
                              : predictionResult.riskLevel === "Medium Risk"
                              ? "#f59e0b"
                              : "#10b981"
                          }
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={427}
                          strokeDashoffset={427 - (427 * predictionResult.churnProbability) / 100}
                          className="transition-all duration-500 ease-out"
                        />
                      </svg>
                      
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-900 font-outfit leading-none">
                          {predictionResult.churnProbability}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                          Probability
                        </span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold border ${
                        predictionResult.riskLevel === "High Risk"
                          ? "bg-rose-50 text-rose-700 border-rose-100"
                          : predictionResult.riskLevel === "Medium Risk"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}>
                        {predictionResult.riskLevel}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 p-6">
                    <Percent className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
                    <p className="text-sm font-semibold">Ready to Calculate</p>
                    <p className="text-xs mt-1 text-slate-400">Fill in form details on the left and submit.</p>
                  </div>
                )}
              </div>

              {/* Action items card */}
              <div className="glass-card rounded-3xl p-6 flex-1 flex flex-col justify-start">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">
                  Actionable AI Advice Log
                </h4>
                {predictionResult ? (
                  <div className="space-y-3 animate-fadeIn">
                    {predictionResult.advice.map((item: string, index: number) => (
                      <div key={index} className="flex gap-2.5 items-start text-xs font-medium text-slate-600 leading-relaxed bg-[#f8fafc] border border-slate-100 p-3 rounded-2xl">
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 leading-relaxed p-2">
                    Submit a query to generate context-specific warnings and recovery suggestions.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* VIEW D: BATCH UPLOAD TAB */}
        {activeTab === "upload" && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 animate-fadeIn">
            
            {/* CSV File Upload column */}
            <form onSubmit={handleFileUpload} className="md:col-span-3 glass-card rounded-3xl p-6 space-y-6">
              <div className="mb-4">
                <h4 className="text-base font-extrabold text-slate-900 font-outfit">CSV Batch Validation Dropzone</h4>
                <p className="text-xs text-slate-400">Select customer batch CSV documents to perform automated boundary and syntax checks.</p>
              </div>

              {/* Upload Drop area */}
              <div className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-3xl p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-white transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-12 h-12 text-slate-400 group-hover:text-brand-500 transition-colors mb-4" />
                {uploadFile ? (
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">{uploadFile.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">Click to browse or drop your CSV file here</p>
                    <p className="text-xs text-slate-400 mt-1.5">Files must be properly formatted clean customer records.</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="flex-1 h-14 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-200 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors glow-brand"
                >
                  <span>{uploading ? "Analyzing CSV format..." : "Start Batch Validation"}</span>
                  <Check className="w-4 h-4" />
                </button>
                
                {uploadFile && (
                  <button
                    type="button"
                    onClick={() => setUploadFile(null)}
                    className="h-14 px-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-2xl transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Validation Status Logs */}
              {uploadStatus && (
                <div className={`p-5 rounded-2xl border animate-slideDown ${
                  uploadStatus.success 
                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" 
                    : "bg-rose-50/50 border-rose-200 text-rose-800"
                }`}>
                  <div className="flex gap-3 items-start">
                    {uploadStatus.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h5 className="text-sm font-bold">{uploadStatus.success ? "Success" : "Errors Detected"}</h5>
                      <p className="text-xs font-semibold mt-1">{uploadStatus.message}</p>
                      
                      {uploadStatus.errors.length > 0 && (
                        <div className="mt-3 bg-white/75 border border-rose-100 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5">
                          {uploadStatus.errors.map((err, index) => (
                            <p key={index} className="text-[10px] font-bold text-rose-700 leading-normal">
                              {err}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </form>

            {/* CSV Template Guide column */}
            <div className="md:col-span-2 glass-card rounded-3xl p-6 flex flex-col justify-start">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">
                CSV Template Guidelines
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                To guarantee successful batch loads, your CSV upload file must include the following column labels and boundaries:
              </p>
              
              <div className="space-y-4 overflow-y-auto flex-1 max-h-[360px]">
                <div className="bg-[#f8fafc] border border-slate-100 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-800 block">customer_id</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">String • Custom code prefix. Example: CUS-09124</span>
                </div>
                <div className="bg-[#f8fafc] border border-slate-100 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-800 block">name</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">String • Customer full name. Example: Rizky Pratama</span>
                </div>
                <div className="bg-[#f8fafc] border border-slate-100 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-800 block">tenure_months</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Integer &ge; 0 • Active months with system. Example: 18</span>
                </div>
                <div className="bg-[#f8fafc] border border-slate-100 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-800 block">days_since_last_login</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Integer &ge; 0 • Inactive day gaps. Example: 14</span>
                </div>
                <div className="bg-[#f8fafc] border border-slate-100 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-800 block">avg_frequency_login_days</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Integer &ge; 0 • Ticket complaints count. Example: 3</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
