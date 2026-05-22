import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function AdminManagement() {
  const { token } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password validation state
  const valLength = password.length >= 8;
  const valUpper = /[A-Z]/.test(password);
  const valLower = /[a-z]/.test(password);
  const valNum = /\d/.test(password);
  const valSpec = /[@$!%*?&]/.test(password);
  const isPasswordValid = valLength && valUpper && valLower && valNum && valSpec;

  const fetchAdmins = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/v1/auth/admins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAdmins();
  }, [token]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!isPasswordValid) {
      setError('Password does not meet the requirements.');
      return;
    }

    try {
      await axios.post('http://localhost:8000/api/v1/auth/admins', {
        email,
        name,
        password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Admin successfully added!');
      setEmail('');
      setName('');
      setPassword('');
      fetchAdmins();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add admin');
    }
  };

  return (
    <>
      <header className="h-16 flex items-center px-8 border-b border-zinc-200 bg-white sticky top-0 z-10 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Manage Admins</h1>
      </header>

      <div className="p-8 max-w-[1200px] mx-auto w-full space-y-6 flex gap-6 items-start">
        
        {/* Admin List */}
        <div className="flex-1 bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <ShieldCheck size={18} className="text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Active Admins</h2>
          </div>
          
          {loading ? (
             <div className="h-40 flex items-center justify-center">
               <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
             </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-zinc-500 bg-zinc-50 uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-zinc-900">{admin.name}</td>
                    <td className="px-6 py-3 text-zinc-600">{admin.email}</td>
                    <td className="px-6 py-3 text-right">
                      <button className="text-rose-500 hover:text-rose-700 disabled:opacity-50" disabled={admin.email === 'admin@churnsense.com'}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Admin Form */}
        <div className="w-[400px] bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden shrink-0">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <Plus size={18} className="text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Add New Admin</h2>
          </div>
          
          <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
            {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">{error}</div>}
            {success && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded border border-emerald-200">{success}</div>}
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10" 
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10" 
                placeholder="john@churnsense.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10" 
                placeholder="••••••••"
              />
            </div>

            {/* Password Validation Requirements */}
            <div className="text-[11px] space-y-1 mt-2 p-3 bg-zinc-50 rounded border border-zinc-100">
              <p className="font-semibold text-zinc-700 mb-2">Password Requirements:</p>
              <div className={`flex items-center gap-1.5 ${valLength ? 'text-emerald-600' : 'text-zinc-500'}`}>
                {valLength ? <CheckCircle size={12} /> : <XCircle size={12} />} Minimum 8 characters
              </div>
              <div className={`flex items-center gap-1.5 ${valUpper ? 'text-emerald-600' : 'text-zinc-500'}`}>
                {valUpper ? <CheckCircle size={12} /> : <XCircle size={12} />} 1 Uppercase letter
              </div>
              <div className={`flex items-center gap-1.5 ${valLower ? 'text-emerald-600' : 'text-zinc-500'}`}>
                {valLower ? <CheckCircle size={12} /> : <XCircle size={12} />} 1 Lowercase letter
              </div>
              <div className={`flex items-center gap-1.5 ${valNum ? 'text-emerald-600' : 'text-zinc-500'}`}>
                {valNum ? <CheckCircle size={12} /> : <XCircle size={12} />} 1 Number
              </div>
              <div className={`flex items-center gap-1.5 ${valSpec ? 'text-emerald-600' : 'text-zinc-500'}`}>
                {valSpec ? <CheckCircle size={12} /> : <XCircle size={12} />} 1 Special character (@$!%*?&)
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!isPasswordValid || !email || !name}
              className="w-full mt-4 bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Admin
            </button>
          </form>
        </div>

      </div>
    </>
  );
}
