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

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col font-sans">
      <Navbar 
        onLoginClick={() => navigate('/login')} 
        onGetStartedClick={() => navigate('/register')} 
      />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-700">
            <Zap size={14} />
            <span>Smart Invoicing Solution</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Kelola Bisnis Lebih <br /> 
            <span className="text-blue-600">Efektif & Profesional</span>
          </h1>
          
          <p className="text-base text-gray-500 max-w-xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Platform pembuatan invoice, manajemen pelanggan, dan pelacakan transaksi yang dirancang untuk kecepatan dan kemudahan penggunaan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <button 
              onClick={() => navigate('/register')}
              className="group flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Coba Gratis Sekarang
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
            >
              Masuk ke Akun
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 animate-in fade-in zoom-in duration-1000 delay-500">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group text-left">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Invoice Instan</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Buat invoice profesional dalam hitungan detik dengan template yang sudah disediakan.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group text-left">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                <Shield size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Keamanan Terjamin</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Data Anda tersimpan dengan enkripsi tingkat tinggi dan sistem backup otomatis.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group text-left">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                <CreditCard size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Multi-Pembayaran</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Mendukung berbagai metode pembayaran untuk memudahkan pelanggan Anda membayar.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <span className="text-sm font-black text-gray-900">{settings.appName}</span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} {settings.appName}. Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-gray-500 hover:text-blue-600 transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="text-xs text-gray-500 hover:text-blue-600 transition-colors">Kebijakan Privasi</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
