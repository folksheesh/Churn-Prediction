import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Plus, Trash2, CheckCircle, XCircle, Edit2, Eye, EyeOff, X, Clock, User } from 'lucide-react';

const ROLES = ['Super Admin', 'Admin', 'CS Manager', 'CS Agent'];

const roleBadgeColors: Record<string, string> = {
  'Super Admin': 'bg-violet-100 text-violet-700 border-violet-200',
  'Admin': 'bg-blue-100 text-blue-700 border-blue-200',
  'CS Manager': 'bg-amber-100 text-amber-700 border-amber-200',
  'CS Agent': 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const statusColors: Record<string, string> = {
  'Active': 'bg-emerald-50 text-emerald-700',
  'Inactive': 'bg-zinc-100 text-zinc-500',
  'Suspended': 'bg-rose-50 text-rose-600',
};

export default function AdminManagement() {
  const { token } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Edit & UI State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Password validation — accepts ANY non-alphanumeric, non-whitespace character
  const valLength = password.length >= 8;
  const valUpper = /[A-Z]/.test(password);
  const valLower = /[a-z]/.test(password);
  const valNum = /\d/.test(password);
  const valSpec = /[^A-Za-z0-9\s]/.test(password);
  const isPasswordValid = valLength && valUpper && valLower && valNum && valSpec;
  
  // Password is required for creating, but optional for editing
  const isFormValid = email && name && (editingId ? (!password || isPasswordValid) : isPasswordValid);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/auth/admins');
      setAdmins(res.data);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAdmins();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password && !isPasswordValid) {
      setError('Password does not meet the requirements.');
      return;
    }

    try {
      const payload: any = { email, name, role };
      if (password) payload.password = password;

      if (editingId) {
        await api.put(`/auth/admins/${editingId}`, payload);
        setSuccess('Admin successfully updated!');
      } else {
        await api.post('/auth/admins', payload);
        setSuccess('Admin successfully added!');
      }
      
      handleCancelEdit();
      fetchAdmins();
    } catch (err: any) {
      setError(err.response?.data?.detail || (editingId ? 'Failed to update admin' : 'Failed to add admin'));
    }
  };

  const handleEditClick = (admin: any) => {
    setEditingId(admin.id);
    setName(admin.name);
    setEmail(admin.email);
    setRole(admin.role || 'Admin');
    setPassword('');
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('Admin');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    
    try {
      await api.delete(`/auth/admins/${id}`);
      fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete admin");
    }
  };

  const formatLastLogin = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <header className="h-16 flex items-center px-8 border-b border-zinc-200 bg-white sticky top-0 z-10 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Manage Admins</h1>
      </header>

      <div className="p-4 sm:p-8 w-full flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Admin List */}
        <div className="flex-1 bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
            <ShieldCheck size={18} className="text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Active Admins</h2>
            <span className="ml-auto text-[11px] font-medium text-zinc-400">{admins.length} total</span>
          </div>
          
          {loading ? (
             <div className="h-40 flex items-center justify-center">
               <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
             </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[11px] text-zinc-500 bg-zinc-50 uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Last Login</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                          {admin.name?.substring(0, 2).toUpperCase() || 'AD'}
                        </div>
                        <span className="font-medium text-zinc-900">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-zinc-600">{admin.email}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeColors[admin.role] || 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                        {admin.role || 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[admin.status] || 'bg-zinc-100 text-zinc-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${admin.status === 'Active' ? 'bg-emerald-500' : admin.status === 'Suspended' ? 'bg-rose-500' : 'bg-zinc-400'}`}></span>
                        {admin.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                        <Clock size={12} className="text-zinc-400" />
                        {formatLastLogin(admin.last_login)}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(admin)}
                          className="text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(admin.id)}
                          className="text-rose-400 hover:text-rose-600 disabled:opacity-50 transition-colors" 
                          disabled={admin.email === 'admin@churnsense.com'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Add Admin Form */}
        <div className="w-full lg:w-[400px] bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden shrink-0">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {editingId ? <Edit2 size={18} className="text-zinc-500" /> : <Plus size={18} className="text-zinc-500" />}
              <h2 className="text-sm font-semibold text-zinc-900">{editingId ? 'Edit Admin' : 'Add New Admin'}</h2>
            </div>
            {editingId && (
              <button onClick={handleCancelEdit} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              <label className="text-xs font-semibold text-zinc-700">Role</label>
              <select 
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10 bg-white"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Password {editingId && <span className="text-zinc-400 font-normal">(leave blank to keep current)</span>}</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  required={!editingId}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10 pr-10" 
                  placeholder={editingId ? "••••••••" : "••••••••"}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPassword(prev => !prev);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors z-10 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
                {valSpec ? <CheckCircle size={12} /> : <XCircle size={12} />} 1 Special character (e.g. @$!%*?&#/\-_+.())
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!isFormValid}
              className="w-full mt-4 bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingId ? 'Save Changes' : 'Add Admin'}
            </button>
          </form>
        </div>

      </div>
    </>
  );
}
