import { useEffect, useState } from 'react';
import { Plus, Eye, Edit2, Trash2, X, Search, ChevronLeft, ChevronRight, Tag, FileText } from 'lucide-react';
import { servicesAPI } from '../lib/api';
import { formatRupiah } from '../lib/formatter';
import { SkeletonTable } from '../components/LoadingSkeleton';
import KeyboardShortcutWrapper from '../components/KeyboardShortcutWrapper';
import { Service } from '../types';
import DropdownFilter from '../components/DropdownFilter';
import CompactBatchActions from '../components/CompactBatchActions';
import { CheckSquare, Square } from 'lucide-react';
import { toast } from '../components/Toast';

const PAGE_SIZE = 10;

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    status: 'active'
  });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const json = await servicesAPI.getAll(page, PAGE_SIZE, searchTerm, statusFilter);
      if (json.pagination) {
        setServices(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalItems(json.pagination.total);
      } else {
        setServices(json);
        setTotalPages(1);
        setTotalItems(json.length);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices();
    }, searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [page, searchTerm, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const priceValue = parseFloat(formData.price.replace(/[^0-9]/g, ''));
      if (isNaN(priceValue) || priceValue <= 0) {
        setError('Invalid price. Please enter a valid number.');
        return;
      }
      if (modalMode === 'create') {
        await servicesAPI.create({ name: formData.name, description: formData.description, price: priceValue, status: formData.status });
        toast.success('Service created successfully');
      } else if (modalMode === 'edit' && selectedService) {
        await servicesAPI.update(selectedService.id, { name: formData.name, description: formData.description, price: priceValue, status: formData.status });
        toast.success('Service updated successfully');
      }
      setFormData({ name: '', description: '', price: '', status: 'active' });
      setShowModal(false);
      setSelectedService(null);
      fetchServices();
    } catch (error: any) {
      console.error('Error saving service:', error);
      setError(error.message || 'Failed to save service. Try again.');
    }
  };

  const handleEdit = (service: Service) => {
    setModalMode('edit');
    setSelectedService(service);
    setFormData({ 
      name: service.name, 
      description: service.description || '', 
      price: Math.round(service.price).toString(),
      status: service.status || 'active'
    });
    setShowModal(true);
  };

  const handleView = (service: Service) => {
    setModalMode('view');
    setSelectedService(service);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        await servicesAPI.delete(id);
        toast.success('Service deleted successfully');
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        setError('Failed to delete service');
      }
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedService(null);
    setFormData({ name: '', description: '', price: '', status: 'active' });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedService(null);
    setFormData({ name: '', description: '', price: '', status: 'active' });
    setError('');
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} services?`)) return;
    setIsBatchLoading(true);
    try {
      await servicesAPI.batchDelete(selectedIds);
      toast.success(`${selectedIds.length} services deleted`);
      setSelectedIds([]);
      fetchServices();
    } catch (error: any) {
      console.error('Error batch deleting services:', error);
      toast.error(error.message || 'Failed to delete services');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map(s => s.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };


  const paginated = services; // Now using server-side results directly

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Layanan / Produk</h1>
          <p className="text-sm text-gray-500">Kelola katalog layanan dan harga produk Anda</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shrink-0"
        >
          <Plus size={16} />
          Tambah Layanan
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari layanan atau deskripsi..."
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
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {totalItems} service{totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <SkeletonTable rows={5} columns={4} />
        ) : (
          <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-10 px-6 py-3 text-left">
                      <button 
                        onClick={toggleSelectAll}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {selectedIds.length > 0 && selectedIds.length === paginated.length ? (
                          <CheckSquare size={18} className="text-blue-600" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        {searchTerm || statusFilter ? 'No services found matching your filters.' : 'No services yet.'}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((service) => (
                      <tr key={service.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(service.id) ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => toggleSelect(service.id)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            {selectedIds.includes(service.id) ? (
                              <CheckSquare size={18} className="text-blue-600" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="text-sm text-gray-500 max-w-xs truncate">{service.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-800">{formatRupiah(service.price)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {service.status || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleView(service)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye size={18} /></button>
                            <button onClick={() => handleEdit(service)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Edit2 size={18} /></button>
                            <button onClick={() => handleDelete(service.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={18} /></button>
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
              {paginated.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  {searchTerm || statusFilter ? 'No services found matching your filters.' : 'No services yet.'}
                </div>
              ) : (
                paginated.map((service) => (
                  <div key={service.id} className={`p-4 bg-white rounded-xl shadow-sm border border-gray-100 mb-3 mx-2 hover:shadow-md transition-all ${selectedIds.includes(service.id) ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100' : ''}`}>
                    <div className="flex items-start gap-4 mb-3">
                      <button 
                        onClick={() => toggleSelect(service.id)}
                        className="mt-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {selectedIds.includes(service.id) ? (
                          <CheckSquare size={20} className="text-blue-600" />
                        ) : (
                          <Square size={20} />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-sm font-extrabold text-gray-900 tracking-tight truncate">{service.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {service.status || 'active'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
                            <button onClick={() => handleView(service)} className="p-1.5 text-blue-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="View"><Eye size={14} /></button>
                            <button onClick={() => handleEdit(service)} className="p-1.5 text-amber-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="Edit"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(service.id)} className="p-1.5 text-red-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-gray-500">
                          <div className="w-5 h-5 bg-gray-50 rounded flex items-center justify-center shrink-0 mt-0.5">
                            <FileText size={10} className="text-gray-400" />
                          </div>
                          <p className="line-clamp-2 leading-relaxed">{service.description || 'Tidak ada deskripsi'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center">
                          <Tag size={12} className="text-green-600" />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Harga Layanan</span>
                      </div>
                      <span className="text-sm font-extrabold text-blue-600">{formatRupiah(service.price)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={15} /> Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${p === page ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50 border border-gray-200'}`}>
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(page + 1)}
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
        <KeyboardShortcutWrapper onClose={closeModal}>
          <div className="bg-white rounded-xl shadow-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {modalMode === 'create' && 'Add Service'}
                  {modalMode === 'edit' && 'Edit Service'}
                  {modalMode === 'view' && 'Service Details'}
                </h2>
                <p className="text-sm text-gray-500">Fill in the service information</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            {modalMode === 'view' && selectedService ? (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Service Name</label>
                  <div className="text-gray-900">{selectedService.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <div className="text-gray-900">{selectedService.description || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
                  <div className="text-gray-900 font-semibold text-lg">{formatRupiah(selectedService.price)}</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="e.g. Web Development"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    rows={3}
                    placeholder="Brief description of the service"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (Rp) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.price.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, price: value });
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="e.g. 500.000"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Enter amount in Indonesian Rupiah</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white font-medium"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors">
                    {modalMode === 'create' ? 'Save Service' : 'Update Service'}
                  </button>
                  <button type="button" onClick={closeModal} className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors">
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
