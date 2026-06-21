import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Activity, Eye, EyeOff, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

type PageState = 'loading' | 'valid' | 'expired' | 'invalid' | 'used' | 'success';

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invitationEmail, setInvitationEmail] = useState('');
  const [invitedBy, setInvitedBy] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password validation
  const valLength = password.length >= 8;
  const valUpper = /[A-Z]/.test(password);
  const valLower = /[a-z]/.test(password);
  const valNum = /\d/.test(password);
  const valSpec = /[^A-Za-z0-9\s]/.test(password);
  const isPasswordValid = valLength && valUpper && valLower && valNum && valSpec;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    if (!token) {
      setPageState('invalid');
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await api.get(`/auth/invite/validate?token=${token}`);
      setInvitationEmail(res.data.email);
      setInvitedBy(res.data.invited_by);
      setPageState('valid');
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 410) {
        setPageState('expired');
      } else if (status === 400) {
        setPageState('used');
      } else {
        setPageState('invalid');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not meet the requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/activate-account', {
        token,
        name: name.trim(),
        password,
        confirm_password: confirmPassword
      });

      // Auto-login with the returned token
      localStorage.setItem('churn_token', res.data.access_token);
      localStorage.setItem('churn_user', JSON.stringify(res.data.user));
      setPageState('success');
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to activate account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Expired / Invalid / Used States ─────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="flex w-full min-h-screen font-outfit items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 font-medium">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'expired' || pageState === 'invalid' || pageState === 'used') {
    const config = {
      expired: {
        icon: <Clock size={48} className="text-amber-500" />,
        title: 'Invitation Expired',
        description: 'This invitation link has expired. Please contact your administrator to send a new invitation.',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
      },
      invalid: {
        icon: <XCircle size={48} className="text-rose-500" />,
        title: 'Invalid Invitation',
        description: 'This invitation link is invalid. Please check the link or contact your administrator.',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-200',
      },
      used: {
        icon: <CheckCircle size={48} className="text-blue-500" />,
        title: 'Already Activated',
        description: 'This invitation has already been used to create an account. You can sign in with your credentials.',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      },
    }[pageState];

    return (
      <div className="flex w-full min-h-screen font-outfit items-center justify-center bg-zinc-50">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
            <div className={`${config.bgColor} ${config.borderColor} border-b p-8 flex flex-col items-center`}>
              {config.icon}
              <h2 className="text-2xl font-black text-zinc-900 mt-4 text-center">{config.title}</h2>
            </div>
            <div className="p-8 text-center">
              <p className="text-zinc-600 leading-relaxed mb-8">{config.description}</p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-zinc-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all"
              >
                Go to Sign In
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="flex w-full min-h-screen font-outfit items-center justify-center bg-zinc-50">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-200 p-8 flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900">Account Activated!</h2>
            </div>
            <div className="p-8 text-center">
              <p className="text-zinc-600 leading-relaxed mb-2">Your account has been successfully created.</p>
              <p className="text-zinc-500 text-sm">Redirecting to your dashboard...</p>
              <div className="mt-6 w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Valid: Show Activation Form ────────────────────────────────────
  return (
    <div className="flex w-full min-h-screen font-outfit">
      {/* LEFT SIDE: Branding */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-zinc-950 p-12 flex-col justify-between">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-600/30 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
              <Activity size={20} strokeWidth={3} />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">ChurnSense</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-emerald-400 text-xs font-bold mb-6 backdrop-blur-sm">
            <ShieldCheck size={14} />
            Invitation Accepted
          </div>
          <h1 className="text-5xl font-black text-white leading-[1.1] mb-6">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-brand-400">ChurnSense.</span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-md">
            You've been invited to join the platform. Set up your account to access real-time AI insights and customer analytics.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-zinc-500 text-xs font-semibold">
          <p>&copy; 2026 ChurnSense Inc.</p>
        </div>
      </div>

      {/* RIGHT SIDE: Activation Form */}
      <div className="flex-1 flex flex-col justify-center bg-white relative">
        <Link to="/" className="absolute top-8 left-8 lg:hidden flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="w-full max-w-md mx-auto px-8 sm:px-12 py-12">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
              <Activity size={20} strokeWidth={3} />
            </div>
            <span className="text-2xl font-black tracking-tight text-zinc-900">ChurnSense</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Activate your account</h2>
            <p className="mt-2 text-zinc-500 font-medium">
              Set up your credentials to complete registration.
            </p>
          </div>

          {/* Invitation Info Badge */}
          <div className="mb-6 p-4 bg-brand-50 border border-brand-200/60 rounded-xl flex items-start gap-3">
            <div className="bg-brand-100 p-1 rounded-full shrink-0 mt-0.5">
              <ShieldCheck size={14} className="text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-800">Invited by {invitedBy}</p>
              <p className="text-xs text-brand-600 mt-0.5">Account will be created for <strong>{invitationEmail}</strong></p>
            </div>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200/60 rounded-xl flex items-start gap-3 animate-fade-in">
              <div className="bg-rose-100 p-1 rounded-full shrink-0 mt-0.5">
                <AlertTriangle size={14} className="text-rose-600" />
              </div>
              <p className="text-sm font-semibold text-rose-800 leading-snug">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Email Address</label>
              <input
                type="email"
                value={invitationEmail}
                disabled
                className="appearance-none block w-full px-4 py-3.5 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-500 font-medium cursor-not-allowed"
              />
            </div>

            {/* Full Name */}
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

            {/* Password */}
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
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors z-10 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="text-[11px] space-y-1 mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  {[
                    { valid: valLength, label: 'Min 8 characters' },
                    { valid: valUpper, label: '1 Uppercase letter' },
                    { valid: valLower, label: '1 Lowercase letter' },
                    { valid: valNum, label: '1 Number' },
                    { valid: valSpec, label: '1 Special character' },
                  ].map((rule, i) => (
                    <div key={i} className={`flex items-center gap-1.5 ${rule.valid ? 'text-emerald-600 font-medium' : 'text-zinc-500'}`}>
                      {rule.valid ? <CheckCircle size={12} /> : <XCircle size={12} />} {rule.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`appearance-none block w-full px-4 py-3.5 bg-zinc-50 border rounded-xl placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white text-zinc-900 font-medium transition-all pr-12 ${
                    confirmPassword.length > 0
                      ? passwordsMatch ? 'border-emerald-300' : 'border-rose-300'
                      : 'border-zinc-200'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors z-10 cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-rose-500 mt-1.5 font-medium">Passwords do not match</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !isPasswordValid || !passwordsMatch || name.trim().length < 2}
                className="group w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-zinc-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Activating Account...' : 'Activate Account'}
                {!loading && <ArrowRight size={16} className="opacity-70 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-zinc-500">
                Already have an account? <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 transition-colors">Sign In</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
