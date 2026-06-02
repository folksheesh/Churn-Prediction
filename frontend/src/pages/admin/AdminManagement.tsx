import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Plus, Trash2, CheckCircle, XCircle, Edit2, Eye, EyeOff, X, Clock, User, Phone, Briefcase, Mail } from 'lucide-react';

const ROLES = ['Super Admin', 'Admin', 'CS Manager', 'CS Agent'];
const DEPARTMENTS = ['Executive', 'Customer Support', 'IT Operations', 'Marketing', 'Sales'];

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
  const { token, user } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Customer Support');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Edit & UI State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password validation
  const valLength = password.length >= 8;
  const valUpper = /[A-Z]/.test(password);
  const valLower = /[a-z]/.test(password);
  const valNum = /\d/.test(password);
  const valSpec = /[^A-Za-z0-9\s]/.test(password);
  const isPasswordValid = valLength && valUpper && valLower && valNum && valSpec;
  
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
      const payload: any = { email, name, role, phone, department };
      if (password) payload.password = password;

      if (editingId) {
        await api.put(`/auth/admins/${editingId}`, payload);
        setSuccess('Employee record successfully updated!');
      } else {
        await api.post('/auth/admins', payload);
        setSuccess('Employee successfully added to the system!');
      }
      
      setTimeout(() => {
        handleCancelEdit();
        fetchAdmins();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || (editingId ? 'Failed to update employee' : 'Failed to add employee'));
    }
  };

  const handleEditClick = (admin: any) => {
    setEditingId(admin.id);
    setIsModalOpen(true);
    setName(admin.name);
    setEmail(admin.email);
    setRole(admin.role || 'Admin');
    setPhone(admin.phone || '');
    setDepartment(admin.department || 'Customer Support');
    setPassword('');
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsModalOpen(false);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setDepartment('Customer Support');
    setRole('Admin');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to revoke this employee's access?")) return;
    
    try {
      await api.delete(`/auth/admins/${id}`);
      fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete employee");
    }
  };

  const formatLastLogin = (dateStr: string | null) => {
    if (!dateStr) return 'Never logged in';
    // Clean up any double 'Z' or '+00:00Z' that might come from backend tweaks
    let cleanDate = dateStr.replace('Z', '').replace('+00:00', '');
    // Append 'Z' to force UTC parsing, since backend stores as UTC naive
    const d = new Date(cleanDate + 'Z');
    
    // Fallback if invalid
    if (isNaN(d.getTime())) return 'Invalid date';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Online now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <header className="h-20 flex items-center justify-between px-8 border-b border-zinc-200 bg-white sticky top-0 z-10 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Employee Directory</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage system access and roles for company personnel.</p>
        </div>
        <button 
          onClick={() => { handleCancelEdit(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={16} /> Add Employee
        </button>
      </header>

      <div className="p-4 sm:p-8 w-full">
        {/* Admin List */}
        <div className="w-full bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                <ShieldCheck size={16} className="text-brand-600" />
              </div>
              <h2 className="text-sm font-bold text-zinc-900">Active Personnel</h2>
            </div>
            <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">{admins.length} Members</span>
          </div>
          
          {loading ? (
             <div className="h-64 flex flex-col items-center justify-center gap-3">
               <div className="w-6 h-6 border-2 border-zinc-200 border-t-brand-600 rounded-full animate-spin"></div>
               <p className="text-sm text-zinc-500 font-medium">Loading directory...</p>
             </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[11px] text-zinc-500 bg-white uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Employee</th>
                    <th className="px-6 py-4 font-semibold">Contact & Dept</th>
                    <th className="px-6 py-4 font-semibold">System Role</th>
                    <th className="px-6 py-4 font-semibold">Activity</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-zinc-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-100 to-zinc-200 border border-zinc-200 flex items-center justify-center text-sm font-bold text-zinc-600 shadow-sm relative">
                            {admin.name?.substring(0, 2).toUpperCase() || 'AD'}
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${admin.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-400'}`}></div>
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 flex items-center gap-2">
                              {admin.name}
                              {user?.email === admin.email && (
                                <span className="text-[9px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-md font-bold uppercase">You</span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 mt-0.5">{admin.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-700 font-medium">
                            <Briefcase size={12} className="text-zinc-400" />
                            {admin.department || 'Not Assigned'}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Phone size={12} className="text-zinc-400" />
                            {admin.phone || 'No Phone'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${roleBadgeColors[admin.role] || 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                          {admin.role || 'Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColors[admin.status] || 'bg-zinc-100 text-zinc-500'}`}>
                            {admin.status || 'Active'}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                            <Clock size={10} />
                            {formatLastLogin(admin.last_login)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditClick(admin)}
                            className="p-2 text-zinc-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                            title="Edit Employee"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(admin.id)}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all" 
                            disabled={admin.email === 'admin@churnsense.com' || user?.email === admin.email}
                            title="Revoke Access"
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

        {/* Add/Edit Admin Modal */}
        {(isModalOpen || editingId) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-[550px] bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="px-8 py-5 border-b border-zinc-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                    {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900">{editingId ? 'Edit Employee Record' : 'Add New Employee'}</h2>
                    <p className="text-xs text-zinc-500 font-medium">Provide details and assign system role.</p>
                  </div>
                </div>
                <button onClick={handleCancelEdit} className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8">
                {error && <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-medium flex items-start gap-2"><XCircle size={14} className="mt-0.5 shrink-0" /> {error}</div>}
                {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 font-medium flex items-center gap-2"><CheckCircle size={14} /> {success}</div>}
                
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400"><User size={14}/></div>
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full text-sm pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400"><Mail size={14}/></div>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full text-sm pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
                          placeholder="john@churnsense.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400"><Phone size={14}/></div>
                        <input 
                          type="text" 
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="w-full text-sm pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Department</label>
                      <select 
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full text-sm px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      >
                        {DEPARTMENTS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 pt-5 mt-5">
                    <h3 className="text-sm font-bold text-zinc-900 mb-4">Security & Access</h3>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">System Role</label>
                        <select 
                          value={role}
                          onChange={e => setRole(e.target.value)}
                          className="w-full text-sm px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        >
                          {ROLES.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Password {editingId && <span className="font-medium lowercase text-zinc-400">(leave blank to keep)</span>}</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"}
                            required={!editingId}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full text-sm px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all pr-10" 
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
                    </div>
                  </div>

                  {/* Password Validation Requirements */}
                  {(password.length > 0 || !editingId) && (
                    <div className="text-[11px] flex flex-wrap gap-x-4 gap-y-2 mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className={`flex items-center gap-1.5 ${valLength ? 'text-emerald-600 font-semibold' : 'text-zinc-500'}`}>
                        {valLength ? <CheckCircle size={12} /> : <XCircle size={12} />} Min 8 chars
                      </div>
                      <div className={`flex items-center gap-1.5 ${valUpper ? 'text-emerald-600 font-semibold' : 'text-zinc-500'}`}>
                        {valUpper ? <CheckCircle size={12} /> : <XCircle size={12} />} 1 Uppercase
                      </div>
                      <div className={`flex items-center gap-1.5 ${valLower ? 'text-emerald-600 font-semibold' : 'text-zinc-500'}`}>
                        {valLower ? <CheckCircle size={12} /> : <XCircle size={12} />} 1 Lowercase
                      </div>
                      <div className={`flex items-center gap-1.5 ${valNum ? 'text-emerald-600 font-semibold' : 'text-zinc-500'}`}>
                        {valNum ? <CheckCircle size={12} /> : <XCircle size={12} />} 1 Number
                      </div>
                      <div className={`flex items-center gap-1.5 ${valSpec ? 'text-emerald-600 font-semibold' : 'text-zinc-500'}`}>
                        {valSpec ? <CheckCircle size={12} /> : <XCircle size={12} />} 1 Special char
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100">
                    <button 
                      type="button" 
                      onClick={handleCancelEdit}
                      className="px-6 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold rounded-xl text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={!isFormValid}
                      className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {editingId ? 'Save Changes' : 'Confirm & Add Employee'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
