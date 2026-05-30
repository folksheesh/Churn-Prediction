import { useState, useEffect } from 'react';
import { Mail, Phone, Building2, Plus, Edit2, Loader2, UserCheck, ShieldAlert, Headphones } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface CSAgent {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  department?: string;
  last_login?: string;
  assigned_customers_count: number;
}

export default function CsManagement() {
  const [agents, setAgents] = useState<CSAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<CSAgent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CS Agent',
    phone: '',
    department: 'Support'
  });
  const [saving, setSaving] = useState(false);

  const fetchAgents = async () => {
    try {
      const res = await api.get('/auth/cs-team');
      setAgents(res.data);
    } catch (err) {
      console.error("Failed to fetch CS team", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedAgent(null);
    setFormData({ name: '', email: '', password: '', role: 'CS Agent', phone: '', department: 'Support' });
    setIsAddDrawerOpen(true);
  };

  const handleOpenEdit = (agent: CSAgent) => {
    setIsEditMode(true);
    setSelectedAgent(agent);
    setFormData({ 
      name: agent.name, 
      email: agent.email, 
      password: '', // blank for edit
      role: agent.role,
      phone: agent.phone || '',
      department: agent.department || 'Support'
    });
    setIsAddDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditMode && selectedAgent) {
        const updateData: any = { ...formData };
        if (!updateData.password) delete updateData.password;
        await api.put(`/auth/admins/${selectedAgent.id}`, updateData);
      } else {
        await api.post('/auth/admins', formData);
      }
      await fetchAgents();
      setIsAddDrawerOpen(false);
    } catch (err) {
      console.error("Failed to save CS agent", err);
      alert("Failed to save. Check your connection or permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="saas-heading text-2xl font-black flex items-center gap-2">
            <Headphones className="text-indigo-600" size={24} /> 
            Customer Service Management
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Manage CS Agents, monitor their workload, and update contact information.</p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add CS Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div key={agent.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="p-5 border-b border-zinc-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center font-bold text-indigo-700 border border-indigo-200">
                    {agent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 leading-tight">{agent.name}</h3>
                    <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 inline-block px-1.5 py-0.5 rounded mt-1">
                      {agent.role}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleOpenEdit(agent)}
                  className="text-zinc-400 hover:text-indigo-600 transition-colors p-1 opacity-0 group-hover:opacity-100"
                >
                  <Edit2 size={14} />
                </button>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Mail size={14} className="text-zinc-400" /> {agent.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Phone size={14} className="text-zinc-400" /> {agent.phone || <span className="text-zinc-400 italic">No phone set</span>}
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Building2 size={14} className="text-zinc-400" /> {agent.department || <span className="text-zinc-400 italic">No department set</span>}
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 px-5 py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-zinc-600">
                <UserCheck size={16} className={agent.assigned_customers_count > 0 ? "text-emerald-500" : "text-zinc-400"} />
                <span className="font-medium">Workload</span>
              </div>
              <div className="font-bold text-zinc-900">
                {agent.assigned_customers_count} <span className="text-zinc-500 font-normal text-xs">Assigned</span>
              </div>
            </div>
          </div>
        ))}

        {agents.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 bg-white rounded-xl border border-dashed border-zinc-300">
            <ShieldAlert className="mx-auto h-8 w-8 text-zinc-300 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-900">No CS Agents Found</h3>
            <p className="text-xs mt-1">Get started by adding a new Customer Service agent.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Drawer */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
          <div className="w-[400px] bg-white h-full shadow-2xl animate-slide-in-right flex flex-col border-l border-zinc-200">
            <div className="p-5 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="font-bold text-lg">{isEditMode ? 'Edit CS Agent' : 'Add CS Agent'}</h2>
              <button onClick={() => setIsAddDrawerOpen(false)} className="text-zinc-400 hover:text-zinc-700">✕</button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <form id="csForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="saas-input w-full" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Address</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="saas-input w-full" placeholder="john@churnsense.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Password {isEditMode && '(Leave blank to keep current)'}</label>
                  <input required={!isEditMode} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="saas-input w-full" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="saas-input w-full">
                    <option value="CS Agent">CS Agent</option>
                    <option value="CS Manager">CS Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone Number</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="saas-input w-full" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Department</label>
                  <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="saas-input w-full">
                    <option value="Support">Support</option>
                    <option value="Retention">Retention</option>
                    <option value="Onboarding">Onboarding</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAddDrawerOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" form="csForm" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Add Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
