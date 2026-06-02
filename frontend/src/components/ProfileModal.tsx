import React, { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { X, User, Lock, Mail, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password validation (same as admin management)
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

      await api.put(`/auth/admins/${user.id}`, payload);
      setSuccess('Profile updated successfully! Refresh to see changes globally.');
      setPassword('');
      
      setTimeout(() => {
        onClose();
        window.location.reload(); // Quick way to sync auth state
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[450px] bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <User size={18} className="text-zinc-600" />
            <h2 className="text-sm font-bold text-zinc-900">My Profile</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">{error}</div>}
          {success && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded border border-emerald-200">{success}</div>}
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1"><User size={12}/> Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-shadow" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1"><Mail size={12}/> Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-shadow" 
              disabled={user?.email === 'admin@churnsense.com'}
              title={user?.email === 'admin@churnsense.com' ? "Cannot change default admin email" : ""}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1"><Lock size={12}/> Change Password <span className="text-zinc-400 font-normal">(leave blank to keep)</span></label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 pr-10 transition-shadow" 
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPassword(!showPassword);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors z-10"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {password.length > 0 && (
              <div className="text-[10px] space-y-1 mt-2 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className={`flex items-center gap-1.5 ${valLength ? 'text-emerald-600' : 'text-zinc-500'}`}>
                  {valLength ? <CheckCircle size={10} /> : <XCircle size={10} />} Min 8 characters
                </div>
                <div className={`flex items-center gap-1.5 ${valUpper ? 'text-emerald-600' : 'text-zinc-500'}`}>
                  {valUpper ? <CheckCircle size={10} /> : <XCircle size={10} />} 1 Uppercase
                </div>
                <div className={`flex items-center gap-1.5 ${valLower ? 'text-emerald-600' : 'text-zinc-500'}`}>
                  {valLower ? <CheckCircle size={10} /> : <XCircle size={10} />} 1 Lowercase
                </div>
                <div className={`flex items-center gap-1.5 ${valNum ? 'text-emerald-600' : 'text-zinc-500'}`}>
                  {valNum ? <CheckCircle size={10} /> : <XCircle size={10} />} 1 Number
                </div>
                <div className={`flex items-center gap-1.5 ${valSpec ? 'text-emerald-600' : 'text-zinc-500'}`}>
                  {valSpec ? <CheckCircle size={10} /> : <XCircle size={10} />} 1 Special character
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium py-2 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || (password.length > 0 && !isPasswordValid)}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
