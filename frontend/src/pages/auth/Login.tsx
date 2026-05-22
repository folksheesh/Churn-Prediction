import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email !== 'admin@gmail.com') {
      setError('Akun email tidak ditemukan.');
      return;
    }
    
    if (password !== 'admin123') {
      setError('Password yang Anda masukkan salah.');
      return;
    }

    login(email, password);
    navigate('/'); // Redirect to dashboard
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 font-outfit">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">Please enter your credentials to access your workspace.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 animate-fadeIn">
          <span className="text-rose-500 font-bold">!</span>
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all"
            placeholder="admin@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          className="w-full mt-2 py-3.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors glow-brand shadow-md text-sm"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
