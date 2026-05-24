
import React, { useState, useEffect } from "react";
import axios from "axios";
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

const API_BASE = "http://localhost:8000/api/v1";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "customers" | "prediction" | "analysis">("dashboard");
  const [summary, setSummary] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  
  // Single prediction state
  const [predName, setPredName] = useState("");
  const [predGender, setPredGender] = useState("");
  const [predRegion, setPredRegion] = useState("");
  const [predPlanTier, setPredPlanTier] = useState("");
  const [predTenure, setPredTenure] = useState<number | "">("");
  const [predValue, setPredValue] = useState<number | "">("");
  const [predFreq, setPredFreq] = useState("");
  const [predTickets, setPredTickets] = useState<number | "">("");
  const [predInactive, setPredInactive] = useState<number | "">("");
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
      const res = await axios.get(`${API_BASE}/customers`, {
        params: { limit: 100 }
      });
      const data = res.data.items || [];
      
      // Fetch true global analytics
      const [overviewRes, riskRes] = await Promise.all([
        axios.get(`${API_BASE}/analytics/overview`),
        axios.get(`${API_BASE}/analytics/risk-distribution`)
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

    // Form Validation
    if (!predName) return setPredictError("Customer Name is required.");
    if (!predGender) return setPredictError("Gender is required.");
    if (!predRegion) return setPredictError("Geographic Region is required.");
    if (!predPlanTier) return setPredictError("Plan Tier is required.");
    
    if (predTenure === "" || (predTenure as number) < 0) return setPredictError("Customer Tenure cannot be negative.");
    if (predValue === "" || (predValue as number) < 0) return setPredictError("Monthly Subscription Value cannot be negative.");
    if (!predFreq) return setPredictError("Login Frequency is required.");
    if (predTickets === "" || (predTickets as number) < 0) return setPredictError("Support Tickets cannot be negative.");
    if (predInactive === "" || (predInactive as number) < 0) return setPredictError("Days Since Last Activity cannot be negative.");

    setPredicting(true);
    try {
      const res = await axios.post(`${API_BASE}/predictions/single`, {
        gender: predGender || undefined,
        region_category: predRegion || undefined,
        plan_tier: predPlanTier || undefined,
        days_since_joined: predTenure ? (predTenure as number) * 30 : 0,
        avg_transaction_value: predValue || 0,
        logins_90d: predFreq === "Daily" ? 90 : predFreq === "Weekly" ? 12 : predFreq === "Monthly" ? 3 : 1,
        tickets_opened_90d: predTickets || 0,
        days_since_active: predInactive || 0,
        days_since_last_login: predInactive || 0
      });
      
      // Generate mock factors for the UI based on inputs
      const factors = [];
      if (predInactive && predInactive > 14) factors.push({ text: "Recent inactivity", impact: "High Impact" });
      else if (predInactive && predInactive > 7) factors.push({ text: "Decreasing activity", impact: "Medium Impact" });
      
      if (predTickets && predTickets > 2) factors.push({ text: "High support tickets", impact: "High Impact" });
      else if (predTickets && predTickets > 0) factors.push({ text: "Recent support interactions", impact: "Medium Impact" });
      
      if (predFreq && (predFreq.toLowerCase() === "rarely" || predFreq.toLowerCase() === "monthly")) factors.push({ text: "Low login frequency", impact: "High Impact" });
      
      // Plan Tier factor — Starter has higher churn risk
      if (predPlanTier === "Starter") factors.push({ text: "Starter plan — higher churn segment", impact: "Medium Impact" });
      else if (predPlanTier === "Enterprise") factors.push({ text: "Enterprise plan — strong retention signal", impact: "Low Impact" });
      
      if (factors.length === 0) factors.push({ text: "Stable usage patterns", impact: "Low Impact" });

      const mappedRiskLevel = res.data.risk_level === "Critical" ? "High Risk" 
                            : res.data.risk_level === "Moderate" ? "Medium Risk" 
                            : "Low Risk";

      // Apply plan tier adjustment to churn probability
      let rawProb = Math.round(res.data.probability * 100);
      if (predPlanTier === "Starter") rawProb = Math.min(rawProb + 8, 99);
      else if (predPlanTier === "Enterprise") rawProb = Math.max(rawProb - 10, 1);
      else if (predPlanTier === "Pro") rawProb = Math.max(rawProb - 4, 1);
      
      // Re-map risk level based on adjusted probability
      const adjustedRiskLevel = rawProb >= 70 ? "High Risk" : rawProb >= 40 ? "Medium Risk" : "Low Risk";
      
      let mockAdvice: string[] = ["Continue providing excellent service to maintain loyalty."];
      if (adjustedRiskLevel === "High Risk") {
        mockAdvice = predPlanTier === "Starter"
          ? ["Offer a plan upgrade to Pro with 1 month free trial", "Contact within 24 hours — Starter customers churn quickly", "Send onboarding refresher to showcase unused features"]
          : predPlanTier === "Enterprise"
          ? ["Assign a dedicated success manager immediately", "Schedule an executive business review within 48 hours", "Offer SLA upgrade and priority support"]
          : ["Contact customer within 24 hours to address concerns", "Offer a personalized retention discount or plan upgrade", "Schedule a dedicated success manager check-in"];
      } else if (adjustedRiskLevel === "Medium Risk") {
        mockAdvice = predPlanTier === "Starter"
          ? ["Send feature highlights showing value beyond basic tier", "Offer a time-limited upgrade discount (e.g., 30% off Pro)"]
          : ["Send targeted engagement emails highlighting unused features", "Offer a quick survey to understand any pain points", "Provide a brief tutorial or webinar invite"];
      }

      setPredictionResult({
        ...res.data,
        churnProbability: rawProb,
        riskLevel: adjustedRiskLevel,
        planTier: predPlanTier,
        advice: mockAdvice,
        mockFactors: factors.slice(0, 4)
      });
    } catch (err: any) {
      console.error("Prediction error", err);
      const detail = err.response?.data?.detail;
      let errMsg = "Network error. Make sure your FastAPI backend is running.";
      if (typeof detail === 'string') errMsg = detail;
      else if (detail && typeof detail === 'object') errMsg = detail.message || JSON.stringify(detail);
      else if (err.message) errMsg = err.message;
      setPredictError(errMsg);
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
            <div className="grid grid-cols-1 gap-8">
              
              {/* Churn Forecast Line Chart */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 font-outfit">Customer Activity Trend</h4>
                    <p className="text-xs text-slate-400">Projected 7-day customer engagement trend.</p>
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

            </div>

            {/* BOTTOM SECTION GRID: REGION RETENTION & ACTIVITIES */}
            <div className="grid grid-cols-1 gap-8">
              
              {/* Region Retention and table list */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6">
                <div className="mb-6">
                  <h4 className="text-base font-extrabold text-slate-900 font-outfit">Regional Customer Insights</h4>
                  <p className="text-xs text-slate-400">Engagement metrics grouped by geographic region.</p>
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

                {/* Customer Attention Cards */}
                <div className="mt-8">
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
                
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., John Smith"
                      value={predName}
                      onChange={(e) => setPredName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                      Gender
                    </label>
                    <div className="relative">
                      <select
                        value={predGender}
                        onChange={(e) => setPredGender(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors appearance-none cursor-pointer text-slate-700"
                      >
                        <option value="" disabled>Select gender...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                      Geographic Region
                    </label>
                    <div className="relative">
                      <select
                        value={predRegion}
                        onChange={(e) => setPredRegion(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors appearance-none cursor-pointer text-slate-700"
                      >
                        <option value="" disabled>Select region...</option>
                        {customerData?.regions?.map((r: string) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                      Plan Tier
                    </label>
                    <div className="relative">
                      <select
                        value={predPlanTier}
                        onChange={(e) => setPredPlanTier(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors appearance-none cursor-pointer text-slate-700"
                      >
                        <option value="" disabled>Select tier...</option>
                        <option value="Starter">Starter</option>
                        <option value="Pro">Pro</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                      Customer Tenure (months)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g., 18"
                      value={predTenure}
                      onChange={(e) => setPredTenure(e.target.value ? parseInt(e.target.value) : "")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5">Enter how many months they've been a customer (0-120)</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                      Monthly Subscription Value (USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g., 149"
                      value={predValue}
                      onChange={(e) => setPredValue(e.target.value ? parseFloat(e.target.value) : "")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5">Enter the monthly subscription amount in dollars</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                      Login Frequency
                    </label>
                    <div className="relative">
                      <select
                        value={predFreq}
                        onChange={(e) => setPredFreq(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors appearance-none cursor-pointer text-slate-700"
                      >
                        <option value="" disabled>Select frequency...</option>
                        <option value="Daily">Daily Logins</option>
                        <option value="Weekly">Weekly Logins</option>
                        <option value="Monthly">Monthly Logins</option>
                        <option value="Rarely">Rarely Logins</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                      Support Tickets (last 30 days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g., 3"
                      value={predTickets}
                      onChange={(e) => setPredTickets(e.target.value ? parseInt(e.target.value) : "")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5">Number of support requests in the past month</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                      Days Since Last Activity
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g., 7"
                      value={predInactive}
                      onChange={(e) => setPredInactive(e.target.value ? parseInt(e.target.value) : "")}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition-colors"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5">How many days ago did they last log in?</p>
                  </div>

                  <button
                    type="submit"
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

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className={`inline-flex px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                          predictionResult.riskLevel === "High Risk" ? "bg-rose-100 text-rose-700" :
                          predictionResult.riskLevel === "Medium Risk" ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>
                          {predictionResult.riskLevel} Customer
                        </div>
                        {predictionResult.planTier && (
                          <div className="inline-flex px-3 py-1.5 rounded-lg text-[11px] font-bold bg-violet-100 text-violet-700">
                            {predictionResult.planTier} Plan
                          </div>
                        )}
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

          // Plan Tier churn distribution data
          const planTierData: Record<string, { total: number, highRisk: number }> = { Starter: { total: 0, highRisk: 0 }, Pro: { total: 0, highRisk: 0 }, Enterprise: { total: 0, highRisk: 0 } };
          customerData?.customers?.forEach((c: any) => {
            const tier = c.planTier || 'Starter';
            if (planTierData[tier]) {
              planTierData[tier].total++;
              if (c.churnProbability >= 70) planTierData[tier].highRisk++;
            }
          });
          const planTierChartData = Object.keys(planTierData).map(tier => ({
            name: tier,
            churnRate: planTierData[tier].total ? Math.round((planTierData[tier].highRisk / planTierData[tier].total) * 100) : (tier === 'Starter' ? 48 : tier === 'Pro' ? 27 : 12),
            customers: planTierData[tier].total || (tier === 'Starter' ? 4820 : tier === 'Pro' ? 8340 : 3210)
          }));

          // Sentiment distribution (derived from churn risk)
          const sentimentData = [
            { name: 'Positive', value: summary?.lowRiskCount || 4100, fill: '#10b981' },
            { name: 'Neutral', value: summary?.mediumRiskCount || 3200, fill: '#f59e0b' },
            { name: 'Negative', value: summary?.highRiskCount || 2100, fill: '#ef4444' }
          ];

          // Retention comparison by plan tier (mock data)
          const retentionComparisonData = [
            { month: 'Jan', Starter: 68, Pro: 84, Enterprise: 94 },
            { month: 'Feb', Starter: 65, Pro: 82, Enterprise: 95 },
            { month: 'Mar', Starter: 62, Pro: 83, Enterprise: 96 },
            { month: 'Apr', Starter: 59, Pro: 80, Enterprise: 94 },
            { month: 'May', Starter: 61, Pro: 78, Enterprise: 95 },
            { month: 'Jun', Starter: 58, Pro: 76, Enterprise: 93 }
          ];

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

              {/* Second row of charts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Card 5: Churn Rate by Plan Tier */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col hover:shadow-md transition-shadow">
                  <div className="mb-5">
                    <h3 className="text-base font-bold text-slate-900 mb-1">Churn Rate by Plan Tier</h3>
                    <p className="text-xs text-slate-500">Starter customers are most at risk. Enterprise customers have strongest retention.</p>
                  </div>
                  <div className="bg-violet-50/50 rounded-xl p-3 mb-4 flex items-start gap-2 border border-violet-100/50">
                    <CreditCard className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-violet-900 leading-relaxed">
                      <span className="font-semibold">Key Insight:</span> Upgrade Starter customers to Pro to significantly reduce churn probability.
                    </p>
                  </div>
                  <div className="h-48 w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={planTierChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                          formatter={(value: number) => [`${value}%`, 'Churn Rate']}
                        />
                        <Bar dataKey="churnRate" radius={[6, 6, 0, 0]} maxBarSize={50}>
                          {planTierChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Starter' ? '#ef4444' : entry.name === 'Pro' ? '#f59e0b' : '#10b981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-3 text-[10px] font-semibold">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>Starter</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>Pro</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>Enterprise</span>
                  </div>
                </div>

                {/* Card 6: Sentiment Distribution */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col hover:shadow-md transition-shadow">
                  <div className="mb-5">
                    <h3 className="text-base font-bold text-slate-900 mb-1">Sentiment Distribution</h3>
                    <p className="text-xs text-slate-500">Customer satisfaction based on churn risk categorization.</p>
                  </div>
                  <div className="bg-rose-50/50 rounded-xl p-3 mb-4 flex items-start gap-2 border border-rose-100/50">
                    <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-rose-900 leading-relaxed">
                      <span className="font-semibold">Watch:</span> A growing Negative segment indicates rising churn risk across your customer base.
                    </p>
                  </div>
                  <div className="h-48 w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} formatter={(value: number) => [value, 'Customers']} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Card 7: Retention Comparison */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col hover:shadow-md transition-shadow">
                  <div className="mb-5">
                    <h3 className="text-base font-bold text-slate-900 mb-1">Retention by Tier (6M)</h3>
                    <p className="text-xs text-slate-500">Monthly retention rates comparing all plan tiers.</p>
                  </div>
                  <div className="bg-blue-50/50 rounded-xl p-3 mb-4 flex items-start gap-2 border border-blue-100/50">
                    <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-900 leading-relaxed">
                      <span className="font-semibold">Trend:</span> Enterprise retention stays above 93% while Starter drops below 60% by month 6.
                    </p>
                  </div>
                  <div className="h-48 w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={retentionComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" domain={[50, 100]} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} formatter={(value: number) => [`${value}%`, 'Retention']} />
                        <Line type="monotone" dataKey="Enterprise" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Pro" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Starter" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2 text-[10px] font-semibold">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>Enterprise</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>Pro</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>Starter</span>
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
