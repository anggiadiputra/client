import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Eye, EyeOff } from 'lucide-react';
import authService from '../lib/authService';
import Navbar from '../components/Navbar';
import GoogleIcon from '../components/GoogleIcon';
import { getNeonLoginUrl } from '../lib/stackAuth';
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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { turnstileSiteKey } = useAppSettings();

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
    try {
      await authService.login(email, password, turnstileToken);
      setSuccess('Signed in successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      // Reload the page so App.tsx checks authentication status
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      <Navbar onLoginClick={() => { }} onGetStartedClick={() => navigate('/register')} />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-sm border border-gray-100 px-10 py-10">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Welcome back</h1>
            <p className="text-sm text-gray-500">Sign in to your account to continue</p>
          </div>


          {/* Google OAuth (legacy/placeholder) */}
          <button
            type="button"
            onClick={() => window.location.href = getNeonLoginUrl('/dashboard')}
            className="w-full flex items-center justify-center gap-2.5 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5"
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 whitespace-nowrap">Or continue with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-1"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
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
