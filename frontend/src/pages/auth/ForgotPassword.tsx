import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Mail, KeyRound, ShieldCheck, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password validation
  const valLength = newPassword.length >= 8;
  const valUpper = /[A-Z]/.test(newPassword);
  const valLower = /[a-z]/.test(newPassword);
  const valNum = /\d/.test(newPassword);
  const valSpec = /[^A-Za-z0-9\s]/.test(newPassword);
  const isPasswordValid = valLength && valUpper && valLower && valNum && valSpec;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Focus first OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp') {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.data.message);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp: otpCode });
      setSuccess('OTP verified! Now set your new password.');
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not meet the requirements.');
      return;
    }

    setLoading(true);
    try {
      const otpCode = otp.join('');
      const res = await api.post('/auth/reset-password', { email, otp: otpCode, new_password: newPassword });
      setSuccess(res.data.message);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const stepConfig = {
    email: {
      icon: <Mail size={24} />,
      title: 'Forgot your password?',
      subtitle: 'Enter your email address and we\'ll send you a verification code.',
    },
    otp: {
      icon: <KeyRound size={24} />,
      title: 'Enter verification code',
      subtitle: `We've sent a 6-digit code to ${email}. Check your inbox.`,
    },
    reset: {
      icon: <ShieldCheck size={24} />,
      title: 'Set new password',
      subtitle: 'Create a strong password for your account.',
    },
  };

  const currentStep = stepConfig[step];

  return (
    <div className="flex w-full min-h-screen font-outfit">
      {/* LEFT SIDE: Branding */}
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
            Account <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">recovery.</span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-md">
            Don't worry — we'll help you get back into your workspace securely with a one-time verification code.
          </p>

          {/* Progress Steps */}
          <div className="mt-12 flex items-center gap-4">
            {(['email', 'otp', 'reset'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                  step === s 
                    ? 'bg-brand-600 border-brand-500 text-white scale-110' 
                    : (['email', 'otp', 'reset'].indexOf(step) > i)
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                }`}>
                  {(['email', 'otp', 'reset'].indexOf(step) > i) ? <CheckCircle size={18} /> : i + 1}
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 transition-all duration-300 ${
                    (['email', 'otp', 'reset'].indexOf(step) > i) ? 'bg-emerald-600' : 'bg-zinc-800'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs text-zinc-500 font-semibold">
            <span>Email</span>
            <span>Verify</span>
            <span>Reset</span>
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

      {/* RIGHT SIDE: Form */}
      <div className="flex-1 flex flex-col justify-center bg-white relative">
        <Link to="/login" className="absolute top-8 left-8 flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div className="w-full max-w-md mx-auto px-8 sm:px-12 py-12">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/logo keren.jpeg" alt="ChurnSense Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-brand-500/20" />
            <span className="text-2xl font-black tracking-tight text-zinc-900">ChurnSense</span>
          </div>

          {/* Header */}
          <div className="mb-10">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-5">
              {currentStep.icon}
            </div>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{currentStep.title}</h2>
            <p className="mt-2 text-zinc-500 font-medium text-sm leading-relaxed">{currentStep.subtitle}</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200/60 rounded-xl flex items-start gap-3 animate-fade-in">
              <div className="bg-rose-100 p-1 rounded-full shrink-0 mt-0.5">
                <XCircle size={14} className="text-rose-600" />
              </div>
              <p className="text-sm font-semibold text-rose-800 leading-snug">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200/60 rounded-xl flex items-start gap-3 animate-fade-in">
              <div className="bg-emerald-100 p-1 rounded-full shrink-0 mt-0.5">
                <CheckCircle size={14} className="text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-emerald-800 leading-snug">{success}</p>
            </div>
          )}

          {/* STEP 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleRequestOTP} className="space-y-6">
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
              <button
                type="submit"
                disabled={loading || !email}
                className="group w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-zinc-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-4">Verification Code</label>
                <div className="flex items-center justify-between gap-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-14 h-14 text-center text-2xl font-black bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white text-zinc-900 transition-all"
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="group w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-zinc-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : 'Verify Code'}
              </button>
              <button
                type="button"
                onClick={() => { setOtp(['', '', '', '', '', '']); setError(''); handleRequestOTP({ preventDefault: () => {} } as React.FormEvent); }}
                className="w-full text-center text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                Didn't receive a code? Resend
              </button>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white text-zinc-900 font-medium transition-all pr-12"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors z-10 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`appearance-none block w-full px-4 py-3.5 bg-zinc-50 border rounded-xl placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white text-zinc-900 font-medium transition-all ${
                    confirmPassword && !passwordsMatch ? 'border-rose-300' : 'border-zinc-200'
                  }`}
                  placeholder="Confirm new password"
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-rose-500 font-semibold mt-1.5">Passwords do not match.</p>
                )}
              </div>

              {/* Password Requirements */}
              {newPassword.length > 0 && (
                <div className="text-[11px] flex flex-wrap gap-x-4 gap-y-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
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

              <button
                type="submit"
                disabled={loading || !isPasswordValid || !passwordsMatch}
                className="group w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-zinc-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
