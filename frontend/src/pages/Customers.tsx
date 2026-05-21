import { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreHorizontal, UserX, UserCheck, X, Lightbulb, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '', name: '', age: '', gender: 'Male', plan_tier: 'Starter', 
    api_calls_90d: 0, logins_90d: 0, days_since_active: 0
  });

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      const res = await api.get(`/customers/?limit=20${searchTerm ? `&search=${searchTerm}` : ''}`);
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
        
        {/* Analisis Masalah & Solusi Panel */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-5 flex gap-4 shadow-sm">
            <div className="shrink-0 mt-0.5 text-rose-600"><AlertTriangle size={20} /></div>
            <div>
              <h3 className="font-semibold text-rose-900 text-sm mb-1">Rumusan Masalah (Berdasarkan Analisis Model)</h3>
              <p className="text-xs text-rose-800 leading-relaxed">
                Tingkat churn yang terdeteksi berada di angka kritis (59.7%). Analisis prediksi SVM & NLP menyoroti bahwa keluhan terkait <strong>"Poor Website"</strong> dan <strong>"Poor Customer Service"</strong> adalah penyumbang risiko tertinggi (hingga 88% probabilitas churn). Penurunan aktivitas (<em>days since active</em>) juga berkorelasi langsung dengan keluhan-keluhan tersebut.
              </p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 flex gap-4 shadow-sm">
            <div className="shrink-0 mt-0.5 text-emerald-600"><Lightbulb size={20} /></div>
            <div>
              <h3 className="font-semibold text-emerald-900 text-sm mb-1">Rekomendasi Solusi Strategis</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                1. <strong>Percepatan Resolusi Tiket:</strong> Prioritaskan tiket dari keluhan UI/UX ("Poor Website").<br/>
                2. <strong>Proactive CS Outreach:</strong> Hubungi secara manual pelanggan yang mengeluhkan "Poor Customer Service" sebelum mereka tidak aktif &gt; 14 hari.<br/>
                3. <strong>Promosi Personal:</strong> Berikan penawaran khusus kepada pelanggan berisiko tinggi untuk meredam kekecewaan teknis.
              </p>
            </div>
          </div>
        </div>

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
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm">
            <Filter size={14} /> Filter Views
          </button>
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
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/80 transition-colors group">
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
                        <button className="text-zinc-400 hover:text-zinc-600 p-1 rounded hover:bg-zinc-100 transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
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
            <span>Showing top {customers.length} results</span>
            <div className="flex gap-1.5">
              <button className="px-2.5 py-1 border border-zinc-200 bg-white rounded hover:bg-zinc-50 disabled:opacity-50 shadow-sm transition-colors">Prev</button>
              <button className="px-2.5 py-1 border border-zinc-200 bg-white rounded hover:bg-zinc-50 shadow-sm transition-colors">Next</button>
            </div>
          </div>
        </div>
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
    </>
  );
}
