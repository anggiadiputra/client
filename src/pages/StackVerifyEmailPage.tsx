import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/stackAuth';
import Navbar from '../components/Navbar';
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '../lib/ToastContext';

export default function StackVerifyEmailPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  
  const email = sessionStorage.getItem('pending_verification_email');

  useEffect(() => {
    if (!email && !isVerified) {
      navigate('/register');
    }
  }, [email, isVerified, navigate]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      
      const lastIndex = Math.min(index + pastedData.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({
        email: email || '',
        otp: otpValue,
      });

      if (verifyError) {
        throw new Error(verifyError.message || 'Invalid or expired verification code');
      }

      addToast('success', 'Email verified successfully!');
      setIsVerified(true);
      sessionStorage.removeItem('pending_verification_email');
      // Wait for Neon Auth session to properly settle before redirecting.
      // A direct window.location.href causes a race condition where the page
      // reloads before the session cookie/state is fully written.
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error verifying code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const { error: resendError } = await authClient.emailOtp.sendVerificationCode({
        email: email || '',
      });

      if (resendError) {
        throw new Error(resendError.message || 'Failed to resend code');
      }

      addToast('success', 'A new code has been sent to your email');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (otp.join('').length === 6 && !loading) {
      handleSubmit();
    }
  }, [otp]);

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <Navbar onLoginClick={() => navigate('/login')} onGetStartedClick={() => navigate('/register')} />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[440px] bg-surface rounded-2xl shadow-sm border border-separator px-10 py-10">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-tx-main mb-1.5">Verify your email</h1>
            <p className="text-sm text-tx-muted">
              We've sent a 6-digit code to <br />
              <span className="font-semibold text-tx-main break-all">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  className="w-12 h-14 text-center text-xl font-medium bg-surface border border-separator rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-tx-main"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Email'}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={handleResend}
              disabled={resending || loading}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2"
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Resend verification code
            </button>
            <Link
              to="/register"
              className="text-sm font-medium text-tx-muted hover:text-tx-muted transition-colors flex items-center gap-1 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Back to Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
