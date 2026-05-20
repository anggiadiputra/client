import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Shield, Zap, CheckCircle2, 
  ArrowRight, CreditCard, Users, LayoutDashboard
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAppSettings } from '../context/AppContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { settings } = useAppSettings();

  useEffect(() => {
    // Handle hash navigation on initial load (e.g. from /login)
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      // Small timeout to ensure elements are rendered
      setTimeout(() => scrollToSection(hash), 100);
    }
  }, []);

  const scrollToSection = (id: string) => {
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-base flex flex-col font-sans">
      <Navbar 
        onLoginClick={() => navigate('/login')} 
        onGetStartedClick={() => navigate('/register')} 
        onSectionClick={scrollToSection}
      />

      {/* Hero Section */}
      <main id="home" className="flex-1 flex flex-col items-center justify-center px-4 py-20 bg-surface">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-700">
            <Zap size={12} fill="currentColor" />
            <span>Smart Invoicing Solution</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-tx-main leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Kelola Bisnis Lebih <br /> 
            <span className="text-blue-600">Efektif & Profesional</span>
          </h1>
          
          <p className="text-base text-tx-muted max-w-xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Platform pembuatan invoice, manajemen pelanggan, dan pelacakan transaksi yang dirancang untuk kecepatan dan kemudahan penggunaan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <button 
              onClick={() => navigate('/register')}
              className="group flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 dark:shadow-blue-900/40"
            >
              Coba Gratis Sekarang
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 bg-surface text-tx-muted border border-separator rounded-xl font-bold text-sm hover:bg-surface-2 transition-all shadow-sm dark:shadow-none"
            >
              Masuk ke Akun
            </button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-base">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-tx-main mb-4">Fitur Utama</h2>
            <p className="text-tx-muted text-sm max-w-lg mx-auto leading-relaxed">
              Segala yang Anda butuhkan untuk mengelola keuangan bisnis dalam satu dashboard yang intuitif.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface p-8 rounded-2xl border border-separator shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-tx-main mb-3">Invoice Instan</h3>
              <p className="text-sm text-tx-muted leading-relaxed">Buat invoice profesional dalam hitungan detik dengan template yang sudah disediakan.</p>
            </div>

            <div className="bg-surface p-8 rounded-2xl border border-separator shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-bold text-tx-main mb-3">Keamanan Terjamin</h3>
              <p className="text-sm text-tx-muted leading-relaxed">Data Anda tersimpan dengan enkripsi tingkat tinggi dan sistem backup otomatis.</p>
            </div>

            <div className="bg-surface p-8 rounded-2xl border border-separator shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                <CreditCard size={24} />
              </div>
              <h3 className="text-lg font-bold text-tx-main mb-3">Multi-Pembayaran</h3>
              <p className="text-sm text-tx-muted leading-relaxed">Mendukung berbagai metode pembayaran untuk memudahkan pelanggan Anda membayar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - SumoPod Style */}
      <section id="pricing" className="py-24 px-4 bg-surface">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-tx-main mb-4">Simple, Transparent Pricing</h2>
          <p className="text-tx-muted text-sm max-w-xl mx-auto mb-16 leading-relaxed">
            Get started with {settings.appName} today and experience the power of 
            professional financial management for your business.
          </p>

          <div className="max-w-md mx-auto">
            <div className="bg-surface rounded-3xl border-2 border-blue-500 p-10 shadow-2xl shadow-blue-100 dark:shadow-blue-900/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <CheckCircle2 className="text-blue-500 opacity-10" size={80} />
              </div>
              
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-tx-main mb-2">Start Today</h3>
                <div className="text-6xl font-black text-blue-600 mb-6">FREE</div>
                
                <p className="text-sm text-tx-muted mb-8 leading-relaxed px-4">
                  All the features you need to manage your invoices and 
                  customers effectively without any hidden costs.
                </p>

                <div className="space-y-4">
                  <button 
                    onClick={() => navigate('/register')}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-blue-900/40"
                  >
                    Get Started
                  </button>
                  <button 
                    onClick={() => scrollToSection('templates')}
                    className="w-full py-4 bg-surface text-tx-muted border border-separator rounded-xl font-bold text-sm hover:bg-surface-2 transition-all"
                  >
                    See App Templates
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section Placeholder */}
      <section id="templates" className="py-24 px-4 bg-base">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-black text-tx-main mb-4">Profesional Templates</h2>
          <p className="text-tx-muted text-sm max-w-lg mx-auto mb-12 leading-relaxed">
            Pilih dari berbagai desain kwitansi dan invoice yang siap pakai untuk meningkatkan citra brand Anda.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[1,2,3,4].map(i => (
               <div key={i} className="aspect-[3/4] bg-surface-2 rounded-xl border border-dashed border-separator flex items-center justify-center text-tx-subtle text-xs font-medium italic">
                 Template Preview {i}
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-separator bg-surface">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <span className="text-sm font-black text-tx-main">{settings.appName}</span>
          </div>
          <p className="text-xs text-tx-subtle">
            &copy; {new Date().getFullYear()} {settings.appName}. Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-tx-muted hover:text-blue-600 transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="text-xs text-tx-muted hover:text-blue-600 transition-colors">Kebijakan Privasi</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
