import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, MoreHorizontal, UserX, UserCheck, X, Lightbulb, AlertTriangle, MessageSquare, TrendingDown, TrendingUp, BarChart2, Activity, UploadCloud, Download, CheckCircle2, XCircle, AlertCircle, Upload, Info, FileText, ArrowLeft, Loader2, Sparkles, Shield, Tag, UserPlus } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import RetentionActionCenter from '@/components/RetentionActionCenter';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{success: boolean, message: string, errors?: string[], summary?: any, results?: any[]} | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'churn_data' | 'user_feedback' | 'import_xlsx'>(() => {
    return (localStorage.getItem("admin_customers_tab") as any) || 'churn_data';
  });

  useEffect(() => {
    localStorage.setItem("admin_customers_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedCustomer) setSelectedCustomer(null);
        if (isAddDrawerOpen) setIsAddDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCustomer, isAddDrawerOpen]);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const itemsPerPage = 50;

  const [formData, setFormData] = useState({
    id: '', name: '', email: '', phone_number: '', age: '', gender: 'Male', plan_tier: 'Basic', 
    api_calls_90d: '', logins_90d: '', days_since_active: '',
    points_in_wallet: '', avg_transaction_value: '', avg_session_duration: ''
  });
  const [addCustomerStatus, setAddCustomerStatus] = useState<{type: 'error'|'success', msg: string}|null>(null);

  // Retention Action Center modal
  const [retentionModalCustomer, setRetentionModalCustomer] = useState<any | null>(null);

  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Client-side search filter (as a safety net on top of API search)
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone_number && c.phone_number.toLowerCase().includes(q))
      );
    }

    // Risk filter
    if (filterRisk !== 'All') {
      result = result.filter(c => c.churn_risk === filterRisk);
    }

    return result;
  }, [customers, filterRisk, searchTerm]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRisk]);

  useEffect(() => {
    if (activeTab === 'import_xlsx') fetchHistory();
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/analytics/activity-logs');
      const logs = Array.isArray(res.data) ? res.data : (res.data.history || []);
      const formatted = logs
        .filter((log: any) => log.action === 'CSV Import' || log.action === 'XLSX Import')
        .map((log: any) => {
          // Extract count from "Imported X customers"
          const match = log.details?.match(/(\d+)/);
          const count = match ? match[0] : '0';
          const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown Date';
          return { count, date: dateStr };
        });
      setUploadHistory(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  const [nlpInsights, setNlpInsights] = useState<{positive: number, negative: number, neutral: number, total: number, feedbacks: any[]}>({
    positive: 0, negative: 0, neutral: 0, total: 0, feedbacks: []
  });

  useEffect(() => {
    // Fetch aggregated NLP insights from backend instead of processing 35000 rows in the browser
    api.get('/analytics/nlp-insights').then(res => {
      setNlpInsights(res.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Limit to 200 items for instant loading instead of freezing the browser with 35,000 items
      const res = await api.get(`/customers/?limit=200${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`);
      setCustomers(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddCustomerStatus(null);
    try {
      await api.post('/customers/', {
        ...formData,
        age: parseInt(formData.age as string) || 30,
        api_calls_90d: parseInt(formData.api_calls_90d as string) || 0,
        logins_90d: parseInt(formData.logins_90d as string) || 0,
        days_since_active: parseInt(formData.days_since_active as string) || 0,
        points_in_wallet: parseFloat(formData.points_in_wallet as string) || 0,
        avg_transaction_value: parseFloat(formData.avg_transaction_value as string) || 0,
        avg_session_duration: parseFloat(formData.avg_session_duration as string) || 0,
        id: formData.id || `CUST-${Math.floor(Math.random()*10000)}`
      });
      setAddCustomerStatus({type: 'success', msg: 'Customer successfully added!'});
      setTimeout(() => {
        setIsAddDrawerOpen(false);
        setAddCustomerStatus(null);
      }, 1500);
      fetchCustomers();
    } catch (err: any) {
      console.error("Failed to add customer", err);
      setAddCustomerStatus({type: 'error', msg: err.response?.data?.detail || "Failed to add customer"});
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/customers/xlsx/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to download template');
    }
  };

  const handleImportCSV = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!importFile) return;
    setIsImporting(true);
    setUploadStatus(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await api.post('/customers/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus({
        success: true,
        message: `Import successful: ${res.data.count} customers imported and predicted.`,
        summary: res.data.summary,
        results: res.data.results
      });
      fetchCustomers();
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.message) {
        // Structured error from backend: { message, errors[] }
        setUploadStatus({
          success: false,
          message: detail.message,
          errors: detail.errors || []
        });
      } else if (detail && typeof detail === 'string') {
        setUploadStatus({
          success: false,
          message: detail
        });
      } else {
        setUploadStatus({
          success: false,
          message: 'Failed to import file. Please ensure your file is in .csv or .xlsx format and follows the provided template.'
        });
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleRetentionSuccess = () => {
    fetchCustomers(); // Refresh to show updated campaign assignment
  };

  return (
    <>
      <header className="h-16 hidden md:flex items-center justify-between px-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <h1 className="text-lg font-bold tracking-tight text-slate-900">Customer Intelligence</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('import_xlsx')}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95", 
              activeTab === 'import_xlsx' 
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                : "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 text-white"
            )}
          >
            <UploadCloud size={16} /> Import XLSX
          </button>
          <button 
            onClick={() => setIsAddDrawerOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus size={16} /> New Customer
          </button>
        </div>
      </header>

      <div className="p-6 w-full">
        
        {/* Segmented Control Tabs / Back Button */}
        {activeTab !== 'import_xlsx' ? (
          <div className="flex mb-6 w-full max-w-[400px]">
            <div className="flex bg-zinc-100/80 p-1.5 rounded-2xl border border-zinc-200/60 w-full relative">
              <button 
                className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 flex justify-center items-center gap-2 z-10", activeTab === 'churn_data' ? "bg-white text-brand-600 shadow-md shadow-zinc-200/50" : "text-zinc-500 hover:text-zinc-800")}
                onClick={() => setActiveTab('churn_data')}
              >
                <BarChart2 size={16} />
                Risk Workspace
              </button>
              <button 
                className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 flex justify-center items-center gap-2 z-10", activeTab === 'user_feedback' ? "bg-white text-brand-600 shadow-md shadow-zinc-200/50" : "text-zinc-500 hover:text-zinc-800")}
                onClick={() => setActiveTab('user_feedback')}
              >
                <MessageSquare size={16} />
                User Feedback
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <button 
              onClick={() => setActiveTab('churn_data')}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 text-sm font-semibold transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Workspace
            </button>
          </div>
        )}

        {activeTab === 'churn_data' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Risk Workspace</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">Triage and manage customer retention risks</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search name or ID..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-zinc-200/80 rounded-md text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900/20 focus:border-zinc-300 transition-all shadow-sm"
                  />
                </div>
                <select 
                  value={filterRisk} 
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="pl-3 pr-8 py-1.5 bg-white border border-zinc-200/80 rounded-md text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900/20"
                >
                  <option value="All">All Risks</option>
                  <option value="High">High Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="Low">Low Risk</option>
                </select>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/80 rounded-3xl shadow-xl shadow-zinc-200/40 flex flex-col overflow-hidden">
              {loading ? (
            <div className="h-64 flex items-center justify-center">
               <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="text-[10px] font-black text-zinc-500 bg-zinc-50/80 uppercase tracking-widest border-b border-zinc-100">
                  <tr>
                    <th className="px-5 py-2.5">Customer</th>
                    <th className="px-5 py-2.5">Churn Risk</th>
                    <th className="px-5 py-2.5">Retention Campaign</th>
                    <th className="px-5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100/80">
                  {paginatedCustomers.map((c) => (
                    <tr key={c.id} className={cn("hover:bg-white transition-all duration-300 group", c.churn_risk === 'High' ? "bg-rose-50/20" : "")}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border shadow-sm transition-colors", c.churn_risk === 'High' ? "bg-gradient-to-br from-rose-100 to-rose-50 text-rose-700 border-rose-200" : "bg-gradient-to-br from-zinc-50 to-white text-zinc-700 border-zinc-200")}>
                            {c.name?.substring(0,2).toUpperCase() || 'NA'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900 text-sm leading-tight group-hover:text-brand-600 transition-colors">{c.name}</span>
                            <span className="text-[11px] font-medium text-zinc-500 mt-0.5">{c.id}{c.email ? ` • ${c.email}` : ''}{c.phone_number ? ` • ${c.phone_number}` : ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                           <div className={cn("flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider w-fit border", 
                              c.churn_risk === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : c.churn_risk === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                           )}>
                             <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
                               c.churn_risk === 'High' ? 'bg-rose-500' : c.churn_risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                             )}></div>
                             {c.churn_risk}
                           </div>
                          <div className="flex items-center gap-2">
                             <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden shadow-inner">
                                <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", 
                                  c.churn_risk === 'High' ? 'bg-gradient-to-r from-rose-400 to-rose-600' : c.churn_risk === 'Medium' ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                )} style={{ width: `${Math.round((c.churn_probability || 0)*100)}%` }}></div>
                             </div>
                             <span className="text-[10px] font-bold text-zinc-400">{Math.round((c.churn_probability || 0)*100)}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {c.retention_campaign ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200 shadow-sm">
                            <Tag size={12} className="text-brand-500" />
                            {c.retention_campaign}
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <button 
                          onClick={() => setSelectedCustomer(c)}
                          className={cn("inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 active:scale-95 overflow-hidden relative group/btn", 
                            c.churn_risk === 'High' ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/40 border border-rose-400" : "bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 shadow-sm"
                          )}
                        >
                          {c.churn_risk === 'High' ? (
                            <>
                              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out rounded-lg"></div>
                              <AlertTriangle size={14} className="animate-pulse relative z-10"/> 
                              <span className="relative z-10">Mitigate</span>
                            </>
                          ) : (
                            "View Profile"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                        No customers found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="px-5 py-2.5 border-t border-zinc-100 bg-zinc-50/30 flex justify-between items-center text-[11px] text-zinc-500 font-medium">
            <span>Showing {paginatedCustomers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} results</span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 border border-zinc-200 bg-white rounded hover:bg-zinc-50 disabled:opacity-50 shadow-sm transition-colors"
              >
                Prev
              </button>
              <button 
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage * itemsPerPage >= filteredCustomers.length}
                className="px-2.5 py-1 border border-zinc-200 bg-white rounded hover:bg-zinc-50 disabled:opacity-50 shadow-sm transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        </div>
        )}

        {activeTab === 'user_feedback' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-white to-zinc-50 border border-zinc-200/80 rounded-2xl p-6 shadow-xl shadow-zinc-200/30 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <MessageSquare size={80} />
                </div>
                <div className="flex items-center gap-3 text-zinc-500 mb-4 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                    <MessageSquare size={14} className="text-zinc-700" />
                  </div>
                  <h3 className="font-bold text-xs tracking-wide">Total Feedbacks Analyzed</h3>
                </div>
                <div className="text-3xl font-black text-zinc-900 tracking-tight relative z-10">{nlpInsights.total}</div>
                <p className="text-[11px] font-medium text-zinc-500 mt-2 relative z-10">Drawn from actual customer dataset</p>
              </div>
              
              <div className="bg-gradient-to-br from-rose-50 to-white border border-rose-100 rounded-2xl p-6 shadow-xl shadow-rose-100/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <TrendingDown size={80} className="text-rose-600" />
                </div>
                <div className="flex items-center gap-3 text-rose-600 mb-4 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                    <TrendingDown size={14} className="text-rose-600" />
                  </div>
                  <h3 className="font-bold text-xs tracking-wide">Negative Sentiment</h3>
                </div>
                <div className="text-3xl font-black text-rose-700 tracking-tight relative z-10">{nlpInsights.negative}</div>
                <p className="text-[11px] font-bold text-rose-600/70 mt-2 relative z-10">Requires immediate attention</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-6 shadow-xl shadow-emerald-100/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <TrendingUp size={80} className="text-emerald-600" />
                </div>
                <div className="flex items-center gap-3 text-emerald-600 mb-4 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TrendingUp size={14} className="text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-xs tracking-wide">Positive Sentiment</h3>
                </div>
                <div className="text-3xl font-black text-emerald-700 tracking-tight relative z-10">{nlpInsights.positive}</div>
                <p className="text-[11px] font-bold text-emerald-600/70 mt-2 relative z-10">Healthy customer signals</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="px-2 flex justify-between items-end mb-6">
                <div>
                  <h3 className="saas-heading">User Feedback & Sentiment Analysis</h3>
                  <p className="saas-subtext mt-0.5">Direct feedback from users analyzed by ML sentiment model</p>
                </div>
                {nlpInsights.feedbacks.length > 100 && (
                  <span className="bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    Showing top 100 of {nlpInsights.feedbacks.length}
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {nlpInsights.feedbacks.length > 0 ? nlpInsights.feedbacks.slice(0, 100).map((item, idx) => (
                  <div key={idx} className={cn("p-5 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex gap-5 group hover:-translate-y-0.5 relative overflow-hidden", 
                    item.sentiment === 'Negative' ? "border-rose-100" :
                    item.sentiment === 'Positive' ? "border-emerald-100" :
                    "border-zinc-200/80"
                  )}>
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", 
                      item.sentiment === 'Negative' ? "bg-rose-400" :
                      item.sentiment === 'Positive' ? "bg-emerald-400" :
                      "bg-zinc-300"
                    )}></div>
                    <div className={cn("shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border shadow-sm", 
                      item.sentiment === 'Negative' ? "bg-rose-50 text-rose-700 border-rose-100" :
                      item.sentiment === 'Positive' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      "bg-zinc-50 text-zinc-700 border-zinc-200"
                    )}>
                      {item.customer.name?.substring(0,2).toUpperCase() || 'NA'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 text-sm">{item.customer.name}</span>
                          <span className="text-[10px] font-medium text-zinc-400">{item.customer.id} • {item.customer.plan_tier}</span>
                        </div>
                        <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm border",
                          item.sentiment === 'Negative' ? "bg-rose-50 text-rose-700 border-rose-100" :
                          item.sentiment === 'Positive' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          "bg-zinc-50 text-zinc-700 border-zinc-200"
                        )}>
                          {item.sentiment}
                        </span>
                      </div>
                      <p className="text-[13px] text-zinc-700 font-medium leading-relaxed mt-2.5">
                        {item.text}
                      </p>
                      {item.sentiment === 'Negative' && item.customer.churn_risk === 'High' && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-100 inline-flex">
                          <AlertTriangle size={14} /> High Churn Risk Correlation detected.
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center text-zinc-500">
                    No relevant feedback data found to run NLP processing.
                  </div>
                )}
              </div>
            </div>
          </div>

        )}

        {activeTab === 'import_xlsx' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            
            {/* Left Column: Upload Dropzone & History (or Error State) */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Conditional Upload or Error State */}
              {uploadStatus?.success === false ? (
                <div className="space-y-6 animate-fadeIn">
                  {/* Error Alert Banner */}
                  <div className="bg-rose-50 border border-rose-200 rounded-md p-5 flex items-start gap-4">
                    <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-[13px] font-semibold text-zinc-900">
                        Upload Failed
                      </h3>
                      <p className="text-xs text-zinc-600 mt-1">{uploadStatus.message}</p>
                      {importFile && (
                        <div className="mt-3 bg-white px-3 py-2 rounded-lg border border-zinc-100 text-xs font-semibold text-zinc-700 flex items-center gap-2 w-fit">
                          <span className="text-zinc-500">File:</span> {importFile.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Specific Validation Errors */}
                  {uploadStatus.errors && uploadStatus.errors.length > 0 && (
                    <div className="bg-white border border-zinc-200/80 shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-md p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                        <h4 className="text-[13px] font-semibold text-zinc-900">
                          {uploadStatus.errors.length} Issue{uploadStatus.errors.length > 1 ? "s" : ""} Found
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-500 mb-4">
                        Here's what needs to be fixed before you can upload:
                      </p>

                      <div className="space-y-2">
                        {uploadStatus.errors.map((err, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-rose-50/60 border border-rose-100 rounded-md px-4 py-3">
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <span className="text-xs font-medium text-rose-700 break-words break-all">{err}</span>
                          </div>
                        ))}
                      </div>

                      {uploadStatus.errors.length >= 15 && (
                        <p className="text-[10px] text-zinc-400 mt-3 italic">
                          Showing the first 15 issues. Fix these first, then re-upload to see if there are more.
                        </p>
                      )}
                    </div>
                  )}


                  {/* Error Action Buttons */}
                  <div>
                    <button 
                      onClick={() => { setImportFile(null); setUploadStatus(null); }}
                      className="px-8 h-9 text-[13px] bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-md transition-colors"
                    >
                      Try Another File
                    </button>
                  </div>
                </div>
              ) : !uploadStatus?.success && (
                <form onSubmit={handleImportCSV} className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:from-indigo-50 hover:to-purple-50 rounded-2xl p-10 flex flex-col items-center justify-center min-h-[350px] transition-all duration-300 cursor-pointer relative group animate-fadeIn shadow-sm hover:shadow-md">
                  <input
                    type="file"
                    accept=".csv, .xlsx"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-20 h-20 bg-white shadow-lg shadow-indigo-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 relative">
                    <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-20"></div>
                    <Upload className="w-10 h-10 text-indigo-500 relative z-10" />
                  </div>
                  <h3 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-purple-900 mb-2">Drop your XLSX/CSV file here</h3>
                  <p className="text-sm font-medium text-indigo-400 mb-8">or click to browse from your computer</p>
                  
                  {importFile ? (
                    <div className="text-center z-20 relative bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl border border-indigo-100 shadow-sm">
                      <p className="text-sm font-bold text-indigo-900 mb-4">{importFile.name}</p>
                      <button
                        type="submit"
                        disabled={isImporting}
                        className="w-full px-6 py-2.5 text-[13px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-zinc-300 disabled:to-zinc-400 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 z-30 relative flex items-center justify-center gap-2"
                      >
                        {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {isImporting ? "Analyzing..." : "Analyze Customers"}
                      </button>
                    </div>
                  ) : (
                    <div className="px-6 py-2.5 text-[13px] bg-white text-indigo-700 font-bold rounded-xl border border-indigo-100 shadow-sm relative z-20 pointer-events-none group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                      Select File
                    </div>
                  )}
                </form>
              )}

              {/* ── PREDICTION RESULTS TABLE (shown after successful upload) ── */}
              {uploadStatus?.success && uploadStatus.results && uploadStatus.results.length > 0 && (
                <div className="space-y-6 animate-fadeIn mt-6">

                  {/* Avg Churn Probability Banner */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-zinc-900 flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-500">Average Churn Probability</p>
                      <p className="text-xl font-bold text-zinc-900 ">{uploadStatus.summary?.avg_churn_probability ?? 0}%</p>
                    </div>
                    <div className="ml-auto">
                      <button
                        onClick={() => { setImportFile(null); setUploadStatus(null); }}
                        className="px-3 py-1.5 text-[12px] bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-md transition-colors"
                      >
                        Upload Another
                      </button>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="bg-white border border-zinc-200/80 shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-md overflow-hidden">
                    <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                      <h4 className="text-[13px] font-semibold text-zinc-900">Prediction Results</h4>
                      <span className="text-xs text-zinc-400 font-medium">{uploadStatus.results.length} customer(s)</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-50 border-b border-zinc-100">
                          <tr>
                            <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">#</th>
                            <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">Customer</th>
                            <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">Age</th>
                            <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">Region</th>
                            <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">Plan</th>
                            <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">Churn Probability</th>
                            <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wide">Risk Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {uploadStatus.results.map((row, idx) => {
                            const isHigh   = row.risk_level === 'High Risk';
                            const isMedium = row.risk_level === 'Medium Risk';
                            return (
                              <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-5 py-3.5 text-xs text-zinc-400 font-medium">{idx + 1}</td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center text-[10px] font-black shrink-0">
                                      {row.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                                    </div>
                                    <span className="font-semibold text-zinc-800 text-xs">{row.name}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-xs text-zinc-600">{row.age ?? '-'}</td>
                                <td className="px-5 py-3.5 text-xs text-zinc-600">{row.region}</td>
                                <td className="px-5 py-3.5 text-xs text-zinc-600">{row.plan_tier}</td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${row.churn_probability ?? 0}%` }}
                                      />
                                    </div>
                                    <span className={`text-xs font-bold ${
                                      isHigh ? 'text-rose-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'
                                    }`}>
                                      {row.churn_probability !== null ? `${row.churn_probability}%` : '-'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                    isHigh   ? 'bg-rose-100 text-rose-700' :
                                    isMedium ? 'bg-amber-100 text-amber-700' :
                                               'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {row.risk_level}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* Upload History */}
              <div className="bg-white border border-zinc-200/80 shadow-sm rounded-2xl p-7 mt-6">
                <h4 className="text-[15px] font-black text-zinc-900 mb-5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FileText size={14} />
                  </div>
                  Upload History
                </h4>
                {uploadHistory.length > 0 ? (
                  <div className="space-y-3">
                    {uploadHistory.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-zinc-50 hover:bg-white p-4 rounded-xl border border-zinc-100 hover:border-indigo-100 hover:shadow-sm transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-800">{item.count} customers imported</p>
                            <p className="text-[11px] font-medium text-zinc-400 mt-0.5">{item.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">Completed</span>
                          <Download className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-zinc-50/50 rounded-xl border border-zinc-100 border-dashed">
                    <p className="text-sm font-medium text-zinc-400">No upload history yet.</p>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Guides */}
            <div className="space-y-6">
              
              {/* How to Use Card */}
              <div className="bg-white border border-zinc-200/80 shadow-sm rounded-2xl p-7">
                <h4 className="text-[15px] font-black text-zinc-900 mb-6 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Info size={14} />
                  </div>
                  How to Use
                </h4>
                
                <div className="space-y-6 relative ml-2">
                  {/* Vertical Line */}
                  <div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-gradient-to-b from-indigo-200 to-emerald-200 z-0"></div>
                  
                  <div className="flex gap-5 relative z-10 group">
                    <div className="w-6 h-6 rounded-full bg-white text-indigo-600 flex items-center justify-center font-black text-[11px] shrink-0 shadow-md shadow-indigo-100 border-2 border-indigo-200 group-hover:scale-110 group-hover:border-indigo-400 transition-all">
                      1
                    </div>
                    <div className="pt-0.5">
                      <h5 className="text-[13px] font-bold text-zinc-800 group-hover:text-indigo-700 transition-colors">Prepare your XLSX file</h5>
                      <p className="text-[11px] font-medium text-zinc-500 mt-1 leading-relaxed">Download the template and fill in your customer data properly.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-5 relative z-10 group">
                    <div className="w-6 h-6 rounded-full bg-white text-purple-600 flex items-center justify-center font-black text-[11px] shrink-0 shadow-md shadow-purple-100 border-2 border-purple-200 group-hover:scale-110 group-hover:border-purple-400 transition-all">
                      2
                    </div>
                    <div className="pt-0.5">
                      <h5 className="text-[13px] font-bold text-zinc-800 group-hover:text-purple-700 transition-colors">Upload your file</h5>
                      <p className="text-[11px] font-medium text-zinc-500 mt-1 leading-relaxed">Drag and drop or click to select your filled XLSX/CSV file.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-5 relative z-10 group">
                    <div className="w-6 h-6 rounded-full bg-white text-emerald-600 flex items-center justify-center font-black text-[11px] shrink-0 shadow-md shadow-emerald-100 border-2 border-emerald-200 group-hover:scale-110 group-hover:border-emerald-400 transition-all">
                      3
                    </div>
                    <div className="pt-0.5">
                      <h5 className="text-[13px] font-bold text-zinc-800 group-hover:text-emerald-700 transition-colors">Get predictions</h5>
                      <p className="text-[11px] font-medium text-zinc-500 mt-1 leading-relaxed">View results instantly with AI-powered churn probability analysis.</p>
                    </div>
                  </div>
                </div>

                <button onClick={handleDownloadTemplate} className="block text-center w-full mt-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-md shadow-emerald-200 transition-all active:scale-95 text-[13px] flex items-center justify-center gap-2">
                  <Download size={16} />
                  Download Template
                </button>
              </div>


            </div>

          </div>
        
        )}

      </div>

      {/* Add Customer Drawer */}
      {isAddDrawerOpen && (
        <div 
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex justify-end animate-fade-in"
          onClick={() => setIsAddDrawerOpen(false)}
        >
          <div 
            className="w-[450px] bg-white h-full shadow-[0_0_40px_rgba(0,0,0,0.1)] animate-slide-in-right flex flex-col border-l border-zinc-200/80 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 bg-white relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600">
                  <UserPlus size={20} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Add New Customer</h2>
              </div>
              <button onClick={() => setIsAddDrawerOpen(false)} className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all border border-transparent">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="flex flex-col flex-1 overflow-hidden relative z-10">
              <div className="p-8 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                {addCustomerStatus && (
                  <div className={`p-4 text-sm font-semibold rounded-xl border flex items-center gap-2 shadow-sm ${addCustomerStatus.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {addCustomerStatus.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    {addCustomerStatus.msg}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-zinc-700">Customer ID</label>
                  <input required type="text" placeholder="e.g. CUST-123" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all hover:bg-white placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-zinc-700">Full Name</label>
                  <input required type="text" placeholder="Jane Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all hover:bg-white placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-zinc-700">Email Address</label>
                  <input type="email" placeholder="jane.doe@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all hover:bg-white placeholder:text-zinc-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-zinc-700">Phone Number</label>
                  <input type="text" placeholder="08123456789" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all hover:bg-white placeholder:text-zinc-400" />
                </div>
                
                <div className="pt-2 pb-1">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-100 to-transparent"></div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-700">Plan Tier</label>
                    <select value={formData.plan_tier} onChange={e => setFormData({...formData, plan_tier: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all hover:bg-white cursor-pointer appearance-none">
                      <option>Basic</option>
                      <option>Pro</option>
                      <option>Enterprise</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-700">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all hover:bg-white cursor-pointer appearance-none">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-700">Age</label>
                    <input type="number" required placeholder="30" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all hover:bg-white placeholder:text-zinc-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-700">Days Since Active</label>
                    <input type="number" min="0" required placeholder="0" value={formData.days_since_active} onChange={e => setFormData({...formData, days_since_active: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all hover:bg-white placeholder:text-zinc-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-700">Logins (90 Days)</label>
                    <input type="number" min="0" required placeholder="0" value={formData.logins_90d} onChange={e => setFormData({...formData, logins_90d: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all hover:bg-white placeholder:text-zinc-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-700">API Calls (90 Days)</label>
                    <input type="number" min="0" required placeholder="0" value={formData.api_calls_90d} onChange={e => setFormData({...formData, api_calls_90d: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all hover:bg-white placeholder:text-zinc-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-700">Points in Wallet</label>
                    <input type="number" min="0" step="any" required placeholder="0" value={formData.points_in_wallet} onChange={e => setFormData({...formData, points_in_wallet: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all hover:bg-white placeholder:text-zinc-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-700">Avg Transaction</label>
                    <input type="number" min="0" step="any" required placeholder="0" value={formData.avg_transaction_value} onChange={e => setFormData({...formData, avg_transaction_value: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all hover:bg-white placeholder:text-zinc-400" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[13px] font-bold text-zinc-700">Avg Session (Mins)</label>
                    <input type="number" min="0" step="any" required placeholder="0" value={formData.avg_session_duration} onChange={e => setFormData({...formData, avg_session_duration: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all hover:bg-white placeholder:text-zinc-400" />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 flex justify-end gap-3 bg-white">
                <button type="button" onClick={() => setIsAddDrawerOpen(false)} className="px-5 py-2.5 text-[13px] font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl border border-transparent hover:border-zinc-200 transition-all">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 text-[13px] font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-sm flex items-center gap-2">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Intelligence Drawer (Slide-over) */}
      {selectedCustomer && (
        <div 
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex justify-end animate-fade-in"
          onClick={() => setSelectedCustomer(null)}
        >
          <div 
            className="w-[500px] bg-white h-full shadow-[0_0_40px_rgba(0,0,0,0.1)] animate-slide-in-right flex flex-col border-l border-zinc-200/80 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Colorful Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute top-40 left-0 w-48 h-48 bg-purple-100/50 rounded-full blur-3xl -ml-20 pointer-events-none"></div>

            <div className="flex items-center justify-between px-7 py-5 border-b border-indigo-50/80 bg-white/60 backdrop-blur-xl sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm shadow-indigo-200"></div>
                <h2 className="text-base font-black text-zinc-900 tracking-tight">Customer Intelligence Profile</h2>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto z-10 relative">
              <div className="p-7 border-b border-zinc-100 bg-gradient-to-b from-indigo-50/40 to-white relative overflow-hidden">
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center font-bold text-lg shrink-0">
                    {selectedCustomer.name?.substring(0,2).toUpperCase() || 'NA'}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-lg font-bold text-zinc-900 leading-tight">{selectedCustomer.name}</h1>
                    <div className="text-xs font-medium text-zinc-500 mt-0.5">
                      {selectedCustomer.id} • {selectedCustomer.plan_tier} Plan
                    </div>
                    <div className="text-[11px] font-medium text-zinc-400 mt-1 flex items-center gap-1.5">
                      <span>{selectedCustomer.email || 'No email'}</span>
                      <span className="text-zinc-300">•</span>
                      <span>{selectedCustomer.phone_number || 'No phone'}</span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-600">{selectedCustomer.age} Years</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-600">
                        {selectedCustomer.gender === 'M' ? 'Male' : selectedCustomer.gender === 'F' ? 'Female' : selectedCustomer.gender}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Health Score</div>
                    <div className={cn("text-2xl font-black tracking-tight", 
                      selectedCustomer.churn_risk === 'High' ? "text-rose-600" :
                      selectedCustomer.churn_risk === 'Medium' ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {100 - Math.round((selectedCustomer.churn_probability || 0)*100)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-7 space-y-7">
                
                {/* Risk Section */}
                <div className={cn("p-5 rounded-2xl border relative overflow-hidden shadow-sm", selectedCustomer.churn_risk === 'High' ? "bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200" : "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100")}>
                  {selectedCustomer.churn_risk === 'High' && <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200/40 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none"></div>}
                  
                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shadow-sm", selectedCustomer.churn_risk === 'High' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600")}>
                      <AlertTriangle size={14} />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-800">Risk Assessment</h3>
                  </div>
                  <div className="text-[13px] font-medium text-zinc-700 leading-relaxed mb-4 relative z-10">
                    {selectedCustomer.churn_risk === 'High' 
                      ? "Critical churn probability detected based on recent behavioral drops and negative sentiment."
                      : "Customer exhibits normal usage patterns and stable sentiment."}
                  </div>
                  
                  {selectedCustomer.churn_risk === 'High' && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rose-100 p-4 shadow-sm relative z-10">
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Sparkles size={12} className="text-indigo-500 animate-pulse"/> AI Recommended Action</h4>
                      <p className="text-[12px] font-semibold text-zinc-800 leading-snug">
                        Open the Retention Action Center to assign an AI-recommended campaign strategy for this customer.
                      </p>
                    </div>
                  )}
                </div>

                {/* Retention Campaign Card */}
                <div>
                  <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-1 h-3 rounded-full bg-indigo-400"></div> Retention Campaign</h3>
                  <div className="bg-white rounded-2xl border border-zinc-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 hover:border-indigo-200 hover:shadow-md transition-all">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Campaign Name</span>
                        <span className="text-[13px] font-black text-zinc-900 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100">
                          {selectedCustomer.retention_campaign || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Assigned Date</span>
                        <span className="text-[12px] font-bold text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100">
                          {selectedCustomer.campaign_assigned_date 
                            ? new Date(selectedCustomer.campaign_assigned_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                            : '—'
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status</span>
                        {selectedCustomer.retention_campaign ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                            <CheckCircle2 size={12} /> Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-500 border border-zinc-200 shadow-sm">
                            Not Assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Behavioral Metrics */}
                <div>
                  <h3 className="text-[11px] font-black text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-1 h-3 rounded-full bg-purple-400"></div> Behavioral Telemetry (90d)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-white to-zinc-50 rounded-2xl border border-zinc-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 flex flex-col items-center justify-center text-center hover:border-purple-200 transition-colors">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">API Calls</div>
                      <div className="text-2xl font-black text-purple-900">{selectedCustomer.api_calls_90d?.toLocaleString() || 0}</div>
                    </div>
                    <div className="bg-gradient-to-br from-white to-zinc-50 rounded-2xl border border-zinc-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 flex flex-col items-center justify-center text-center hover:border-indigo-200 transition-colors">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Session Logins</div>
                      <div className="text-2xl font-black text-indigo-900">{selectedCustomer.logins_90d?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <h3 className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-1 h-3 rounded-full bg-rose-400"></div> Recent Feedback</h3>
                  {selectedCustomer.feedback ? (
                    <div className="bg-gradient-to-r from-rose-50/50 to-transparent border-l-4 border-rose-400 rounded-r-2xl p-5 text-[13px] font-medium text-zinc-700 italic shadow-sm relative">
                      <span className="text-3xl text-rose-200 absolute top-2 left-2 font-serif opacity-50">"</span>
                      <span className="relative z-10">{selectedCustomer.feedback}</span>
                    </div>
                  ) : (
                    <div className="bg-zinc-50 border border-zinc-200 border-dashed rounded-2xl p-5 text-[13px] font-medium text-zinc-500 text-center">
                      No recorded feedback.
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Mitigate Customer Button */}
            <div className="p-5 border-t border-indigo-50 bg-white/80 backdrop-blur-xl relative z-20">
              <button 
                onClick={() => {
                  setRetentionModalCustomer(selectedCustomer);
                }}
                className="w-full px-4 py-3.5 text-[13px] font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Shield size={16} /> Mitigate Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retention Action Center Modal */}
      {retentionModalCustomer && (
        <RetentionActionCenter
          customer={retentionModalCustomer}
          onClose={() => setRetentionModalCustomer(null)}
          onSuccess={() => {
            handleRetentionSuccess();
            // Refresh the selected customer data
            if (selectedCustomer && selectedCustomer.id === retentionModalCustomer.id) {
              // Re-fetch will update the table, drawer will close naturally
            }
          }}
        />
      )}

      </>
  );
}
