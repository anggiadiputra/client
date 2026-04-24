import { useState, useEffect } from 'react';
import { 
  Crown, Plus, Edit2, Trash2, X, Loader2, 
  CheckCircle2, Tag, FileText, Users
} from 'lucide-react';
import { plansAPI } from '../lib/api';
import { Plan } from '../types';
import { toast } from '../components/Toast';
import KeyboardShortcutWrapper from '../components/KeyboardShortcutWrapper';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    price_monthly: '',
    max_invoices: 10,
    max_customers: 50,
    features_list: ''
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await plansAPI.getAll();
      setPlans(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setSelectedPlan(null);
    setFormData({
      slug: '',
      name: '',
      description: '',
      price_monthly: '0',
      max_invoices: 10,
      max_customers: 50,
      features_list: ''
    });
    setShowModal(true);
  };

  const handleEdit = (plan: Plan) => {
    setModalMode('edit');
    setSelectedPlan(plan);
    setFormData({
      slug: plan.slug,
      name: plan.name,
      description: plan.description || '',
      price_monthly: String(plan.price_monthly),
      max_invoices: plan.max_invoices || 0,
      max_customers: plan.max_customers || 0,
      features_list: Array.isArray(plan.features?.display_features) 
        ? plan.features.display_features.join('\n') 
        : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await plansAPI.delete(id);
      toast.success('Plan deleted successfully');
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete plan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        features: {
          ...selectedPlan?.features,
          display_features: formData.features_list.split('\n').map(f => f.trim()).filter(Boolean)
        }
      };

      if (modalMode === 'create') {
        await plansAPI.create(payload);
        toast.success('Plan created successfully');
      } else if (selectedPlan) {
        await plansAPI.update(selectedPlan.id, payload);
        toast.success('Plan updated successfully');
      }
      setShowModal(false);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Kelola Paket Langganan</h1>
          <p className="text-sm text-gray-500">Kelola paket langganan dan harga untuk pengguna</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shrink-0"
        >
          <Plus size={16} />
          Buat Paket Baru
        </button>
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="w-12 h-12 bg-gray-100 rounded-lg mb-4"></div>
              <div className="h-5 bg-gray-100 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-6"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
          ))
        ) : plans.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-lg border border-gray-200">
            <Tag size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500">Belum ada paket langganan.</p>
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg ${plan.slug === 'free' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'}`}>
                    {plan.slug === 'free' ? <CheckCircle2 size={24} /> : <Crown size={24} />}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(plan)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(plan.id)}
                      disabled={plan.slug === 'free'}
                      className={`p-1.5 rounded-lg transition-colors ${plan.slug === 'free' ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <code className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono mb-3 inline-block uppercase">
                  {plan.slug}
                </code>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                  {plan.description || 'Tidak ada deskripsi.'}
                </p>
                <div className="flex items-baseline gap-1 mt-auto">
                  <span className="text-xl font-bold text-gray-900">
                    Rp {parseFloat(String(plan.price_monthly)).toLocaleString('id-ID')}
                  </span>
                  <span className="text-gray-400 text-xs text-[10px]">/ bulan</span>
                </div>

                {/* Plan Specifications Section */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FileText size={14} className="text-blue-500" />
                    <span>Max <b>{plan.max_invoices === -1 ? 'Unlimited' : plan.max_invoices}</b> Invoices</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Users size={14} className="text-blue-500" />
                    <span>Max <b>{plan.max_customers === -1 ? 'Unlimited' : plan.max_customers}</b> Customers</span>
                  </div>
                  
                  {Array.isArray(plan.features?.display_features) && plan.features.display_features.length > 0 && (
                    <div className="pt-2 space-y-2">
                       {plan.features.display_features.map((feature: string, idx: number) => (
                         <div key={idx} className="flex items-center gap-2 text-[11px] text-gray-500">
                           <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                           <span>{feature}</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Plan</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal CRUD */}
      {showModal && (
        <KeyboardShortcutWrapper onClose={() => setShowModal(false)} disabled={saving}>
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full my-8 overflow-hidden border border-gray-200 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {modalMode === 'edit' ? 'Edit Paket' : 'Buat Paket Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Paket</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Contoh: Starter"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Slug (ID Unik)</label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'edit' && selectedPlan?.slug === 'free'}
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                    placeholder="Contoh: pro-plus"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Harga Bulanan (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rp</span>
                  <input
                    type="number"
                    required
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Jelaskan fitur utama paket ini..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Maks. Invoices</label>
                  <input
                    type="number"
                    required
                    value={formData.max_invoices}
                    onChange={(e) => setFormData({ ...formData, max_invoices: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="10"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">-1 untuk Unlimited</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Maks. Customers</label>
                  <input
                    type="number"
                    required
                    value={formData.max_customers}
                    onChange={(e) => setFormData({ ...formData, max_customers: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="50"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">-1 untuk Unlimited</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Daftar Fitur (Per Baris)</label>
                <textarea
                  rows={4}
                  value={formData.features_list}
                  onChange={(e) => setFormData({ ...formData, features_list: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder={"Hingga 10 invoices\nHingga 50 customers\nTemplate Standar"}
                />
                <p className="text-[10px] text-gray-400 mt-1">Masukkan satu fitur per baris untuk ditampilkan di kartu paket.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  {modalMode === 'edit' ? 'Simpan Perubahan' : 'Buat Paket'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-6 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </KeyboardShortcutWrapper>
      )}
    </div>
  );
}
