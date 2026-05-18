import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Navbar from '../components/Navbar';
import authService from '../lib/authService';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAppSettings } from '../context/AppContext';

export default function StackForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { turnstileSiteKey } = useAppSettings();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
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
      const result = await authService.forgotPassword(email, turnstileToken);
      
      setSuccess(result.message || 'If an account exists, a reset link has been sent to your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <Navbar onLoginClick={() => navigate('/login')} onGetStartedClick={() => navigate('/register')} />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[440px] bg-surface rounded-2xl shadow-sm border border-separator px-10 py-10">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-tx-main mb-1.5">Reset your password</h1>
            <p className="text-sm text-tx-muted">Enter your email and we'll send you a reset link</p>
          </div>

          <form onSubmit={handleReset} className="flex flex-col gap-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-1"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <p className="text-center text-sm text-tx-muted mt-6">
            Remember your password?{' '}
            <Link
              to="/login"
              className="text-blue-600 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
