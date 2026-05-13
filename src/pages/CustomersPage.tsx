import { useEffect, useState, useCallback } from 'react';
import { Trash2, Edit2, Plus, Eye, X, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight, Search, Phone, MapPin, Mail } from 'lucide-react';
import { customersAPI, whatsappAPI } from '../lib/api';
import { toTitleCase } from '../lib/formatter';
import RegionSelect from '../components/RegionSelect';
import { SkeletonTable } from '../components/LoadingSkeleton';
import KeyboardShortcutWrapper from '../components/KeyboardShortcutWrapper';
import DropdownFilter from '../components/DropdownFilter';
import CompactBatchActions from '../components/CompactBatchActions';
import { CheckSquare, Square } from 'lucide-react';

import { Customer } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from '../components/Toast';

interface ConfirmConfig {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
  type: 'info' | 'warning' | 'danger' | 'success';
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Pagination & Layout states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const LIMIT = 15;

  // WhatsApp validation states
  const [validatingPhone, setValidatingPhone] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<{
    isRegistered: boolean;
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    postal_code: '',
    country: 'Indonesia',
    province_id: '',
    regency_id: '',
    district_id: '',
    village_id: '',
    province_name: '',
    regency_name: '',
    district_name: '',
    village_name: '',
    status: 'active',
  });

  const fetchCustomers = useCallback(async (currentPage = page, search = searchTerm, status = statusFilter) => {
    setLoading(true);
    try {
      const json = await customersAPI.getAll(currentPage, LIMIT, search, status);
      // Backend returns { data, pagination } when page/limit provided
      if (json.pagination) {
        setCustomers(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalItems(json.pagination.total);
      } else {
        setCustomers(json);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers data');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(page, searchTerm, statusFilter);
    }, searchTerm ? 400 : 0); // Only debounce if there is a search term
    
    return () => clearTimeout(timer);
  }, [page, searchTerm, statusFilter, fetchCustomers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const customerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        postal_code: formData.postal_code,
        country: formData.country,
        province_id: formData.province_id,
        regency_id: formData.regency_id,
        district_id: formData.district_id,
        village_id: formData.village_id,
        province_name: formData.province_name,
        regency_name: formData.regency_name,
        district_name: formData.district_name,
        village_name: formData.village_name,
        city: formData.regency_name, // Keep city for backward compatibility
      };

      if (modalMode === 'create') {
        await customersAPI.create(customerData);
        toast.success('Customer berhasil ditambahkan');
      } else if (modalMode === 'edit' && selectedCustomer) {
        await customersAPI.update(selectedCustomer.id, customerData);
        toast.success('Data customer berhasil diperbarui');
      }

      resetForm();
      fetchCustomers(page, searchTerm);
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast.error(error.message || 'Gagal menyimpan customer. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      postal_code: '',
      country: 'Indonesia',
      province_id: '',
      regency_id: '',
      district_id: '',
      village_id: '',
      province_name: '',
      regency_name: '',
      district_name: '',
      village_name: '',
      status: 'active',
    });
    setShowModal(false);
    setSelectedCustomer(null);
    setError('');
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Massal',
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} customer terpilih? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Ya, Hapus Semua',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig((prev: ConfirmConfig) => ({ ...prev, isOpen: false }));
        setIsBatchLoading(true);
        try {
          await customersAPI.batchDelete(selectedIds);
          setSelectedIds([]);
          fetchCustomers(page, searchTerm, statusFilter);
          toast.success(`${selectedIds.length} customer berhasil dihapus`);
        } catch (error: any) {
          console.error('Error batch deleting:', error);
          toast.error(error.message || 'Gagal menghapus beberapa customer');
        } finally {
          setIsBatchLoading(false);
        }
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map(c => c.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleEdit = (customer: Customer) => {
    setModalMode('edit');
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      postal_code: customer.postal_code || '',
      country: customer.country || 'Indonesia',
      province_id: customer.province_id || '',
      regency_id: customer.regency_id || '',
      district_id: customer.district_id || '',
      village_id: customer.village_id || '',
      province_name: customer.province_name || '',
      regency_name: customer.regency_name || '',
      district_name: customer.district_name || '',
      village_name: customer.village_name || '',
      status: customer.status || 'active',
    });
    setShowModal(true);
  };

  const handleView = (customer: Customer) => {
    setModalMode('view');
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Customer',
      message: 'Apakah Anda yakin ingin menghapus customer ini? Semua data invoice terkait mungkin akan terpengaruh.',
      confirmLabel: 'Ya, Hapus',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig((prev: ConfirmConfig) => ({ ...prev, isOpen: false }));
        try {
          await customersAPI.delete(id);
          toast.success('Customer berhasil dihapus');
          // If last item on page > 1, go back one page
          const newPage = customers.length === 1 && page > 1 ? page - 1 : page;
          setPage(newPage);
          fetchCustomers(newPage, searchTerm);
        } catch (error: any) {
          console.error('Error deleting customer:', error);
          toast.error(error.message || 'Gagal menghapus customer');
        }
      }
    });
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedCustomer(null);
    resetForm();
    setShowModal(true);
  };

  const handleValidatePhone = async () => {
    if (!formData.phone) {
      setPhoneValidation({
        isRegistered: false,
        message: 'Masukkan nomor telepon terlebih dahulu',
      });
      return;
    }

    setValidatingPhone(true);
    setPhoneValidation(null);

    try {
      const result = await whatsappAPI.validateNumber(formData.phone, '62');

      setPhoneValidation({
        isRegistered: result.isRegistered,
        message: result.message,
      });
    } catch (error: any) {
      console.error('Error validating phone:', error);
      setPhoneValidation({
        isRegistered: false,
        message: error.message || 'Gagal memvalidasi nomor telepon',
      });
    } finally {
      setValidatingPhone(false);
    }
  };

  const getFullAddress = (customer: Customer) => {
    const parts = [];
    if (customer.address) parts.push(customer.address);
    if (customer.village_name) parts.push(customer.village_name);
    if (customer.district_name) parts.push(customer.district_name);
    if (customer.regency_name) parts.push(customer.regency_name);
    if (customer.province_name) parts.push(customer.province_name);
    if (customer.postal_code) parts.push(customer.postal_code);
    return toTitleCase(parts.join(', '));
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Daftar Pelanggan</h1>
          <p className="text-sm text-gray-500">Kelola database pelanggan dan alamat penagihan Anda</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shrink-0"
        >
          <Plus size={16} />
          Tambah Pelanggan
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400"
            />
          </div>
          <DropdownFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
          />
        </div>

        <CompactBatchActions
          selectedCount={selectedIds.length}
          onDelete={handleBatchDelete}
          onClear={() => setSelectedIds([])}
          isLoading={isBatchLoading}
        />

        {!loading && (
          <span className="text-xs text-gray-400 whitespace-nowrap">{totalItems} customers</span>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <SkeletonTable rows={10} columns={5} />
        ) : (
          <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <tr>
                    <th className="w-10 px-4 py-2">
                      <button 
                        onClick={toggleSelectAll}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {selectedIds.length > 0 && selectedIds.length === customers.length ? (
                          <CheckSquare size={16} className="text-blue-600" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2 hidden lg:table-cell">Kontak</th>
                    <th className="px-4 py-2 hidden xl:table-cell">Alamat</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-xs italic">
                        {searchTerm || statusFilter ? 'Tidak ada customer yang cocok.' : 'Belum ada customer.'}
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(customer.id) ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-4 py-2">
                          <button 
                            onClick={() => toggleSelect(customer.id)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            {selectedIds.includes(customer.id) ? (
                              <CheckSquare size={16} className="text-blue-600" />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-gray-900">{customer.name}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-700 font-medium">{customer.email || '-'}</span>
                            <span className="text-[11px] text-gray-400">{customer.phone || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className="text-xs text-gray-500 line-clamp-1">
                            {[customer.regency_name || customer.city, customer.province_name].filter(Boolean).map(toTitleCase).join(', ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-tight border ${
                              (customer.status || 'active') === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {customer.status || 'active'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleView(customer)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-50 transition-colors" title="View"><Eye size={16} /></button>
                            <button onClick={() => handleEdit(customer)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded border border-amber-50 transition-colors" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(customer.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-50 transition-colors" title="Delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden divide-y divide-gray-100">
              {customers.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  {searchTerm || statusFilter ? 'No customers match your filters' : 'No customers yet'}
                </div>
              ) : (
                customers.map((customer) => (
                  <div key={customer.id} className={`p-4 bg-white rounded-xl shadow-sm border border-gray-100 mb-3 mx-2 hover:shadow-md transition-all ${selectedIds.includes(customer.id) ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100' : ''}`}>
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => toggleSelect(customer.id)}
                        className="mt-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {selectedIds.includes(customer.id) ? (
                          <CheckSquare size={20} className="text-blue-600" />
                        ) : (
                          <Square size={20} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">{customer.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Mail size={12} className="text-gray-400" />
                              <p className="text-xs text-gray-500">{customer.email || 'No email'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
                            <button onClick={() => handleView(customer)} className="p-1.5 text-blue-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="View"><Eye size={14} /></button>
                            <button onClick={() => handleEdit(customer)} className="p-1.5 text-amber-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="Edit"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(customer.id)} className="p-1.5 text-red-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-gray-50 pt-3">
                          {customer.phone && (
                            <div className="flex items-center gap-2.5 text-xs text-gray-600">
                              <div className="w-5 h-5 bg-green-50 rounded flex items-center justify-center shrink-0">
                                <Phone size={10} className="text-green-600" />
                              </div>
                              <span className="font-medium">{customer.phone}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-2.5 text-xs text-gray-500 leading-relaxed">
                            <div className="w-5 h-5 bg-blue-50 rounded flex items-center justify-center shrink-0 mt-0.5">
                              <MapPin size={12} className="text-blue-600" />
                            </div>
                            <span className="line-clamp-2">{getFullAddress(customer)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setPage(page - 1); fetchCustomers(page - 1, searchTerm); }}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={15} /> Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return (
                <button key={p} onClick={() => { setPage(p); fetchCustomers(p, searchTerm); }}
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${p === page ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50 border border-gray-200'
                    }`}>{p}</button>
              );
            })}
            <button
              onClick={() => { setPage(page + 1); fetchCustomers(page + 1, searchTerm); }}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        {...confirmConfig}
        onCancel={() => setConfirmConfig((prev: ConfirmConfig) => ({ ...prev, isOpen: false }))}
      />

      {/* Modal */}
      {showModal && (
        <KeyboardShortcutWrapper onClose={resetForm} disabled={saving}>
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full my-8 overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {modalMode === 'create' && 'Tambah Customer Baru'}
                  {modalMode === 'edit' && 'Edit Data Customer'}
                  {modalMode === 'view' && 'Detail Customer'}
                </h2>
                <p className="text-sm text-gray-500">Lengkapi informasi detail customer di bawah ini</p>
              </div>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            {modalMode === 'view' && selectedCustomer ? (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nama</label>
                  <div className="text-gray-900">{selectedCustomer.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <div className="text-gray-900">{selectedCustomer.email || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Telepon</label>
                  <div className="text-gray-900">{selectedCustomer.phone || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lengkap</label>
                  <div className="text-gray-900">{getFullAddress(selectedCustomer)}</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Informasi Pelanggan */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ditujukan Kepada</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-4 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Full name"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-4 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon / WhatsApp</label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => {
                            setFormData({ ...formData, phone: e.target.value });
                            setPhoneValidation(null);
                          }}
                          onBlur={() => {
                            if (formData.phone && formData.phone.length >= 8) {
                              handleValidatePhone();
                            }
                          }}
                          className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          placeholder="08xxxxxxxxxx"
                        />
                        {validatingPhone && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 size={16} className="animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                      {phoneValidation && (
                        <div className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${phoneValidation.isRegistered
                            ? 'text-green-600'
                            : 'text-red-600'
                          }`}>
                          {phoneValidation.isRegistered ? (
                            <>
                              <CheckCircle size={12} />
                              <span>WhatsApp Verified</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={12} />
                              <span>Not registered on WhatsApp</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Kode Pos</label>
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        className="w-full pl-4 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="12345"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detail Alamat</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Alamat Jalan / No. Rumah <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      rows={2}
                      placeholder="Street address, house number"
                      required
                    />
                  </div>

                  {/* Region Selector */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <RegionSelect
                      provinceId={formData.province_id}
                      regencyId={formData.regency_id}
                      districtId={formData.district_id}
                      villageId={formData.village_id}
                      onProvinceChange={(id, name) => setFormData({ ...formData, province_id: id, province_name: name })}
                      onRegencyChange={(id, name) => setFormData({ ...formData, regency_id: id, regency_name: name })}
                      onDistrictChange={(id, name) => setFormData({ ...formData, district_id: id, district_name: name })}
                      onVillageChange={(id, name) => setFormData({ ...formData, village_id: id, village_name: name })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Negara</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full pl-4 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors"
                  >
                    {saving ? 'Menyimpan...' : (modalMode === 'create' ? 'Simpan Customer' : 'Perbarui Customer')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        </KeyboardShortcutWrapper>
      )}
    </div>
  );
}
