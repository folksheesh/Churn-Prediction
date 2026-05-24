import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard'); // Redirect to dashboard
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="flex justify-center items-center gap-2 mb-8">
        <div className="bg-zinc-900 p-2 rounded-lg">
          <Activity className="text-white" size={24} />
        </div>
        <span className="text-xl font-bold tracking-tight text-zinc-900">ChurnSense</span>
      </div>

      <div className="bg-white py-8 px-4 shadow-sm border border-zinc-200/80 sm:rounded-xl sm:px-10">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Sign in to your workspace</h2>
            <p className="mt-1 text-sm text-zinc-500">Welcome back! Please enter your details.</p>
          </div>
          
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-md border border-rose-200">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700">Email Address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-zinc-200 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900/20 focus:border-zinc-400 sm:text-sm transition-colors"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700">Password</label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-zinc-200 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900/20 focus:border-zinc-400 sm:text-sm transition-colors pr-10"
                  placeholder="••••••••"
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

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
