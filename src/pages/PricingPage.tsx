import { useEffect, useState } from 'react';
import { Check, X, Zap, Crown, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { plansAPI } from '../lib/api';
import { useAppSettings } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { subscription, wallet, refreshSaaSData, userRole } = useAppSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (userRole === 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await plansAPI.getAll();
        setPlans(data);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleUpgrade = async (plan: any) => {
    if (subscription?.plan?.slug === plan.slug) return;
    
    // Check balance
    if (parseFloat(wallet?.balance || 0) < parseFloat(plan.price_monthly)) {
      if (confirm('Saldo Anda tidak mencukupi. Ingin ke halaman Billing untuk Top-up?')) {
        navigate('/billing');
      }
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin upgrade ke paket ${plan.name} seharga Rp ${parseFloat(plan.price_monthly).toLocaleString('id-ID')}?`)) {
      return;
    }

    setProcessingId(plan.id);
    try {
      await plansAPI.upgrade(plan.id);
      await refreshSaaSData();
      alert(`Selamat! Akun Anda telah berhasil diupgrade ke paket ${plan.name}.`);
    } catch (error: any) {
      alert(error.message || 'Gagal melakukan upgrade');
    } finally {
      setProcessingId(null);
    }
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'free': return <ShieldCheck className="text-gray-400" size={24} />;
      case 'starter': return <Zap className="text-blue-500" size={24} />;
      case 'pro': return <Crown className="text-amber-500" size={24} />;
      default: return <Zap className="text-blue-500" size={24} />;
    }
  };

  const getPlanFeatures = (plan: any) => {
    if (plan.slug === 'free') {
      return [
        { label: 'Hingga 10 Invoice', included: true },
        { label: 'Hingga 50 Customer', included: true },
        { label: 'Template Standar', included: true },
        { label: 'Email Notifikasi', included: false },
        { label: 'WhatsApp Notifikasi', included: false },
      ];
    } else if (plan.slug === 'starter') {
      return [
        { label: 'Hingga 100 Invoice', included: true },
        { label: 'Hingga 500 Customer', included: true },
        { label: 'Semua Template', included: true },
        { label: 'Email Notifikasi', included: true },
        { label: 'WhatsApp Notifikasi', included: false },
      ];
    } else {
      return [
        { label: 'Invoice Tak Terbatas', included: true },
        { label: 'Customer Tak Terbatas', included: true },
        { label: 'Semua Template', included: true },
        { label: 'Email Notifikasi', included: true },
        { label: 'WhatsApp Notifikasi', included: true },
      ];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Pilih Paket yang Sesuai untuk Bisnis Anda
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tingkatkan produktivitas dengan fitur-fitur premium. Kelola invoice lebih profesional dan otomatis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = subscription?.plan?.slug === plan.slug;
          const features = getPlanFeatures(plan);
          
          return (
            <div 
              key={plan.id}
              className={`relative flex flex-col p-8 bg-white rounded-2xl shadow-sm border ${
                isCurrent ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
              } transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
            >
              {isCurrent && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow-lg">
                  Paket Aktif
                </div>
              )}

              <div className="mb-6">
                <div className="p-3 bg-gray-50 rounded-xl inline-block mb-4">
                  {getPlanIcon(plan.slug)}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-900">
                    Rp {parseFloat(plan.price_monthly).toLocaleString('id-ID')}
                  </span>
                  <span className="text-gray-500 text-sm">/ bulan</span>
                </div>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="bg-green-100 p-0.5 rounded">
                        <Check size={14} className="text-green-600" />
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-0.5 rounded">
                        <X size={14} className="text-gray-400" />
                      </div>
                    )}
                    <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={isCurrent || processingId !== null}
                className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  isCurrent 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : plan.slug === 'pro'
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                      : 'bg-white text-gray-800 border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600'
                }`}
              >
                {processingId === plan.id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isCurrent ? (
                  'Sedang Digunakan'
                ) : (
                  <>
                    {plan.slug === 'free' ? 'Kembali ke Gratis' : 'Pilih Paket'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-16 bg-gray-50 rounded-2xl p-8 border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Butuh bantuan memilih?</h3>
          <p className="text-gray-600">Tim kami siap membantu Anda menemukan paket yang paling efisien untuk skala bisnis Anda saat ini.</p>
        </div>
        <button className="whitespace-nowrap px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
          Hubungi Sales
        </button>
      </div>
    </div>
  );
}
