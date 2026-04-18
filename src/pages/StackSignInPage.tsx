/**
 * StackSignInPage.tsx
 * 
 * Halaman login menggunakan AuthView Neon Auth dengan perbaikan layout
 * untuk menghilangkan "white space" berlebih.
 */
import { AuthView } from '@neondatabase/auth/react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../lib/stackAuth';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function StackSignInPage() {
  const navigate = useNavigate();
  const user = useUser();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      <Navbar 
        onLoginClick={() => {}} 
        onGetStartedClick={() => navigate('/register')}
        showLogin={false}
      />
      
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm login-container">
          {/* CSS Fix untuk menghilangkan kolom kosong di SDK AuthView */}
          <style dangerouslySetInnerHTML={{ __html: `
            .login-container div[class*="lg:grid-cols-2"] {
                grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
            }
            .login-container div[class*="bg-muted"] {
                display: none !important;
            }
            /* Menyesuaikan warna tombol agar konsisten dengan brand Biru */
            .login-container button[class*="bg-primary"] {
                background-color: #2563eb !important; 
            }
            .login-container button[class*="bg-primary"]:hover {
                background-color: #1d4ed8 !important;
            }
          `}} />
          <AuthView pathname="sign-in" />
        </div>
      </div>
    </div>
  );
}
