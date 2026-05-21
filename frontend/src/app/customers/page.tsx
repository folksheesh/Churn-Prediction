'use client';
import { useState } from 'react';
import { Search, Filter, MoreHorizontal } from 'lucide-react';

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for the customers table
  const customers = [
    { id: '#4092', name: 'Acme Corp', plan: 'Enterprise', status: 'Active', risk: 'High', lastActive: '2 days ago' },
    { id: '#1123', name: 'Globex', plan: 'Pro', status: 'Active', risk: 'High', lastActive: '5 days ago' },
    { id: '#8943', name: 'Soylent', plan: 'Pro', status: 'Inactive', risk: 'Medium', lastActive: '14 days ago' },
    { id: '#2291', name: 'Initech', plan: 'Starter', status: 'Active', risk: 'Low', lastActive: '1 day ago' },
    { id: '#3302', name: 'Umbrella', plan: 'Enterprise', status: 'Active', risk: 'Low', lastActive: 'Just now' },
    { id: '#4412', name: 'Massive Dynamic', plan: 'Pro', status: 'Active', risk: 'Medium', lastActive: '3 days ago' },
  ];

  return (
    <>
      <header className="h-16 flex items-center px-8 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">Customers</h1>
      </header>

      <div className="p-8 max-w-7xl mx-auto w-full">
        
        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Filter size={16} /> Filter
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Churn Risk</th>
                <th className="px-6 py-4 font-medium">Last Active</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{c.id}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{c.plan}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      c.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        c.risk === 'High' ? 'bg-rose-500' : c.risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></div>
                      <span className={`font-medium ${
                        c.risk === 'High' ? 'text-rose-600' : c.risk === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>{c.risk}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{c.lastActive}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-sm text-slate-500">
            <span>Showing 1 to 6 of 10,686 customers</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-slate-200 bg-white rounded hover:bg-slate-50 disabled:opacity-50">Previous</button>
              <button className="px-3 py-1 border border-slate-200 bg-white rounded hover:bg-slate-50">Next</button>
            </div>
          </div>
        </div>
        
      </div>
    </>
  );
}
