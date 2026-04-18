import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient, useUser } from '../lib/stackAuth';
import Navbar from '../components/Navbar';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * StackSignUpPage.tsx
 * 
 * Halaman register dengan style yang disamakan dengan halaman login (Shadcn style).
 * Menggunakan implementasi manual untuk kontrol redirect OTP.
 */
export default function StackSignUpPage() {
  const navigate = useNavigate();
  const user = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Redirect jika sudah login
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        callbackURL: `${window.location.origin}/login`,
      });

      if (signUpError) {
        throw new Error(signUpError.message || 'Gagal melakukan pendaftaran');
      }

      // Simpan email untuk digunakan di halaman verifikasi kustom
      sessionStorage.setItem('pending_verification_email', formData.email);
      
      // Redirect ke halaman verifikasi
      navigate('/verify-email');
      
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col font-sans">
      <Navbar 
        onLoginClick={() => navigate('/login')} 
        onGetStartedClick={() => {}} 
        showRegister={false}
      />
      
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="mx-auto w-full max-w-sm">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 text-center">
              <h1 className="text-2xl font-semibold leading-none tracking-tight">Create Account</h1>
              <p className="text-sm text-muted-foreground mt-2">Enter your details to register</p>
            </div>

            <div className="p-6 pt-0">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md flex items-start gap-2 text-sm font-medium border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    disabled={loading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    disabled={loading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 8 characters"
                    disabled={loading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-blue-600 text-white shadow-xs hover:bg-blue-700 h-9 px-4 py-2 w-full mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Register"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-blue-600 hover:underline underline-offset-4">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
