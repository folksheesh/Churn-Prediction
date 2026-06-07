import React, { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { User, Lock, Mail, CheckCircle, XCircle, Eye, EyeOff, Shield } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password validation
  const valLength = password.length >= 8;
  const valUpper = /[A-Z]/.test(password);
  const valLower = /[a-z]/.test(password);
  const valNum = /\d/.test(password);
  const valSpec = /[^A-Za-z0-9\s]/.test(password);
  const isPasswordValid = valLength && valUpper && valLower && valNum && valSpec;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (password && !isPasswordValid) {
      setError('Password does not meet the requirements.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = { name, email };
      if (password) payload.password = password;

      const res = await api.put(`/auth/admins/${user.id}`, payload);
      
      // Update user in localStorage and context state so the UI reflects changes
      updateUser(res.data);
      
      setSuccess('Profile updated successfully! Reloading to apply changes...');
      setPassword('');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="h-16 hidden md:flex items-center px-8 border-b border-zinc-200 bg-white sticky top-0 z-10 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">My Profile</h1>
      </header>
      
      <div className="p-4 sm:p-8 w-full max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-bold text-2xl shadow-lg border-4 border-white">
            {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">{user?.name || 'Admin'}</h2>
            <p className="text-zinc-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                <Shield size={12} /> {user?.role || 'Admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="px-8 py-5 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-900">Account Settings</h3>
            <p className="text-xs text-zinc-500 mt-1">Update your personal information and secure your account.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200 font-medium">{error}</div>}
            {success && <div className="p-4 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200 font-medium">{success}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5"><User size={14}/> Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5"><Mail size={14}/> Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm disabled:bg-zinc-50 disabled:text-zinc-400" 
                  disabled={user?.email === 'admin@churnsense.com'}
                  title={user?.email === 'admin@churnsense.com' ? "Cannot change default admin email" : ""}
                />
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-6 mt-6">
              <h4 className="text-sm font-semibold text-zinc-900 mb-4">Security</h4>
              <div className="space-y-2 max-w-md">
                <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5"><Lock size={14}/> Change Password <span className="text-zinc-400 font-normal">(leave blank to keep)</span></label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm pr-12" 
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors z-10"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                {password.length > 0 && (
                  <div className="text-[11px] space-y-1 mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className={`flex items-center gap-1.5 ${valLength ? 'text-emerald-600 font-medium' : 'text-zinc-500'}`}>
                      {valLength ? <CheckCircle size={12} /> : <XCircle size={12} />} Min 8 characters
                    </div>
                    <div className={`flex items-center gap-1.5 ${valUpper ? 'text-emerald-600 font-medium' : 'text-zinc-500'}`}>
                      {valUpper ? <CheckCircle size={12} /> : <XCircle size={12} />} 1 Uppercase letter
                    </div>
                    <div className={`flex items-center gap-1.5 ${valLower ? 'text-emerald-600 font-medium' : 'text-zinc-500'}`}>
                      {valLower ? <CheckCircle size={12} /> : <XCircle size={12} />} 1 Lowercase letter
                    </div>
                    <div className={`flex items-center gap-1.5 ${valNum ? 'text-emerald-600 font-medium' : 'text-zinc-500'}`}>
                      {valNum ? <CheckCircle size={12} /> : <XCircle size={12} />} 1 Number
                    </div>
                    <div className={`flex items-center gap-1.5 ${valSpec ? 'text-emerald-600 font-medium' : 'text-zinc-500'}`}>
                      {valSpec ? <CheckCircle size={12} /> : <XCircle size={12} />} 1 Special character
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 flex justify-end">
              <button 
                type="submit" 
                disabled={loading || (password.length > 0 && !isPasswordValid)}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
