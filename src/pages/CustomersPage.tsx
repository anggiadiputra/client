import { useEffect, useState, useCallback } from 'react';
import { Trash2, Edit2, Plus, Eye, X, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { customersAPI, whatsappAPI } from '../lib/api';
import { toTitleCase } from '../lib/formatter';
import RegionSelect from '../components/RegionSelect';
import { SkeletonTable } from '../components/LoadingSkeleton';
import KeyboardShortcutWrapper from '../components/KeyboardShortcutWrapper';

import { Customer } from '../types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Pagination & Layout states
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
  });

  useEffect(() => {
    fetchCustomers(page, searchTerm);
  }, [page]);

  // Debounce search: reset to page 1 and refetch when searchTerm changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCustomers(1, searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCustomers = useCallback(async (currentPage = page, search = searchTerm) => {
    setLoading(true);
    try {
      const json = await customersAPI.getAll(currentPage, LIMIT, search);
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
  }, [page, searchTerm]);

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
      } else if (modalMode === 'edit' && selectedCustomer) {
        await customersAPI.update(selectedCustomer.id, customerData);
      }
      
      resetForm();
      fetchCustomers(page, searchTerm);
    } catch (error: any) {
      console.error('Error saving customer:', error);
      setError(error.message || 'Gagal menyimpan customer. Coba lagi.');
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
    });
    setShowModal(false);
    setSelectedCustomer(null);
    setError('');
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
    });
    setShowModal(true);
  };

  const handleView = (customer: Customer) => {
    setModalMode('view');
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus customer ini?')) {
      try {
        await customersAPI.delete(id);
        // If last item on page > 1, go back one page
        const newPage = customers.length === 1 && page > 1 ? page - 1 : page;
        setPage(newPage);
        fetchCustomers(newPage, searchTerm);
      } catch (error) {
        console.error('Error deleting customer:', error);
        setError('Gagal menghapus customer');
      }
    }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Customers</h1>
          <p className="text-sm text-gray-500">Manage your customer database and billing addresses</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shrink-0"
        >
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
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
            <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Address</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No customers found' : 'No customers yet'}
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700">{customer.email || '-'}</span>
                        <span className="text-xs text-gray-400">{customer.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden xl:table-cell">
                      <div className="text-xs text-gray-500 max-w-xs line-clamp-2">{getFullAddress(customer)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleView(customer)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye size={16} /></button>
                        <button onClick={() => handleEdit(customer)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(customer.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
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
                {searchTerm ? 'No customers found' : 'No customers yet'}
              </div>
            ) : (
              customers.map((customer) => (
                <div key={customer.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{customer.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{customer.email || 'No email'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                       <button onClick={() => handleView(customer)} className="p-2 text-blue-600 bg-blue-50 rounded-lg" title="View"><Eye size={16} /></button>
                       <button onClick={() => handleEdit(customer)} className="p-2 text-amber-600 bg-amber-50 rounded-lg" title="Edit"><Edit2 size={16} /></button>
                       <button onClick={() => handleDelete(customer.id)} className="p-2 text-red-600 bg-red-50 rounded-lg" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-semibold text-gray-400">WA:</span>
                        {customer.phone}
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-[11px] text-gray-500 leading-relaxed">
                       <span className="font-semibold text-gray-400 mt-0.5 whitespace-nowrap">Alamat:</span>
                       <span className="line-clamp-2">{getFullAddress(customer)}</span>
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
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                    p === page ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50 border border-gray-200'
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

      {/* Modal */}
      {showModal && (
        <KeyboardShortcutWrapper onClose={resetForm} disabled={saving}>
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full my-8 overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                    {modalMode === 'create' && 'Add Customer'}
                    {modalMode === 'edit' && 'Edit Customer'}
                    {modalMode === 'view' && 'Customer Details'}
                </h2>
                <p className="text-sm text-gray-500">Complete the information below</p>
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
                
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Name <span className="text-red-500">*</span>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
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
                        <div className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${
                          phoneValidation.isRegistered
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
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal Code</label>
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        className="w-full pl-4 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Address Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Street Address <span className="text-red-500">*</span>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
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
                    {saving ? 'Saving...' : (modalMode === 'create' ? 'Save Customer' : 'Update Customer')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors"
                  >
                    Cancel
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
