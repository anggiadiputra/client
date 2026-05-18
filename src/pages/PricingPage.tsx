import { useEffect, useState } from 'react';
import { Check, X, Zap, Crown, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { plansAPI } from '../lib/api';
import { useAppSettings } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from '../components/Toast';
import { SkeletonStatsCards } from '../components/LoadingSkeleton';

interface ConfirmConfig {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
  type: 'info' | 'warning' | 'danger' | 'success';
}

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

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
      setConfirmConfig({
        isOpen: true,
        title: 'Saldo Tidak Mencukupi',
        message: 'Saldo Anda tidak mencukupi untuk paket ini. Ingin ke halaman Billing untuk Top-up?',
        confirmLabel: 'Top-up Sekarang',
        type: 'info',
        onConfirm: () => {
          setConfirmConfig((prev: ConfirmConfig) => ({ ...prev, isOpen: false }));
          navigate('/billing');
        }
      });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Konfirmasi Upgrade',
      message: `Apakah Anda yakin ingin upgrade ke paket ${plan.name} seharga Rp ${parseFloat(plan.price_monthly).toLocaleString('id-ID')}? Biaya akan langsung dipotong dari saldo wallet Anda.`,
      confirmLabel: 'Ya, Upgrade',
      type: 'warning',
      onConfirm: async () => {
        setConfirmConfig((prev: ConfirmConfig) => ({ ...prev, isOpen: false }));
        setProcessingId(plan.id);
        try {
          await plansAPI.upgrade(plan.id);
          await refreshSaaSData();
          toast.success(`Selamat! Akun Anda telah berhasil diupgrade ke paket ${plan.name}.`);
        } catch (error: any) {
          toast.error(error.message || 'Gagal melakukan upgrade');
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'free': return <ShieldCheck className="text-tx-subtle" size={24} />;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <div className="h-8 bg-surface-2 animate-pulse rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-surface-2 animate-pulse rounded w-1/2"></div>
        </div>
        <SkeletonStatsCards count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-tx-main mb-1">Pilihan Paket Langganan</h1>
        <p className="text-sm text-tx-muted">Pilih paket yang sesuai untuk mengelola bisnis Anda dengan efisien.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = subscription?.plan?.slug === plan.slug;
          const features = getPlanFeatures(plan);
          
          return (
            <div 
              key={plan.id}
              className={`relative flex flex-col p-6 bg-surface rounded-lg shadow-sm border ${
                isCurrent ? 'border-blue-500 ring-1 ring-blue-500' : 'border-separator'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm">
                  Paket Aktif
                </div>
              )}

              <div className="mb-5">
                <div className="p-2 bg-surface-2 rounded-lg inline-block mb-3 border border-separator">
                  {getPlanIcon(plan.slug)}
                </div>
                <h3 className="text-lg font-bold text-tx-main">{plan.name}</h3>
                <p className="text-xs text-tx-muted mt-1">{plan.description}</p>
              </div>

              <div className="mb-6 pb-6 border-b border-separator">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-tx-main">
                    Rp {parseFloat(plan.price_monthly).toLocaleString('id-ID')}
                  </span>
                  <span className="text-tx-muted text-xs font-medium">/ bulan</span>
                </div>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="flex items-center justify-center w-5 h-5 bg-green-500/10 rounded text-green-600">
                        <Check size={12} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-5 h-5 bg-surface-2 rounded text-tx-subtle">
                        <X size={12} />
                      </div>
                    )}
                    <span className={`text-sm ${feature.included ? 'text-tx-muted font-medium' : 'text-tx-subtle line-through'}`}>
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={isCurrent || processingId !== null}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                  isCurrent 
                    ? 'bg-surface-2 text-tx-subtle border border-separator cursor-not-allowed'
                    : plan.slug === 'pro'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-surface text-tx-muted border border-separator hover:bg-surface-2'
                }`}
              >
                {processingId === plan.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isCurrent ? (
                  'Sedang Digunakan'
                ) : (
                  <>
                    {plan.slug === 'free' ? 'Kembali ke Gratis' : 'Pilih Paket'}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-surface-2 rounded-lg p-6 border border-separator flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-tx-main mb-1">Butuh bantuan memilih paket?</h3>
          <p className="text-xs text-tx-muted">Tim kami siap membantu Anda menemukan solusi yang tepat untuk skala bisnis Anda.</p>
        </div>
        <button className="px-6 py-2 bg-surface border border-separator text-tx-muted rounded-lg font-semibold text-sm hover:bg-surface-2 transition-colors">
          Hubungi Sales
        </button>
      </div>

      <ConfirmDialog
        {...confirmConfig}
        onCancel={() => setConfirmConfig((prev: ConfirmConfig) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
