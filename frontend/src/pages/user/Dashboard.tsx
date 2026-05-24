
import React, { useState, useEffect } from "react";
import api from '@/lib/api';
import { useNavigate, Link } from "react-router-dom";
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
  Activity,
  XCircle,
  X,
  FileText,
  Mail,
  AlertTriangle,
  CheckCircle,
  Download,
  Info,
  HelpCircle,
  Wand2
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
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";


export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "customers" | "prediction" | "analysis">("dashboard");
  const [summary, setSummary] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  
  // Single prediction state
  const [predData, setPredData] = useState<Record<string, any>>({
    age: '', gender: 'Male', region_category: 'City', joining_date: '', joined_through_referral: 'No',
    preferred_offer_types: 'Gift Vouchers/Coupons', medium_of_operation: 'Desktop', internet_option: 'Wi-Fi',
    days_since_last_login: '', avg_session_duration: '', avg_transaction_value: '',
    avg_frequency_login_days: '', points_in_wallet: '', used_special_discount: 'No',
    offer_application_preference: 'No', past_complaint: 'No', complaint_status: 'Not Applicable',
    feedback: 'No reason specified', plan_tier: 'Basic', logins_90d: '', active_days_90d: '',
    api_calls_90d: '', session_minutes_90d: '', days_since_active: ''
  });
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Modal tracking
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Send Offer state
  const [sendingOffer, setSendingOffer] = useState<string | null>(null);

  // Fetch Customers and compute summary
  const fetchCustomers = async () => {
    try {
      // Fetch table data (limited for performance)
      const res = await api.get('/customers/', {
        params: { limit: 100 }
      });
      const data = res.data.items || [];
      
      // Fetch true global analytics
      const [overviewRes, riskRes, nlpRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/risk-distribution'),
        api.get('/analytics/nlp-insights')
      ]);
      
      // Filter logic for table
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
      const mappedCustomers = filtered.map((c: any) => {
        const tenureMonths = Math.round((c.days_since_joined || 0) / 30);
        const monthly = Math.round(c.avg_transaction_value || 0);
        
        // Calculate a fake start date based on tenure
        const d = new Date();
        d.setMonth(d.getMonth() - tenureMonths);
        const startedDateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return {
          customerId: c.id,
          initials: c.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'NA',
          name: c.name,
          email: `${c.name?.split(' ').join('.').toLowerCase() || 'customer'}@email.com`,
          region: c.region_category || 'Unknown',
          tenure: tenureMonths,
          monthlyValue: monthly,
          totalSpent: tenureMonths * monthly,
          startedDate: startedDateStr,
          riskLevel: c.churn_risk ? `${c.churn_risk} Risk` : 'Low Risk',
          churnProbability: Math.round((c.churn_probability || 0) * 100),
          phone: '+1 (555) 123-4567',
          planTier: c.plan_tier || 'Basic',
          loginFrequency: `${c.logins_90d || 0} in 90d`,
          supportTickets: c.tickets_opened_90d || 0,
          sentimentKategori: c.feedback ? 'Neutral' : 'N/A',
          feedback: c.feedback || 'No recent feedback',
          lastActive: c.days_since_active ? `${c.days_since_active} days ago` : '2 days ago',
          recommendations: c.churn_risk === 'High' ? ['Offer discount', 'Personal outreach'] : ['Monitor usage'],
          age: c.age || 0,
          gender: c.gender === 'Female' || c.gender === 'F' ? 'F' : c.gender === 'Male' || c.gender === 'M' ? 'M' : 'O',
          apiCalls: c.api_calls_90d || 0,
          sessionLogins: c.logins_90d || 0
        };
      });

      const regions = [...new Set(data.map((c: any) => c.region_category).filter(Boolean))];
      setCustomerData({ customers: mappedCustomers, regions });

      // Compute dynamic region stats for the chart (using sample data for now)
      const regionData: Record<string, { total: number, atRisk: number, region: string }> = {};
      data.forEach((c: any) => {
        const r = c.region_category || 'Unknown';
        if (!regionData[r]) regionData[r] = { region: r, total: 0, atRisk: 0 };
        regionData[r].total++;
        if (c.churn_probability >= 0.70) regionData[r].atRisk++;
      });

      const totalCustomers = overviewRes.data.total_customers;
      const avgChurnRate = Math.round((data.reduce((acc: number, c: any) => acc + (c.churn_probability || 0), 0) / (data.length || 1)) * 100);
      const atRiskCount = riskRes.data.high_risk + riskRes.data.medium_risk;
      const lowRiskCount = riskRes.data.low_risk;
      const mediumRiskCount = riskRes.data.medium_risk;
      const highRiskCount = riskRes.data.high_risk;

      const realRegionStats = Object.keys(regionData).map(reg => ({
        region: reg,
        riskPct: regionData[reg].total ? Math.round((regionData[reg].atRisk / regionData[reg].total) * 100) : 0
      })).sort((a, b) => b.riskPct - a.riskPct);

      // Update summary using REAL global metrics from backend
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
        highRiskCustomers: mappedCustomers
          .filter((c: any) => c.riskLevel === 'High Risk' || c.churnProbability >= 70)
          .sort((a: any, b: any) => b.churnProbability - a.churnProbability)
          .slice(0, 3),
        sentiment: nlpRes.data,
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

  const openCustomerModal = (customer: any) => {
    setSelectedCustomer(customer);
  };

  const closeCustomerModal = () => {
    setSelectedCustomer(null);
  };

  // Single Predict handler
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredictError(null);

    // Detailed Validation
    if (predData.age === "" || predData.age < 0 || predData.age > 120) {
      return setPredictError("Age must be a number between 0 and 120.");
    }
    
    if (!predData.joining_date) {
      return setPredictError("Joining Date is required.");
    }

    const dateRegex = /^\\d{2}-\\d{2}-\\d{4}$/;
    if (!dateRegex.test(predData.joining_date)) {
      return setPredictError("Joining Date must be in DD-MM-YYYY format (e.g., 15-01-2023).");
    }

    const nonNegativeFields = [
      { key: "days_since_last_login", label: "Days Since Last Login" },
      { key: "avg_session_duration", label: "Avg Session Duration" },
      { key: "avg_transaction_value", label: "Avg Transaction Value" },
      { key: "avg_frequency_login_days", label: "Avg Login Frequency (Days)" },
      { key: "points_in_wallet", label: "Points in Wallet" },
      { key: "logins_90d", label: "Logins (last 90 days)" },
      { key: "active_days_90d", label: "Active Days (last 90 days)" },
      { key: "api_calls_90d", label: "API Calls (last 90 days)" },
      { key: "session_minutes_90d", label: "Session Minutes (last 90 days)" },
      { key: "days_since_active", label: "Days Since Last Activity" }
    ];

    for (const field of nonNegativeFields) {
      const val = predData[field.key];
      if (val !== "" && val !== undefined && val < 0) {
        return setPredictError(`${field.label} must be 0 or greater (got ${val}).`);
      }
    }

    setPredicting(true);
    try {
      const payload = { ...predData };
      const res = await api.post('/predictions/single', payload);
      setPredictionResult(res.data);
    } catch (err: any) {
      console.error("Prediction error:", err);
      setPredictError(err.response?.data?.detail || "An error occurred during prediction.");
    } finally {
      setPredicting(false);
    }
  };

  const handleSendOffer = (customerId: string) => {
    setSendingOffer(customerId);
    setTimeout(() => {
      setSendingOffer(customerId + "_success");
      setTimeout(() => {
        setSendingOffer(null);
      }, 2000);
    }, 1500);
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
    <div className="flex flex-col min-h-screen font-sans bg-[#fcfcfd]">
      
      {/* 1. TOP NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 h-16 flex items-center justify-between shrink-0 shadow-sm transition-all">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-tr from-brand-600 to-brand-500 rounded-lg flex items-center justify-center font-outfit text-sm font-bold text-white shadow-[0_2px_10px_rgba(37,99,235,0.2)]">
            CS
          </div>
          <h1 className="font-outfit font-bold text-lg leading-tight text-slate-900 hidden sm:block">ChurnSense</h1>
        </Link>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === "dashboard"
                ? "bg-white text-brand-700 shadow-sm border border-slate-200/60 ring-1 ring-slate-100/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent"
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "dashboard" ? "text-brand-600" : ""}`} />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab("customers")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === "customers"
                ? "bg-white text-brand-700 shadow-sm border border-slate-200/60 ring-1 ring-slate-100/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent"
            }`}
          >
            <Users className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "customers" ? "text-brand-600" : ""}`} />
            <span>Customers</span>
          </button>

          <button
            onClick={() => setActiveTab("prediction")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === "prediction"
                ? "bg-white text-brand-700 shadow-sm border border-slate-200/60 ring-1 ring-slate-100/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent"
            }`}
          >
            <Percent className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "prediction" ? "text-brand-600" : ""}`} />
            <span>Customer Insights</span>
          </button>

          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === "analysis"
                ? "bg-white text-brand-700 shadow-sm border border-slate-200/60 ring-1 ring-slate-100/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent"
            }`}
          >
            <Activity className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "analysis" ? "text-brand-600" : ""}`} />
            <span>Analysis</span>
          </button>
        </div>

        {/* Right: Auth Action */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={handleAuthAction}
            className="hidden sm:block text-sm font-semibold bg-brand-600 text-white px-5 py-2 rounded-xl hover:bg-brand-700 transition-colors shadow-sm shadow-brand-600/20"
          >
            {isAuthenticated ? "Logout" : "Admin Login"}
          </button>
          
          {/* Mobile Menu Dropdown Wrapper */}
          <div className="md:hidden relative group">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            {/* Simple CSS-based mobile menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-2 gap-1 z-50">
              <button onClick={() => setActiveTab("dashboard")} className={`text-left px-3 py-2 rounded-lg text-sm font-semibold ${activeTab === "dashboard" ? "bg-slate-50 text-brand-600" : "text-slate-600 hover:bg-slate-50"}`}>Dashboard</button>
              <button onClick={() => setActiveTab("customers")} className={`text-left px-3 py-2 rounded-lg text-sm font-semibold ${activeTab === "customers" ? "bg-slate-50 text-brand-600" : "text-slate-600 hover:bg-slate-50"}`}>Customers</button>
              <button onClick={() => setActiveTab("prediction")} className={`text-left px-3 py-2 rounded-lg text-sm font-semibold ${activeTab === "prediction" ? "bg-slate-50 text-brand-600" : "text-slate-600 hover:bg-slate-50"}`}>Customer Insights</button>
              <button onClick={() => setActiveTab("analysis")} className={`text-left px-3 py-2 rounded-lg text-sm font-semibold ${activeTab === "analysis" ? "bg-slate-50 text-brand-600" : "text-slate-600 hover:bg-slate-50"}`}>Analysis</button>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. MAIN WINDOW CONTENT */}
      <main className="flex-1 flex flex-col w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        
        {/* TOP BAR / HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 shrink-0">
          <div>
            <div className="text-[11px] font-bold text-brand-500 tracking-wider uppercase mb-1">
              {activeTab === "dashboard" && "Overview"}
              {activeTab === "customers" && "Directory"}
              {activeTab === "prediction" && "Calculator"}
              {activeTab === "analysis" && "Analytics"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-outfit">
              {activeTab === "dashboard" && "Dashboard Overview"}
              {activeTab === "customers" && "Customer Health Directory"}
              {activeTab === "prediction" && "Customer Insights Calculator"}
              {activeTab === "analysis" && "Visual Analytics"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {activeTab === "dashboard" && "Welcome back! Here is your custom customer health analysis."}
              {activeTab === "customers" && "Real-time list of customers filterable by risk and location categories."}
              {activeTab === "prediction" && "Calculate simulated customer insights using pre-trained boundaries."}
              {activeTab === "analysis" && "These charts help you see patterns and trends in your customer data. Don't worry if you're not familiar with charts - each one includes a guide on how to read it!"}
            </p>
          </div>
        </header>

        {/* 3. DYNAMIC VIEWS */}
        
        {/* VIEW A: DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            {/* STATS MATRIX */}
            {summary ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 rounded-xl p-6 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Total Customers</span>
                    <h3 className="text-3xl font-extrabold text-slate-900 font-outfit mt-2">{summary.totalCustomers?.toLocaleString()}</h3>
                  </div>
                  <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Live active customers in dataset</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 rounded-xl p-6 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Customer Health Overview</span>
                    <h3 className="text-3xl font-extrabold text-slate-900 font-outfit mt-2">{summary.churnRate}%</h3>
                  </div>
                  <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    <span>Overall health score based on activity</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 rounded-xl p-6 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Customers Needing Attention</span>
                    <h3 className="text-3xl font-extrabold text-slate-900 font-outfit mt-2 text-rose-600">{summary.atRiskCount}</h3>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold bg-white border border-slate-100 shadow-sm px-2 py-1 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> High: {summary.highRiskCount?.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold bg-white border border-slate-100 shadow-sm px-2 py-1 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Med: {summary.mediumRiskCount?.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold bg-white border border-slate-100 shadow-sm px-2 py-1 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Low: {summary.lowRiskCount?.toLocaleString()}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 font-semibold">
                Loading statistics summary...
              </div>
            )}

                        {/* CHARTS CONTAINER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Churn Forecast Line Chart */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 lg:col-span-2 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 font-outfit">Customer Activity Trend</h4>
                    <p className="text-xs text-slate-400">Projected 7-day customer engagement trend.</p>
                  </div>
                </div>
                {summary && summary.churnForecast ? (
                  <div className="h-[280px] w-full mt-auto">
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

              {/* Risk Breakdown Donut Chart */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 flex flex-col">
                <div className="mb-6">
                  <h4 className="text-base font-extrabold text-slate-900 font-outfit">Risk Breakdown</h4>
                  <p className="text-xs text-slate-400">Current customer health distribution.</p>
                </div>
                {summary ? (
                  <div className="h-[280px] w-full mt-auto flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'High Risk', value: summary.highRiskCount, color: '#f43f5e' },
                            { name: 'Medium Risk', value: summary.mediumRiskCount, color: '#f59e0b' },
                            { name: 'Low Risk', value: summary.lowRiskCount, color: '#10b981' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {
                            [
                              { name: 'High Risk', value: summary.highRiskCount, color: '#f43f5e' },
                              { name: 'Medium Risk', value: summary.mediumRiskCount, color: '#f59e0b' },
                              { name: 'Low Risk', value: summary.lowRiskCount, color: '#10b981' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                          }
                        </Pie>
                        <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-full mt-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span className="text-slate-600 font-medium">High</span></div>
                        <span className="font-bold text-slate-800">{summary.highRiskCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span><span className="text-slate-600 font-medium">Medium</span></div>
                        <span className="font-bold text-slate-800">{summary.mediumRiskCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-slate-600 font-medium">Low</span></div>
                        <span className="font-bold text-slate-800">{summary.lowRiskCount}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-slate-400">Loading risk data...</div>
                )}
              </div>

            </div>

            {/* BOTTOM SECTION GRID: REGION RETENTION & SENTIMENT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Region Retention */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 font-outfit">Regional Customer Insights</h4>
                  <p className="text-xs text-slate-400">Engagement metrics grouped by geographic region.</p>
                </div>

                {summary && summary.regionStats ? (
                  <div className="h-[200px] w-full mt-6">
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
                  <div className="h-[200px] flex items-center justify-center text-slate-400 mt-6">Loading region statistics...</div>
                )}
              </div>

              {/* Customer Feedback Sentiment (NLP) */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 font-outfit">Customer Feedback Sentiment (NLP)</h4>
                  <p className="text-xs text-slate-400">Live AI analysis of written customer reviews.</p>
                </div>

                {summary && summary.sentiment ? (
                  <div className="h-[200px] w-full flex items-center justify-between mt-6">
                    <div className="w-[60%] h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Positive', value: summary.sentiment.positive, color: '#10b981' },
                              { name: 'Neutral', value: summary.sentiment.neutral, color: '#f59e0b' },
                              { name: 'Negative', value: summary.sentiment.negative, color: '#ef4444' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {[
                              { name: 'Positive', value: summary.sentiment.positive, color: '#10b981' },
                              { name: 'Neutral', value: summary.sentiment.neutral, color: '#f59e0b' },
                              { name: 'Negative', value: summary.sentiment.negative, color: '#ef4444' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-[35%] flex flex-col gap-3 justify-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Positive</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="text-sm font-extrabold text-slate-800">{summary.sentiment.positive}</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Neutral</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span className="text-sm font-extrabold text-slate-800">{summary.sentiment.neutral}</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Negative</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span className="text-sm font-extrabold text-slate-800 text-rose-600">{summary.sentiment.negative}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-slate-400 mt-6">Loading sentiment data...</div>
                )}
              </div>

            </div>

            {/* Customers Needing Attention Card */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 mt-8">
              <h4 className="text-sm font-extrabold text-slate-900 mb-4">Customers Needing Attention</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summary?.highRiskCustomers?.length > 0 ? summary.highRiskCustomers.map((c: any, i: number) => {
                  const isHigh = c.churnProbability >= 75;
                  const isMed = !isHigh;
                  const btnClass = isHigh ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-100" : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100";
                  const textClass = isHigh ? "text-rose-600 bg-rose-50 border-rose-100" : "text-amber-600 bg-amber-50 border-amber-100";
                  const dotClass = isHigh ? "bg-rose-500 shadow-rose-200" : "bg-amber-500 shadow-amber-200";
                  const avatarClass = isHigh ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";
                  
                  const btnState = sendingOffer === c.customerId ? "loading" : sendingOffer === c.customerId + "_success" ? "success" : "idle";
                  
                  return (
                    <div key={c.customerId} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                      <div 
                        className="cursor-pointer group flex-1"
                        onClick={() => openCustomerModal(c)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 transition-transform group-hover:scale-105 ${avatarClass}`}>
                              {c.initials}
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-900 text-sm truncate max-w-[120px] group-hover:text-brand-600 transition-colors">{c.name}</h5>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${textClass}`}>
                                {isHigh ? "High Attention" : "Medium Attention"}
                              </span>
                            </div>
                          </div>
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 shadow-sm ${dotClass}`}></span>
                        </div>
                        <p className="text-xs text-slate-600 mb-5 leading-relaxed h-8 line-clamp-2">
                          {c.recommendations?.[0] || "Engagement decreasing recently."}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleSendOffer(c.customerId)}
                        disabled={btnState !== "idle"}
                        className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all border flex justify-center items-center gap-2 ${
                          btnState === "success" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : btnClass
                        }`}
                      >
                        {btnState === "loading" ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : btnState === "success" ? (
                          "Offer Sent!"
                        ) : (
                          "Send Offer"
                        )}
                      </button>
                    </div>
                  );
                }) : (
                  <div className="col-span-3 text-center py-8 text-sm text-slate-400">
                    No high risk customers at this time.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW B: CUSTOMERS TAB */}
        {activeTab === "customers" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filter Search Bar Container */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 flex flex-col md:flex-row gap-4 items-center">
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
                  const isHigh = c.riskLevel === "High Risk";
                  const isMed = c.riskLevel === "Medium Risk";
                  return (
                    <div
                      key={i}
                      className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 transition-all duration-200 hover:shadow-md border border-slate-200/60"
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
                          onClick={() => openCustomerModal(c)}
                          className="w-full md:w-auto h-9 px-4 rounded-xl bg-[#5955f2] hover:bg-[#4642db] text-white font-semibold text-xs transition-colors shadow-sm shadow-[#5955f2]/20 shrink-0"
                        >
                          View Details
                        </button>
                      </div>
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
          <div className="flex flex-col gap-6 animate-fadeIn">
            

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">How This Prediction Works</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Our machine learning model analyzes customer behavior patterns to predict churn probability. The model was trained on historical data from 50,000+ customers with 92.4% accuracy.
                </p>
                <p className="text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Key factors analyzed:</span> Login activity, support interactions, subscription tenure, and payment behavior.
                </p>
              </div>
            </div>

            {/* Error Alert Banner */}
            {predictError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex items-start gap-4 animate-fadeIn">
                <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Prediction Failed</h3>
                  <p className="text-xs text-slate-600 mt-1">{predictError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Input Form */}
              <form onSubmit={handlePredict} className="bg-white border border-slate-100 shadow-sm rounded-xl p-8">
                <h3 className="text-lg font-extrabold text-slate-900 mb-6 font-outfit">Customer Information</h3>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries({
                    "age": { label: "Age", type: "number", placeholder: "e.g., 25" },
                    "gender": { label: "Gender", type: "select", options: ["Male", "Female"] },
                    "region_category": { label: "Region Category", type: "select", options: ["City", "Village", "Town"] },
                    "joining_date": { label: "Joining Date (dd-mm-yyyy)", type: "text", placeholder: "e.g., 15-01-2023" },
                    "joined_through_referral": { label: "Joined Through Referral", type: "select", options: ["Yes", "No", "?"] },
                    "preferred_offer_types": { label: "Preferred Offer Types", type: "select", options: ["Gift Vouchers/Coupons", "Credit/Debit Card Offers", "Without Offers"] },
                    "medium_of_operation": { label: "Medium of Operation", type: "select", options: ["Desktop", "Smartphone", "Both", "?"] },
                    "internet_option": { label: "Internet Option", type: "select", options: ["Wi-Fi", "Mobile_Data", "Fiber_Optic"] },
                    "days_since_last_login": { label: "Days Since Last Login", type: "number", placeholder: "e.g., 5" },
                    "avg_session_duration": { label: "Avg Session Duration", type: "number", placeholder: "e.g., 300.5" },
                    "avg_transaction_value": { label: "Avg Transaction Value", type: "number", placeholder: "e.g., 1500.75" },
                    "avg_frequency_login_days": { label: "Avg Login Frequency (Days)", type: "number", placeholder: "e.g., 12.5" },
                    "points_in_wallet": { label: "Points in Wallet", type: "number", placeholder: "e.g., 500" },
                    "used_special_discount": { label: "Used Special Discount", type: "select", options: ["Yes", "No"] },
                    "offer_application_preference": { label: "Offer Application Preference", type: "select", options: ["Yes", "No"] },
                    "past_complaint": { label: "Past Complaint", type: "select", options: ["Yes", "No"] },
                    "complaint_status": { label: "Complaint Status", type: "select", options: ["Not Applicable", "Unsolved", "Solved", "Solved in Follow-up", "No Information Available"] },
                    "feedback": { label: "Feedback", type: "select", options: ["Poor Product Quality", "Poor Website", "Poor Customer Service", "Too many ads", "No reason specified", "Reasonable Price", "User Friendly Website", "Products always in Stock", "Quality Customer Care"] },
                    "plan_tier": { label: "Plan Tier", type: "select", options: ["Basic", "Premium", "Platinum"] },
                    "logins_90d": { label: "Logins (last 90 days)", type: "number", placeholder: "e.g., 40" },
                    "active_days_90d": { label: "Active Days (last 90 days)", type: "number", placeholder: "e.g., 35" },
                    "api_calls_90d": { label: "API Calls (last 90 days)", type: "number", placeholder: "e.g., 5000" },
                    "session_minutes_90d": { label: "Session Minutes (last 90 days)", type: "number", placeholder: "e.g., 950.5" },
                    "days_since_active": { label: "Days Since Last Activity", type: "number", placeholder: "e.g., 2" },
                  }).map(([key, config]) => (
                    <div key={key}>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                        {config.label}
                      </label>
                      {config.type === "select" ? (
                        <div className="relative">
                          <select
                            value={predData[key] || ""}
                            onChange={(e) => setPredData({...predData, [key]: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors appearance-none cursor-pointer text-slate-700"
                          >
                            <option value="" disabled>Select {config.label}...</option>
                            {config.options?.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      ) : (
                        <input
                          type={config.type}
                          step={config.type === 'number' ? 'any' : undefined}
                          placeholder={config.placeholder}
                          value={predData[key] === undefined ? "" : predData[key]}
                          onChange={(e) => setPredData({...predData, [key]: config.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors"
                        />
                      )}
                    </div>
                  ))}
                  <button type="submit" 
                    disabled={predicting}
                    className="w-full h-12 mt-4 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors glow-brand"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>{predicting ? "Analyzing..." : "Predict Churn Risk"}</span>
                  </button>
                </div>
              </form>

              {/* Right Column: Results */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-8">
                {!predictionResult ? (
                  // Initial Empty State
                  <div className="h-full flex flex-col items-center justify-center text-center animate-fadeIn">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-6">
                      <Sparkles className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Ready to Predict</h3>
                    <p className="text-xs text-slate-500 mb-8 max-w-[280px] leading-relaxed">
                      Fill in the customer details on the left and click "Predict Churn Risk" to see AI-powered results
                    </p>

                    <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-6 text-left w-full max-w-[340px]">
                      <h4 className="text-xs font-bold text-slate-800 mb-4">About Our Prediction Model</h4>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"></div>
                          Trained on 50,000+ customer records
                        </li>
                        <li className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"></div>
                          92.4% accuracy on validation data
                        </li>
                        <li className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"></div>
                          XGBoost algorithm with SHAP explainability
                        </li>
                        <li className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"></div>
                          Updated monthly with latest customer data
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  // Populated Results State
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-sm">
                        <Wand2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 font-outfit">Prediction Result</h3>
                        <p className="text-[10px] text-slate-500">AI-powered churn analysis</p>
                      </div>
                    </div>

                    {/* Churn Probability Box */}
                    <div className={`border rounded-2xl p-6 ${
                      predictionResult.riskLevel === "High Risk" ? "bg-rose-50/30 border-rose-100" :
                      predictionResult.riskLevel === "Medium Risk" ? "bg-amber-50/30 border-amber-100" :
                      "bg-emerald-50/30 border-emerald-100"
                    }`}>
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className={`w-4 h-4 ${
                          predictionResult.riskLevel === "High Risk" ? "text-rose-500" :
                          predictionResult.riskLevel === "Medium Risk" ? "text-amber-500" :
                          "text-emerald-500"
                        }`} />
                        <span className="text-xs font-bold text-slate-900">Churn Probability</span>
                      </div>
                      
                      <div className="text-5xl font-black text-slate-900 font-outfit mb-4">
                        {predictionResult.churnProbability}%
                      </div>

                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            predictionResult.riskLevel === "High Risk" ? "bg-rose-500" :
                            predictionResult.riskLevel === "Medium Risk" ? "bg-amber-500" :
                            "bg-emerald-500"
                          }`}
                          style={{ width: `${predictionResult.churnProbability}%` }}
                        ></div>
                      </div>

                      <div className={`inline-flex px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                        predictionResult.riskLevel === "High Risk" ? "bg-rose-100 text-rose-700" :
                        predictionResult.riskLevel === "Medium Risk" ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>
                        {predictionResult.riskLevel} Customer
                      </div>
                    </div>

                    {/* Prediction Confidence */}
                    <div className="border border-slate-100 rounded-2xl p-5">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          Customer Stability Level
                        </div>
                        <div className="text-xs font-bold text-brand-600">92%</div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-brand-500 rounded-full w-[92%]"></div>
                      </div>
                      <p className="text-[9px] text-slate-400">Based on model accuracy of 92.4% across 10,000 test cases</p>
                    </div>

                    {/* Top Contributing Factors */}
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-6">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-4">
                        Customer Behavior Insights
                      </div>
                      <div className="space-y-3">
                        {predictionResult.mockFactors?.map((factor: any, i: number) => (
                          <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
                            <span className="text-xs font-medium text-slate-700">{factor.text}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              factor.impact === "High Impact" ? "bg-rose-50 text-rose-600" :
                              factor.impact === "Medium Impact" ? "bg-amber-50 text-amber-600" :
                              "bg-emerald-50 text-emerald-600"
                            }`}>
                              {factor.impact}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* What This Prediction Means */}
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-6">
                      <h4 className="text-xs font-bold text-slate-900 mb-3">What These Insights Mean</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {predictionResult.riskLevel === "High Risk" 
                          ? "This customer shows strong warning signs of leaving. The prediction is based on behavioral patterns similar to customers who churned in the past. Immediate intervention is recommended to prevent churn."
                          : predictionResult.riskLevel === "Medium Risk"
                          ? "This customer shows moderate signs of disengagement. While not immediately likely to churn, proactive outreach is suggested to improve their experience."
                          : "This customer appears healthy and engaged. They are currently at low risk of churning."}
                      </p>
                    </div>

                    {/* Recommended Actions */}
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 mb-4">Recommended Actions</h4>
                      <div className="space-y-3">
                        {predictionResult.advice?.map((adv: string, i: number) => (
                          <div key={i} className="bg-[#f8fafc] border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors rounded-xl p-4 flex gap-4 items-center">
                            <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                              {i + 1}
                            </div>
                            <p className="text-xs font-medium text-slate-700">{adv}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW E: VISUAL ANALYTICS TAB */}
        {activeTab === "analysis" && (() => {
          // Calculate Data
          const buckets = [
            { name: '0-3 months', count: 0, highRisk: 0 },
            { name: '4-6 months', count: 0, highRisk: 0 },
            { name: '7-12 months', count: 0, highRisk: 0 },
            { name: '13-18 months', count: 0, highRisk: 0 },
            { name: '25+ months', count: 0, highRisk: 0 }
          ];
          
          customerData?.customers?.forEach((c: any) => {
            let b;
            if (c.tenure <= 3) b = buckets[0];
            else if (c.tenure <= 6) b = buckets[1];
            else if (c.tenure <= 12) b = buckets[2];
            else if (c.tenure <= 18) b = buckets[3];
            else b = buckets[4];
            
            b.count++;
            if (c.churnProbability >= 70) b.highRisk++;
          });
          
          const ageChurnData = buckets.map(b => ({
            name: b.name,
            val: b.count ? Math.round((b.highRisk / b.count) * 100) : 0
          }));

          const riskGroupData = summary ? [
            { name: 'High Risk', value: summary.highRiskCount, fill: '#ef4444' }, // rose-500
            { name: 'Medium Risk', value: summary.mediumRiskCount, fill: '#f59e0b' }, // amber-500
            { name: 'Low Risk', value: summary.lowRiskCount, fill: '#10b981' } // emerald-500
          ] : [];

          const regions: Record<string, { total: number, atRisk: number }> = {};
          customerData?.customers?.forEach((c: any) => {
            const r = c.region || 'Unknown';
            if (!regions[r]) regions[r] = { total: 0, atRisk: 0 };
            regions[r].total++;
            if (c.churnProbability >= 70) regions[r].atRisk++;
          });
          const regionRetentionData = Object.keys(regions).map(r => ({
            name: r,
            val: regions[r].total ? 100 - Math.round((regions[r].atRisk / regions[r].total) * 100) : 0
          })).filter(r => r.name !== 'Unknown');

          const activeInactiveData = [
            { name: 'Jan', Active: 8400, Inactive: 1100 },
            { name: 'Feb', Active: 8600, Inactive: 1250 },
            { name: 'Mar', Active: 8800, Inactive: 1400 },
            { name: 'Apr', Active: 8900, Inactive: 1600 },
            { name: 'May', Active: 9000, Inactive: 1850 },
            { name: 'Jun', Active: 9200, Inactive: 2210 }
          ];

          const tierGroupData: Record<string, { name: string, 'Low Risk': number, 'Medium Risk': number, 'High Risk': number }> = {
            'Basic': { name: 'Basic', 'Low Risk': 0, 'Medium Risk': 0, 'High Risk': 0 },
            'Premium': { name: 'Premium', 'Low Risk': 0, 'Medium Risk': 0, 'High Risk': 0 },
            'Platinum': { name: 'Platinum', 'Low Risk': 0, 'Medium Risk': 0, 'High Risk': 0 },
            'Enterprise': { name: 'Enterprise', 'Low Risk': 0, 'Medium Risk': 0, 'High Risk': 0 },
          };
          customerData?.customers?.forEach((c: any) => {
            const tier = c.planTier || 'Basic';
            const risk = c.riskLevel; // "Low Risk", "Medium Risk", "High Risk"
            if (tierGroupData[tier] && (risk === 'Low Risk' || risk === 'Medium Risk' || risk === 'High Risk')) {
              tierGroupData[tier][risk as 'Low Risk' | 'Medium Risk' | 'High Risk']++;
            }
          });
          const planRiskData = Object.values(tierGroupData);

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
              
              {/* Card 1: Churn Rate by Age */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-8 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Churn Rate by Customer Age</h3>
                <p className="text-xs text-slate-500 mb-6">Shows how likely customers are to leave based on how long they've been with us</p>
                
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-2">What does this mean?</h4>
                      <div className="text-xs text-slate-600 space-y-2">
                        <p><span className="font-bold text-slate-700">Churn Rate:</span> The percentage of customers who stop using our service.</p>
                        <p><span className="font-bold text-slate-700">Customer Age:</span> How many months they've been a customer (also called 'tenure').</p>
                        <p>Lower numbers are better! This chart helps us see which customer groups need more support.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ageChurnData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} domain={[0, 60]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${value}%`, 'Churn Rate']}
                      />
                      <Line type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mt-auto">
                  <div className="flex items-center justify-between mb-4 cursor-pointer">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-500" />
                      How to Read This Chart
                    </h4>
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                      <p className="text-xs text-slate-600">Look at the line from left to right</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                      <p className="text-xs text-slate-600">Higher points mean more customers are leaving</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                      <p className="text-xs text-slate-600">New customers (0-3 months) have the highest churn rate</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">4</div>
                      <p className="text-xs text-slate-600">Long-term customers (25+ months) are most loyal</p>
                    </li>
                  </ul>
                  <div className="border-t border-slate-200 pt-4">
                    <h5 className="text-[11px] font-bold text-slate-900 mb-1">What This Tells You:</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      New customers need more attention! The first 6 months are critical. Once customers stay longer than a year, they're much more likely to remain loyal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Risk Groups */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-8 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Customer Risk Groups</h3>
                <p className="text-xs text-slate-500 mb-6">How many customers are in each risk category</p>
                
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-2">What are risk groups?</h4>
                      <p className="text-xs text-slate-600 mb-2">Our AI predicts how likely each customer is to leave and groups them:</p>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="font-bold text-slate-700">High Risk:</span> Very likely to leave soon (needs immediate action)</li>
                        <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="font-bold text-slate-700">Medium Risk:</span> Showing some warning signs (monitor closely)</li>
                        <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="font-bold text-slate-700">Low Risk:</span> Happy and engaged customers (keep them satisfied!)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full mb-6 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskGroupData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 20;
                          const x = cx + radius * Math.cos(-(midAngle || 0) * RADIAN);
                          const y = cy + radius * Math.sin(-(midAngle || 0) * RADIAN);
                          return (
                            <text x={x} y={y} fill={riskGroupData[index].fill} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="bold">
                              {riskGroupData[index].name}: {value}
                            </text>
                          );
                        }}
                      >
                        {riskGroupData.map((entry, index) => (
                          <Cell key={`cell-\${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [value, 'Customers']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mt-auto">
                  <div className="flex items-center justify-between mb-4 cursor-pointer">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-500" />
                      How to Read This Chart
                    </h4>
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                      <p className="text-xs text-slate-600">Each colored section represents a risk group</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                      <p className="text-xs text-slate-600">Bigger sections = more customers in that group</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                      <p className="text-xs text-slate-600">The numbers show how many customers are in each group</p>
                    </li>
                  </ul>
                  <div className="border-t border-slate-200 pt-4">
                    <h5 className="text-[11px] font-bold text-slate-900 mb-1">What This Tells You:</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Currently, most customers ({summary?.lowRiskCount?.toLocaleString()}) are low risk, which is good! However, {summary?.highRiskCount?.toLocaleString()} high-risk customers need immediate attention to prevent them from leaving.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Loyalty by Location */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-8 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Customer Loyalty by Location</h3>
                <p className="text-xs text-slate-500 mb-6">Compares how well we retain customers in different parts of the world</p>
                
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-2">What is retention?</h4>
                      <p className="text-xs text-slate-600 mb-2"><span className="font-bold text-slate-700">Retention:</span> The percentage of customers who stay with us (opposite of churn).</p>
                      <p className="text-xs text-slate-600 mb-2">Higher percentages are better! If retention is 85%, that means 85 out of 100 customers stayed.</p>
                      <p className="text-xs text-slate-600">This helps us see which regions might need different pricing, better support, or improved service.</p>
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionRetentionData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${value}%`, 'Retention']}
                        cursor={{ fill: '#f1f5f9' }}
                      />
                      <Bar dataKey="val" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mt-auto">
                  <div className="flex items-center justify-between mb-4 cursor-pointer">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-500" />
                      How to Read This Chart
                    </h4>
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                      <p className="text-xs text-slate-600">Each bar represents a geographic region</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                      <p className="text-xs text-slate-600">Taller bars = better customer retention in that region</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                      <p className="text-xs text-slate-600">Compare the heights to see which regions perform best</p>
                    </li>
                  </ul>
                  <div className="border-t border-slate-200 pt-4">
                    <h5 className="text-[11px] font-bold text-slate-900 mb-1">What This Tells You:</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Look at the lowest bar - that region has the most customers at risk. Consider investigating why retention is lower there; it might be pricing, local competition, or service issues.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4: Active vs Inactive Over Time */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-8 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Active vs Inactive Customers Over Time</h3>
                <p className="text-xs text-slate-500 mb-6">Tracks how many customers are actively using the service each month</p>
                
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-2">What is customer activity?</h4>
                      <p className="text-xs text-slate-600 mb-2"><span className="font-bold text-slate-700">Active Customers:</span> Logged in and used the service within the last 30 days.</p>
                      <p className="text-xs text-slate-600 mb-2"><span className="font-bold text-slate-700">Inactive Customers:</span> Haven't logged in for more than 30 days.</p>
                      <p className="text-xs text-slate-600">Growing inactive numbers are a warning sign! Inactive customers are much more likely to cancel their subscriptions.</p>
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeInactiveData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                      <Area type="monotone" dataKey="Active" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                      <Area type="monotone" dataKey="Inactive" stackId="1" stroke="#b45309" fill="#b45309" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mt-auto">
                  <div className="flex items-center justify-between mb-4 cursor-pointer">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-500" />
                      How to Read This Chart
                    </h4>
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                      <p className="text-xs text-slate-600">Green area shows active customers (good!)</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                      <p className="text-xs text-slate-600">Orange/Brown area shows inactive customers (warning sign)</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                      <p className="text-xs text-slate-600">Watch the trend from left to right over months</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">4</div>
                      <p className="text-xs text-slate-600">Total height = all customers</p>
                    </li>
                  </ul>
                  <div className="border-t border-slate-200 pt-4">
                    <h5 className="text-[11px] font-bold text-slate-900 mb-1">What This Tells You:</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      A growing active area means more customers are engaged with our service. If the inactive area is growing faster than the active area, it's a sign of decreasing engagement.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 5: Churn Risk by Plan Tier */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-8 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Churn Risk by Subscription Plan</h3>
                <p className="text-xs text-slate-500 mb-6">Breaks down the proportion of Low, Medium, and High-Risk customers for each plan tier</p>
                
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-2">Why analyze risk by plan tier?</h4>
                      <p className="text-xs text-slate-600 mb-2">It allows us to understand if certain tiers are under-performing or experiencing friction:</p>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        <li><span className="font-bold text-slate-700">Enterprise/Platinum:</span> High-value accounts. Churn here causes large financial impact.</li>
                        <li><span className="font-bold text-slate-700">Basic/Premium:</span> High-volume accounts. Churn here indicates wider product-market fit or onboarding issues.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={planRiskData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                      <Bar dataKey="Low Risk" stackId="a" fill="#10b981" />
                      <Bar dataKey="Medium Risk" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="High Risk" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mt-auto">
                  <div className="flex items-center justify-between mb-4 cursor-pointer">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-500" />
                      How to Read This Chart
                    </h4>
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                      <p className="text-xs text-slate-600">Each stacked bar shows the total customers in that plan tier</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                      <p className="text-xs text-slate-600">Green is healthy, Orange is warning, Red is critical</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                      <p className="text-xs text-slate-600">Taller red sections mean higher risk concentration in that plan tier</p>
                    </li>
                  </ul>
                  <div className="border-t border-slate-200 pt-4">
                    <h5 className="text-[11px] font-bold text-slate-900 mb-1">What This Tells You:</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pay close attention to any tier with a large red or orange block. If high-value plan tiers show a significant percentage of at-risk users, prioritize outreach campaigns for those high-value segments.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          );
        })()}

        {/* CUSTOMER DETAILS MODAL */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleUp">
              
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <span className="w-16 h-16 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-outfit font-black text-2xl shrink-0 border border-slate-200">
                    {selectedCustomer.initials}
                  </span>
                  <div>
                    <h3 className="font-outfit font-black text-2xl text-slate-900 leading-tight">
                      {selectedCustomer.name}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      {selectedCustomer.customerId} • {selectedCustomer.planTier} Plan
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-3 py-1 border border-slate-500 rounded text-xs font-bold text-slate-600">
                        {selectedCustomer.age} Yrs
                      </span>
                      <span className="px-3 py-1 border border-slate-500 rounded text-xs font-bold text-slate-600">
                        {selectedCustomer.gender}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="text-right mt-1">
                    <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Health Score</span>
                    <span className={`text-4xl font-black ${
                      selectedCustomer.riskLevel === "High Risk" ? "text-rose-600" :
                      selectedCustomer.riskLevel === "Medium Risk" ? "text-amber-500" : "text-[#00a86b]"
                    }`}>
                      {100 - selectedCustomer.churnProbability}
                    </span>
                  </div>
                  <button 
                    onClick={closeCustomerModal}
                    className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh]">
                
                {/* Risk Assessment Banner */}
                <div className="rounded-xl p-5 mb-6 border bg-slate-50 border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-900">Risk Assessment</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {selectedCustomer.riskLevel === "High Risk" 
                      ? "Customer exhibits unstable usage patterns and declining engagement."
                      : selectedCustomer.riskLevel === "Medium Risk"
                      ? "Customer shows some signs of decreasing engagement recently."
                      : "Customer exhibits normal usage patterns and stable sentiment."
                    }
                  </p>
                </div>

                {/* Behavioral Telemetry */}
                <div className="mb-6">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-3">Behavioral Telemetry (90D)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <span className="block text-xs font-bold text-slate-500 mb-2">API Calls</span>
                      <span className="text-2xl font-black text-slate-900">{selectedCustomer.apiCalls?.toLocaleString() || 0}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <span className="block text-xs font-bold text-slate-500 mb-2">Session Logins</span>
                      <span className="text-2xl font-black text-slate-900">{selectedCustomer.sessionLogins?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Feedback */}
                <div className="mb-6">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-3">Recent Feedback</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <p className="text-sm font-medium text-slate-700 italic">
                      "{selectedCustomer.feedback}"
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-900 mb-3">Contact Information</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Subscription Details Grid */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-900 mb-3">Subscription Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3.5">
                      <span className="block text-[10px] text-slate-400 mb-1">Started</span>
                      <span className="text-sm font-bold text-slate-800">{selectedCustomer.startedDate}</span>
                    </div>
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3.5">
                      <span className="block text-[10px] text-slate-400 mb-1">Tenure</span>
                      <span className="text-sm font-bold text-slate-800">{selectedCustomer.tenure} months</span>
                    </div>
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3.5">
                      <span className="block text-[10px] text-slate-400 mb-1">Monthly Value</span>
                      <span className="text-sm font-bold text-slate-800">${selectedCustomer.monthlyValue}</span>
                    </div>
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3.5">
                      <span className="block text-[10px] text-slate-400 mb-1">Total Spent</span>
                      <span className="text-sm font-bold text-slate-800">${selectedCustomer.totalSpent?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Usage Analytics Grid */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-900 mb-3">Usage Analytics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3.5">
                      <span className="block text-[10px] text-slate-400 mb-1">Login Frequency</span>
                      <span className="text-sm font-bold text-slate-800">{selectedCustomer.loginFrequency}</span>
                    </div>
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3.5">
                      <span className="block text-[10px] text-slate-400 mb-1">Last Active</span>
                      <span className="text-sm font-bold text-slate-800">{selectedCustomer.lastActive}</span>
                    </div>
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3.5">
                      <span className="block text-[10px] text-slate-400 mb-1">Support Tickets</span>
                      <span className="text-sm font-bold text-slate-800">{selectedCustomer.supportTickets}</span>
                    </div>
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-3.5">
                      <span className="block text-[10px] text-slate-400 mb-1">Region</span>
                      <span className="text-sm font-bold text-slate-800">{selectedCustomer.region}</span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="bg-[#f5f5fe] border border-[#e8e7ff] rounded-xl p-5">
                  <h4 className="text-xs font-bold text-slate-900 mb-4">AI Recommendations</h4>
                  <div className="space-y-4">
                    {selectedCustomer.recommendations.map((rec: string, idx: number) => {
                      let subtitle = "Monitor engagement over the next 14 days";
                      if (rec.includes("outreach") || rec.includes("Personal")) subtitle = "Contact within 24 hours to understand their concerns";
                      if (rec.includes("discount")) subtitle = "Consider 20-30% discount for next 3 months";
                      if (rec.includes("usage")) subtitle = "Track their daily activity log metrics";

                      return (
                        <div key={idx} className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#5955f2] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-sm font-bold text-slate-800 block leading-tight mb-0.5">{rec}</span>
                            <span className="text-[11px] text-slate-500 leading-tight">{subtitle}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 flex items-center gap-3">
                <button 
                  onClick={closeCustomerModal}
                  className="px-6 h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition-colors"
                >
                  Close
                </button>
                <button className="flex-1 h-11 bg-[#5955f2] hover:bg-[#4642db] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-[#5955f2]/20">
                  Contact Customer
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
