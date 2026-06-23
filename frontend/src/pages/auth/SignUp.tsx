import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Activity, Eye, EyeOff, ArrowLeft, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/signup', { name, email, password });
      setSuccess('Account created successfully. You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen font-outfit">
      {/* LEFT SIDE: Interactive Hero / Branding */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-zinc-950 p-12 flex-col justify-between">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/30 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-600/30 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo keren.jpeg" alt="ChurnSense Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-brand-500/20" />
            <span className="text-2xl font-black tracking-tight text-white">ChurnSense</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-xl">
          <h1 className="text-5xl font-black text-white leading-[1.1] mb-6">
            Join thousands of businesses <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">reducing churn.</span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-md">
            Create an account today to access AI-powered predictive analytics for your customer retention strategies.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-zinc-900 rounded-lg p-2 shrink-0 border border-zinc-800">
                <ShieldCheck size={20} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Get Started Fast</h4>
                <p className="text-zinc-500 text-xs mt-1">Setup takes less than 5 minutes. No credit card required.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-zinc-900 rounded-lg p-2 shrink-0 border border-zinc-800">
                <img src="/logo keren.jpeg" alt="logo" className="w-5 h-5 rounded object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Actionable Insights</h4>
                <p className="text-zinc-500 text-xs mt-1">Discover why customers leave before they actually do.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-zinc-500 text-xs font-semibold">
          <p>&copy; 2026 ChurnSense Inc.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Sign Up Form */}
      <div className="flex-1 flex flex-col justify-center bg-white relative">
        <Link to="/" className="absolute top-8 left-8 lg:hidden flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="w-full max-w-md mx-auto px-8 sm:px-12 py-12">
          
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/logo keren.jpeg" alt="ChurnSense Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-brand-500/20" />
            <span className="text-2xl font-black tracking-tight text-zinc-900">ChurnSense</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Create an account</h2>
            <p className="mt-2 text-zinc-500 font-medium">Sign up to get started with your workspace.</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200/60 rounded-xl flex items-start gap-3 animate-fade-in">
              <div className="bg-rose-100 p-1 rounded-full shrink-0 mt-0.5">
                <ShieldCheck size={14} className="text-rose-600" />
              </div>
              <p className="text-sm font-semibold text-rose-800 leading-snug">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200/60 rounded-xl flex items-start gap-3 animate-fade-in">
              <div className="bg-emerald-100 p-1 rounded-full shrink-0 mt-0.5">
                <ShieldCheck size={14} className="text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-emerald-800 leading-snug">{success}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white text-zinc-900 font-medium transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white text-zinc-900 font-medium transition-all"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white text-zinc-900 font-medium transition-all pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(prev => !prev);
                    }}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors z-10 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-500">Must be at least 8 characters, include an uppercase letter, number, and special character.</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-zinc-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
                {!loading && <ArrowRight size={16} className="opacity-70 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm font-medium text-zinc-600">
                Already have an account? <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 transition-colors">Sign in</Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
