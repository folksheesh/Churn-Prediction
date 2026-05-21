import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    navigate('/'); // Redirect to dashboard (Admin Layout)
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
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-zinc-200 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900/20 focus:border-zinc-400 sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors"
            >
              Sign In
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-zinc-500">Don't have an account?</span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/register"
              className="w-full flex justify-center py-2 px-4 border border-zinc-200 rounded-md shadow-sm text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 transition-colors"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
