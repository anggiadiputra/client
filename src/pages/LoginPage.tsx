import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Eye, EyeOff, Send } from 'lucide-react';
import authService from '../lib/authService';
import { authClient, clearAllSessions } from '../lib/stackAuth';
import Navbar from '../components/Navbar';
import GoogleIcon from '../components/GoogleIcon';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAppSettings } from '../context/AppContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showOtpOption, setShowOtpOption] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { turnstileSiteKey } = useAppSettings();

  // For Neon Auth users who have no local password, send OTP instead
  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setSendingOtp(true);
    setError('');
    try {
      const { error: otpError } = await authClient.emailOtp.sendVerificationCode({ email });
      if (otpError) throw new Error(otpError.message || 'Failed to send OTP');

      sessionStorage.setItem('pending_verification_email', email);
      setSuccess('Verification code sent! Redirecting...');
      setTimeout(() => navigate('/verify-email'), 800);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      setError('Please complete the security verification.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    setShowOtpOption(false);
    try {
      await authService.login(email, password, turnstileToken);
      setSuccess('Signed in successfully!');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      
      // Detect Neon-Auth-only users who have no local password
      if (errorMsg.includes('Neon Auth')) {
        setShowOtpOption(true);
        setError('Akun ini didaftarkan via Neon Auth. Gunakan kode OTP untuk login.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <Navbar onLoginClick={() => { }} onGetStartedClick={() => navigate('/register')} />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[440px] bg-surface rounded-2xl shadow-sm border border-separator px-10 py-10">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-tx-main mb-1.5">Welcome back</h1>
            <p className="text-sm text-tx-muted">Sign in to your account to continue</p>
          </div>

          <div className="mb-6">
            <button 
              type="button"
              className="flex items-center justify-center gap-3 w-full px-4 py-2.5 bg-surface border border-separator rounded-lg text-sm font-semibold text-tx-muted hover:bg-surface-2 transition-colors shadow-sm cursor-not-allowed opacity-70"
              title="Google login is currently for decoration only"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
            <div className="relative mt-6 mb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-separator"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-2 text-tx-subtle">Or continue with email</span>
              </div>
            </div>
          </div>


          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-tx-muted mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-subtle" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-separator rounded-lg text-sm text-tx-main placeholder:text-tx-subtle focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-tx-muted">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tx-subtle hover:text-tx-muted transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 pr-10 py-2.5 border border-separator rounded-lg text-sm text-tx-main placeholder:text-tx-subtle focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
            
            {turnstileSiteKey && (
              <div className="flex justify-center -mb-1 scale-90 sm:scale-100 origin-center">
                <Turnstile 
                  siteKey={turnstileSiteKey} 
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => {
                    setError('Security verification failed. Please refresh.');
                    setTurnstileToken(null);
                  }}
                  onExpire={() => setTurnstileToken(null)}
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-green-600 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            {/* OTP fallback button for Neon Auth users without a local password */}
            {showOtpOption && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                <Send size={14} />
                {sendingOtp ? 'Sending OTP...' : 'Login via OTP (Email Verification)'}
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-1"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-tx-muted mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-blue-600 font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
