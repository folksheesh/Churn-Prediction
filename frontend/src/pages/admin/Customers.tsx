import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, MoreHorizontal, UserX, UserCheck, X, Lightbulb, AlertTriangle, MessageSquare, TrendingDown, TrendingUp, BarChart2, Activity, UploadCloud, Download, CheckCircle2, XCircle, AlertCircle, Upload, Info, FileText, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

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
  const [activeTab, setActiveTab] = useState<'churn_data' | 'user_feedback' | 'import_xlsx'>('churn_data');
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const itemsPerPage = 50;

  const [formData, setFormData] = useState({
    id: '', name: '', age: '', gender: 'Male', plan_tier: 'Starter', 
    api_calls_90d: 0, logins_90d: 0, days_since_active: 0,
    points_in_wallet: 0, avg_transaction_value: 0, avg_session_duration: 0
  });

  const filteredCustomers = useMemo(() => {
    if (filterRisk === 'All') return customers;
    return customers.filter(c => c.churn_risk === filterRisk);
  }, [customers, filterRisk]);

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
    try {
      await api.post('/customers/', {
        ...formData,
        age: parseInt(formData.age as string) || 30,
        id: formData.id || `CUST-${Math.floor(Math.random()*10000)}`
      });
      setIsAddDrawerOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error("Failed to add customer", err);
      alert("Failed to add customer. Check console.");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/customers/csv/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers_template.csv');
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

  return (
    <>
      <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-200/60 bg-white sticky top-0 z-10 shrink-0">
        <h1 className="text-sm font-semibold tracking-tight text-zinc-900">Customer Intelligence</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('import_xlsx')}
            className={cn("flex items-center gap-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-[0.97] shadow-sm hover:shadow", activeTab === 'import_xlsx' && "bg-zinc-100")}
          >
            <UploadCloud size={14} /> Import XLSX
          </button>
          <button 
            onClick={() => setIsAddDrawerOpen(true)}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-[0.97] shadow-sm hover:shadow"
          >
            <Plus size={14} /> New Customer
          </button>
        </div>
      </header>

      <div className="p-6 max-w-[1600px] mx-auto w-full">
        
        {/* Segmented Control Tabs / Back Button */}
        {activeTab !== 'import_xlsx' ? (
          <div className="flex mb-6 w-full max-w-sm">
            <div className="flex bg-zinc-100/80 p-1 rounded-lg border border-zinc-200/50 w-full">
              <button 
                className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex justify-center items-center gap-1.5", activeTab === 'churn_data' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
                onClick={() => setActiveTab('churn_data')}
              >
                <BarChart2 size={14} />
                Risk Workspace
              </button>
              <button 
                className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex justify-center items-center gap-1.5", activeTab === 'user_feedback' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
                onClick={() => setActiveTab('user_feedback')}
              >
                <MessageSquare size={14} />
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

            <div className="bg-white border border-zinc-200/80 rounded-md shadow-[0_2px_8px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden">
              {loading ? (
            <div className="h-64 flex items-center justify-center">
               <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="text-[10px] font-semibold text-zinc-500 bg-zinc-50/50 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="px-5 py-2.5">Customer</th>
                    <th className="px-5 py-2.5">Plan Tier</th>
                    <th className="px-5 py-2.5">Recent Feedback</th>
                    <th className="px-5 py-2.5">Churn Risk</th>
                    <th className="px-5 py-2.5">Financials</th>
                    <th className="px-5 py-2.5">Activity</th>
                    <th className="px-5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100/80">
                  {paginatedCustomers.map((c) => (
                    <tr key={c.id} className={cn("hover:bg-zinc-50/50 transition-colors group", c.churn_risk === 'High' ? "bg-rose-50/10" : "")}>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-zinc-100/80 text-zinc-600 flex items-center justify-center font-bold text-[10px] border border-zinc-200/60 shadow-sm">
                            {c.name?.substring(0,2).toUpperCase() || 'NA'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-900 text-[13px] leading-tight">{c.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{c.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="text-[11px] font-medium text-zinc-700 bg-zinc-100/80 px-2 py-0.5 rounded-sm border border-zinc-200/50">{c.plan_tier || 'Unknown'}</span>
                      </td>
                      <td className="px-5 py-2.5">
                        {c.feedback ? (
                           <div className="flex flex-col">
                             <span className="text-[11px] text-zinc-600 truncate max-w-[180px]">{c.feedback}</span>
                           </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">No feedback provided</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-1.5 h-1.5 rounded-full", 
                              c.churn_risk === 'High' ? 'bg-rose-500' : c.churn_risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                            )}></div>
                            <span className={cn("font-semibold text-[11px]", 
                              c.churn_risk === 'High' ? 'text-rose-600' : c.churn_risk === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                            )}>{c.churn_risk}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                             <div className="w-12 h-1 bg-zinc-100 rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full", 
                                  c.churn_risk === 'High' ? 'bg-rose-500' : c.churn_risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                )} style={{ width: `${Math.round((c.churn_probability || 0)*100)}%` }}></div>
                             </div>
                             <span className="text-[10px] font-mono text-zinc-400">{Math.round((c.churn_probability || 0)*100)}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-zinc-700">${c.avg_transaction_value || 0}</span>
                          <span className="text-[10px] text-zinc-500">{c.points_in_wallet || 0} pts</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-zinc-500 text-xs">
                        {c.days_since_active ? `${c.days_since_active} days ago` : 'Unknown'}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <button 
                          onClick={() => setSelectedCustomer(c)}
                          className={cn("inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold shadow-sm transition-all active:scale-[0.97]", c.churn_risk === 'High' ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 hover:shadow" : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200")}
                        >
                          {c.churn_risk === 'High' ? <><AlertTriangle size={12} className="animate-pulse"/> Mitigate</> : "View Profile"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
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
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 text-zinc-500 mb-4">
                  <MessageSquare size={18} />
                  <h3 className="font-medium text-sm">Total Feedbacks Analyzed</h3>
                </div>
                <div className="text-4xl font-bold text-zinc-900">{nlpInsights.total}</div>
                <p className="text-xs text-zinc-500 mt-2">Drawn from actual customer dataset</p>
              </div>
              
              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 text-rose-600 mb-4">
                  <TrendingDown size={18} />
                  <h3 className="font-medium text-sm">Negative Sentiment</h3>
                </div>
                <div className="text-4xl font-bold text-rose-700">{nlpInsights.negative}</div>
                <p className="text-xs text-rose-600/70 mt-2">Requires immediate attention</p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 text-emerald-600 mb-4">
                  <TrendingUp size={18} />
                  <h3 className="font-medium text-sm">Positive Sentiment</h3>
                </div>
                <div className="text-4xl font-bold text-emerald-700">{nlpInsights.positive}</div>
                <p className="text-xs text-emerald-600/70 mt-2">Healthy customer signals</p>
              </div>
            </div>

            <div className="saas-card overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                <div>
                  <h3 className="saas-heading">User Feedback & Sentiment Analysis</h3>
                  <p className="saas-subtext mt-0.5">Direct feedback from users analyzed by ML sentiment model</p>
                </div>
                {nlpInsights.feedbacks.length > 100 && (
                  <span className="saas-badge bg-amber-50 text-amber-700 border-amber-200">
                    Showing top 100 of {nlpInsights.feedbacks.length}
                  </span>
                )}
              </div>
              <div className="divide-y divide-zinc-100">
                {nlpInsights.feedbacks.length > 0 ? nlpInsights.feedbacks.slice(0, 100).map((item, idx) => (
                  <div key={idx} className="p-6 hover:bg-zinc-50/50 transition-colors flex gap-6">
                    <div className="shrink-0 w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-600 text-sm">
                      {item.customer.name?.substring(0,2).toUpperCase() || 'NA'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-zinc-900">{item.customer.name}</div>
                          <div className="text-xs text-zinc-500">{item.customer.id} • {item.customer.plan_tier}</div>
                        </div>
                        <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
                          item.sentiment === 'Negative' ? "bg-rose-100 text-rose-700" :
                          item.sentiment === 'Positive' ? "bg-emerald-100 text-emerald-700" :
                          "bg-zinc-100 text-zinc-700"
                        )}>
                          {item.sentiment}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-700 leading-relaxed bg-zinc-50 p-4 rounded-lg border border-zinc-100 italic">
                        "{item.text}"
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
                            <span className="text-xs font-medium text-rose-700">{err}</span>
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
                <form onSubmit={handleImportCSV} className="bg-zinc-50 border-2 border-dashed border-zinc-300 hover:border-zinc-400 hover:bg-white rounded-md p-8 flex flex-col items-center justify-center min-h-[300px] transition-all cursor-pointer relative group animate-fadeIn">
                  <input
                    type="file"
                    accept=".csv, .xlsx"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-zinc-500" />
                  </div>
                  <h3 className="text-lg font-extrabold text-zinc-900 mb-2">Drop your XLSX/CSV file here</h3>
                  <p className="text-sm text-zinc-500 mb-6">or click to select a file</p>
                  
                  {importFile ? (
                    <div className="text-center z-20 relative">
                      <p className="text-sm font-bold text-zinc-800">{importFile.name}</p>
                      <button
                        type="submit"
                        disabled={isImporting}
                        className="mt-4 px-4 py-1.5 text-[13px] bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-bold rounded-md transition-colors shadow-sm cursor-pointer z-30 relative"
                      >
                        {isImporting ? "Analyzing..." : "Analyze"}
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 py-1.5 text-[13px] bg-zinc-900 text-white font-bold rounded-md relative z-20 pointer-events-none">
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
              <div className="bg-white border border-zinc-200/80 shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-md p-6 mt-6">
                <h4 className="text-[13px] font-semibold text-zinc-900 mb-4">Upload History</h4>
                {uploadHistory.length > 0 ? (
                  <div className="space-y-3">
                    {uploadHistory.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-zinc-50 hover:bg-zinc-100 p-4 rounded-md border border-zinc-100 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-zinc-400 group-hover:text-zinc-500 transition-colors" />
                          <div>
                            <p className="text-sm font-bold text-zinc-800">{item.count} customers</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{item.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-emerald-600">Completed</span>
                          <Download className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 italic">No upload history yet.</p>
                )}
              </div>

            </div>

            {/* Right Column: Guides */}
            <div className="space-y-6">
              
              {/* How to Use Card */}
              <div className="bg-white border border-zinc-200/80 shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-md p-6">
                <h4 className="text-base font-extrabold text-zinc-900  mb-6">How to Use</h4>
                
                <div className="space-y-6 relative">
                  {/* Vertical Line */}
                  <div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-zinc-100 z-0"></div>
                  
                  <div className="flex gap-4 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm shadow-zinc-200 border-2 border-white">
                      1
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-zinc-800">Prepare your XLSX file</h5>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Download the template and fill in customer data</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm shadow-zinc-200 border-2 border-white">
                      2
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-zinc-800">Upload your file</h5>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Drag and drop or click to select your XLSX/CSV file</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm shadow-zinc-200 border-2 border-white">
                      3
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-zinc-800">Get predictions</h5>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">View results with churn probability analysis</p>
                    </div>
                  </div>
                </div>

                <a href="/template_churn.xlsx" download className="block text-center w-full mt-8 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold rounded-md border border-zinc-200 transition-colors text-xs">
                  Download Template
                </a>
              </div>


            </div>

          </div>
        
        )}

      </div>

      {/* Add Customer Drawer */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 bg-zinc-950/30 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
          <div className="w-[400px] bg-white h-full shadow-2xl animate-slide-in-right flex flex-col border-l border-zinc-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="saas-heading">Add New Customer</h2>
              <button onClick={() => setIsAddDrawerOpen(false)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Customer ID</label>
                <input required type="text" placeholder="e.g. CUST-123" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Full Name</label>
                <input required type="text" placeholder="Jane Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Plan Tier</label>
                  <select value={formData.plan_tier} onChange={e => setFormData({...formData, plan_tier: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400">
                    <option>Starter</option>
                    <option>Pro</option>
                    <option>Enterprise</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Gender</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Age</label>
                  <input type="number" required placeholder="30" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Days Since Active</label>
                  <input type="number" required placeholder="0" value={formData.days_since_active} onChange={e => setFormData({...formData, days_since_active: parseInt(e.target.value) || 0})} className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Logins (90 Days)</label>
                  <input type="number" required placeholder="0" value={formData.logins_90d} onChange={e => setFormData({...formData, logins_90d: parseInt(e.target.value) || 0})} className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">API Calls (90 Days)</label>
                  <input type="number" required placeholder="0" value={formData.api_calls_90d} onChange={e => setFormData({...formData, api_calls_90d: parseInt(e.target.value) || 0})} className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Points in Wallet</label>
                  <input type="number" required placeholder="0" value={formData.points_in_wallet} onChange={e => setFormData({...formData, points_in_wallet: parseFloat(e.target.value) || 0})} className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Avg Transaction Value</label>
                  <input type="number" required placeholder="0" value={formData.avg_transaction_value} onChange={e => setFormData({...formData, avg_transaction_value: parseFloat(e.target.value) || 0})} className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Avg Session (Mins)</label>
                  <input type="number" required placeholder="0" value={formData.avg_session_duration} onChange={e => setFormData({...formData, avg_session_duration: parseFloat(e.target.value) || 0})} className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400" />
                </div>
              </div>
            </form>

            <div className="p-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50">
              <button type="button" onClick={() => setIsAddDrawerOpen(false)} className="px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded border border-zinc-200 transition-colors shadow-sm">
                Cancel
              </button>
              <button onClick={handleAddCustomer} className="px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded transition-colors shadow-sm">
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Intelligence Drawer (Slide-over) */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-zinc-950/30 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
          <div className="w-[500px] bg-white h-full shadow-2xl animate-slide-in-right flex flex-col border-l border-zinc-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <h2 className="saas-heading">Customer Intelligence Profile</h2>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 border-b border-zinc-100 bg-zinc-50/30">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-600 text-lg">
                    {selectedCustomer.name?.substring(0,2).toUpperCase() || 'NA'}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-lg font-bold text-zinc-900 leading-tight">{selectedCustomer.name}</h1>
                    <div className="text-xs font-medium text-zinc-500 mt-0.5">{selectedCustomer.id} • {selectedCustomer.plan_tier} Plan</div>
                    <div className="mt-3 flex gap-2">
                      <span className="saas-badge bg-white text-zinc-600">{selectedCustomer.age} Yrs</span>
                      <span className="saas-badge bg-white text-zinc-600">{selectedCustomer.gender}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Health Score</div>
                    <div className={cn("text-2xl font-black tracking-tight", 
                      selectedCustomer.churn_risk === 'High' ? "text-rose-600" :
                      selectedCustomer.churn_risk === 'Medium' ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {100 - Math.round((selectedCustomer.churn_probability || 0)*100)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Risk Section */}
                <div className={cn("p-4 rounded-lg border", selectedCustomer.churn_risk === 'High' ? "bg-rose-50/50 border-rose-200/50" : "bg-zinc-50 border-zinc-200")}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={14} className={selectedCustomer.churn_risk === 'High' ? "text-rose-600" : "text-zinc-500"} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Risk Assessment</h3>
                  </div>
                  <div className="text-sm font-medium text-zinc-700 leading-relaxed mb-3">
                    {selectedCustomer.churn_risk === 'High' 
                      ? "Critical churn probability detected based on recent behavioral drops and negative sentiment."
                      : "Customer exhibits normal usage patterns and stable sentiment."}
                  </div>
                  
                  {selectedCustomer.churn_risk === 'High' && (
                    <div className="bg-white rounded border border-rose-100 p-3 shadow-sm">
                      <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1 flex items-center gap-1"><Lightbulb size={12}/> AI Recommended Action</h4>
                      <p className="text-[13px] font-medium text-zinc-800">
                        {selectedCustomer.feedback?.toLowerCase().includes('website') 
                          ? "Escalate UI/UX complaint ticket directly to engineering team today."
                          : selectedCustomer.days_since_active > 14 
                          ? "Initiate proactive outreach call to verify technical blockers."
                          : "Issue an automated 15% retention discount via email sequence."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Behavioral Metrics */}
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Behavioral Telemetry (90d)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="saas-card p-3">
                      <div className="text-[10px] font-semibold text-zinc-500 mb-1">API Calls</div>
                      <div className="text-lg font-bold text-zinc-900">{selectedCustomer.api_calls_90d?.toLocaleString() || 0}</div>
                    </div>
                    <div className="saas-card p-3">
                      <div className="text-[10px] font-semibold text-zinc-500 mb-1">Session Logins</div>
                      <div className="text-lg font-bold text-zinc-900">{selectedCustomer.logins_90d?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Recent Feedback</h3>
                  {selectedCustomer.feedback ? (
                    <div className="bg-zinc-50 border border-zinc-200 rounded p-4 text-[13px] text-zinc-700 italic">
                      "{selectedCustomer.feedback}"
                    </div>
                  ) : (
                    <div className="text-[13px] text-zinc-500">No recorded feedback.</div>
                  )}
                </div>

              </div>
            </div>

            {selectedCustomer.churn_risk === 'High' && (
              <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    alert(`Mitigation applied for ${selectedCustomer.name}`);
                    setSelectedCustomer(null);
                  }}
                  className="w-full px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={14} /> Execute Mitigation Playbook
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      </>
  );
}
