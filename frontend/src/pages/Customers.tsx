import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, MoreHorizontal, UserX, UserCheck, X, Lightbulb, AlertTriangle, MessageSquare, TrendingDown, TrendingUp, BarChart2 } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerForAction, setSelectedCustomerForAction] = useState<any | null>(null);
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

  // Simple local sentiment analysis for demonstration with actual data
  const nlpInsights = useMemo(() => {
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    const feedbacks: any[] = [];
    
    customers.forEach(c => {
      if (!c.feedback || c.feedback === 'No reason specified') return;
      const text = c.feedback.toLowerCase();
      let sentiment = 'Neutral';
      if (text.includes('poor') || text.includes('bad') || text.includes('issue') || text.includes('slow') || text.includes('hard') || text.includes('too many') || text.includes('terrible')) {
        sentiment = 'Negative';
        negative++;
      } else if (text.includes('good') || text.includes('great') || text.includes('always') || text.includes('quality') || text.includes('love') || text.includes('excellent')) {
        sentiment = 'Positive';
        positive++;
      } else {
        neutral++;
      }
      feedbacks.push({ customer: c, sentiment, text: c.feedback });
    });
    
    return { positive, negative, neutral, feedbacks, total: feedbacks.length };
  }, [customers]);

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/?limit=100000${searchTerm ? `&search=${searchTerm}` : ''}`);
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
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error("Failed to add customer", err);
      alert("Failed to add customer. Check console.");
    }
  };

  return (
    <>
      <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-200 bg-white sticky top-0 z-10 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Customer Management</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Customer
        </button>
      </header>

      <div className="p-8 max-w-[1400px] mx-auto w-full">
        
        {/* Tabs */}
        <div className="flex border-b border-zinc-200 mb-8">
          <button 
            className={cn("px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2", activeTab === 'churn_data' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700")}
            onClick={() => setActiveTab('churn_data')}
          >
            <BarChart2 size={16} />
            Total Churn Analysis
          </button>
          <button 
            className={cn("px-5 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2", activeTab === 'nlp_feedback' ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700")}
            onClick={() => setActiveTab('nlp_feedback')}
          >
            <MessageSquare size={16} />
            NLP & Feedback Insights
          </button>
        </div>

        {activeTab === 'churn_data' ? (
          <>
        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search customers by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-zinc-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 font-medium">Filter Risk:</span>
            <select 
              value={filterRisk} 
              onChange={(e) => setFilterRisk(e.target.value)}
              className="pl-3 pr-8 py-1.5 bg-white border border-zinc-200 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            >
              <option value="All">All Levels</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
               <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[11px] text-zinc-500 bg-zinc-50 uppercase tracking-wider border-b border-zinc-200">
                  <tr>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Plan Tier</th>
                    <th className="px-5 py-3 font-medium">Feedback (Sentiment)</th>
                    <th className="px-5 py-3 font-medium">Churn Risk</th>
                    <th className="px-5 py-3 font-medium">Last Active</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedCustomers.map((c) => (
                    <tr key={c.id} className={cn("hover:bg-zinc-50/80 transition-colors group", c.churn_risk === 'High' ? "bg-rose-50/10" : "")}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center font-bold text-xs border border-zinc-200">
                            {c.name?.substring(0,2).toUpperCase() || 'NA'}
                          </div>
                          <div>
                            <div className="font-medium text-zinc-900">{c.name}</div>
                            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{c.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{c.plan_tier || 'Unknown'}</td>
                      <td className="px-5 py-3">
                        {c.feedback ? (
                           <div className="flex flex-col">
                             <span className="text-xs text-zinc-700 truncate max-w-[150px]">{c.feedback}</span>
                           </div>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">No feedback provided</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", 
                            c.churn_risk === 'High' ? 'bg-rose-500' : c.churn_risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          )}></div>
                          <span className={cn("font-medium text-xs", 
                            c.churn_risk === 'High' ? 'text-rose-600' : c.churn_risk === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                          )}>{c.churn_risk}</span>
                          <span className="text-[11px] text-zinc-400">({Math.round((c.churn_probability || 0)*100)}%)</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-zinc-500 text-xs">
                        {c.days_since_active ? `${c.days_since_active} days ago` : 'Unknown'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {c.churn_risk === 'High' ? (
                          <button 
                            onClick={() => setSelectedCustomerForAction(c)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded text-xs font-medium transition-colors shadow-sm"
                          >
                            <AlertTriangle size={14} /> Mitigate
                          </button>
                        ) : (
                          <button className="text-zinc-400 hover:text-zinc-600 p-1 rounded hover:bg-zinc-100 transition-colors">
                            <MoreHorizontal size={16} />
                          </button>
                        )}
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
          
          <div className="px-5 py-3 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center text-xs text-zinc-500">
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
          </>
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

            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-zinc-900">NLP Keyword Extractions & Actual Feedback</h3>
                  <p className="text-xs text-zinc-500 mt-1">Direct feedback from users filtered by ML sentiment model</p>
                </div>
                {nlpInsights.feedbacks.length > 100 && (
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="text-lg font-semibold text-zinc-900">Add New Customer</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">Customer ID</label>
                <input required type="text" placeholder="e.g. CUST-123" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="w-full border border-zinc-300 rounded px-3 py-1.5 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">Full Name</label>
                <input required type="text" placeholder="Jane Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-zinc-300 rounded px-3 py-1.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Plan Tier</label>
                  <select value={formData.plan_tier} onChange={e => setFormData({...formData, plan_tier: e.target.value})} className="w-full border border-zinc-300 rounded px-3 py-1.5 text-sm">
                    <option>Starter</option>
                    <option>Pro</option>
                    <option>Enterprise</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Age</label>
                  <input type="number" placeholder="30" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full border border-zinc-300 rounded px-3 py-1.5 text-sm" />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-sm">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCustomerForAction && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-rose-50/30">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle size={18} />
                <h2 className="text-sm font-semibold text-rose-900">Churn Mitigation Action</h2>
              </div>
              <button onClick={() => setSelectedCustomerForAction(null)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 flex items-center gap-4 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center font-bold text-zinc-600 text-sm">
                  {selectedCustomerForAction.name?.substring(0,2).toUpperCase() || 'NA'}
                </div>
                <div>
                  <div className="font-semibold text-zinc-900">{selectedCustomerForAction.name}</div>
                  <div className="text-xs text-zinc-500">{selectedCustomerForAction.id} • {selectedCustomerForAction.plan_tier}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-xs text-rose-500 font-medium">Critical Risk</div>
                  <div className="text-sm font-bold text-rose-700">{(selectedCustomerForAction.churn_probability * 100).toFixed(0)}% Probability</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Rumusan Masalah</h3>
                  <div className="text-sm text-zinc-700 bg-rose-50/50 p-3 rounded-md border border-rose-100/50">
                    {selectedCustomerForAction.feedback?.toLowerCase().includes('website') || selectedCustomerForAction.feedback?.toLowerCase().includes('service') 
                      ? `Keluhan spesifik terkait "${selectedCustomerForAction.feedback}". Ini berkolerasi tinggi dengan pelanggan yang akan segera berhenti berlangganan.` 
                      : selectedCustomerForAction.days_since_active > 14 
                      ? `Penurunan drastis aktivitas, tidak menggunakan aplikasi selama ${selectedCustomerForAction.days_since_active} hari terakhir.` 
                      : `Pola metrik API dan Frekuensi Login menunjukkan probabilitas churn yang sangat tinggi berdasarkan profil behavior.`}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Lightbulb size={14} className="text-emerald-500"/> Quick Action Mitigasi</h3>
                  <div className="text-sm text-emerald-800 bg-emerald-50 p-3 rounded-md border border-emerald-100/50 font-medium">
                    {selectedCustomerForAction.feedback?.toLowerCase().includes('website') 
                      ? "Eskalasi tiket keluhan UI/UX secara prioritas ke tim teknis HARI INI."
                      : selectedCustomerForAction.days_since_active > 14 
                      ? "Lakukan Proactive Outreach via Telepon/Email untuk menanyakan kendala."
                      : "Kirimkan penawaran/diskon personal (Retention Promo) via Email."}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedCustomerForAction(null)} 
                className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200 bg-zinc-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert(`Mitigation action executed for ${selectedCustomerForAction.name}!`);
                  setSelectedCustomerForAction(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors shadow-sm flex items-center gap-2"
              >
                Execute Action
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
