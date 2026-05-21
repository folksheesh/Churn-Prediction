import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, MoreHorizontal, UserX, UserCheck, X, Lightbulb, AlertTriangle, MessageSquare, TrendingDown, TrendingUp, BarChart2, Activity, UploadCloud, Download } from 'lucide-react';
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
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'churn_data' | 'nlp_feedback'>('churn_data');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [formData, setFormData] = useState({
    id: '', name: '', age: '', gender: 'Male', plan_tier: 'Starter', 
    api_calls_90d: 0, logins_90d: 0, days_since_active: 0
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
      const res = await api.get(`/customers/?limit=200${searchTerm ? `&search=${searchTerm}` : ''}`);
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

  const handleImportCSV = async () => {
    if (!importFile) return;
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await api.post('/customers/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Import successful: ${res.data.count} customers imported.`);
      setIsImportModalOpen(false);
      setImportFile(null);
      fetchCustomers();
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail?.errors) {
        alert(`Data Validation Failed:\n\n${err.response.data.detail.errors.join('\n')}`);
      } else if (typeof err.response?.data?.detail === 'string') {
        alert(`Error: ${err.response.data.detail}`);
      } else {
        alert('Failed to import CSV');
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
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-md text-xs font-medium transition-all active:scale-[0.97] shadow-sm hover:shadow"
          >
            <UploadCloud size={14} /> Import CSV
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
        
        {/* Segmented Control Tabs */}
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
              className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex justify-center items-center gap-1.5", activeTab === 'nlp_feedback' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
              onClick={() => setActiveTab('nlp_feedback')}
            >
              <MessageSquare size={14} />
              NLP Feedback
            </button>
          </div>
        </div>

        {activeTab === 'churn_data' ? (
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
        ) : (
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
                  <h3 className="saas-heading">NLP Keyword Extractions & Actual Feedback</h3>
                  <p className="saas-subtext mt-0.5">Direct feedback from users filtered by ML sentiment model</p>
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
                  <label className="text-xs font-semibold text-zinc-700">Age</label>
                  <input type="number" placeholder="30" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400" />
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

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/30 backdrop-blur-sm z-50 flex justify-center items-center animate-fade-in">
          <div className="w-[450px] bg-white rounded-xl shadow-2xl p-6 flex flex-col relative animate-in zoom-in-95 duration-200">
            <button onClick={() => { setIsImportModalOpen(false); setImportFile(null); }} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 transition-colors">
              <X size={16} />
            </button>
            <h2 className="text-lg font-bold text-zinc-900 mb-1">Import Customers</h2>
            <p className="text-xs text-zinc-500 mb-6">Upload a CSV file to bulk import customer records and automatically run ML predictions.</p>
            
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center justify-center gap-2 w-full py-2 mb-4 border border-zinc-200 rounded-md text-sm font-medium text-blue-600 bg-blue-50/50 hover:bg-blue-50 transition-colors"
            >
              <Download size={14} /> Download CSV Template
            </button>
            
            <div className="border-2 border-dashed border-zinc-200 rounded-lg p-8 flex flex-col items-center justify-center mb-6 bg-zinc-50/50">
              <UploadCloud size={32} className="text-zinc-400 mb-3" />
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsImportModalOpen(false); setImportFile(null); }} className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded border border-zinc-200 transition-colors shadow-sm">
                Cancel
              </button>
              <button 
                onClick={handleImportCSV} 
                disabled={!importFile || isImporting}
                className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isImporting ? <div className="w-4 h-4 border-2 border-zinc-500 border-t-white rounded-full animate-spin"></div> : 'Upload & Predict'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
