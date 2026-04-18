import { useEffect, useState } from 'react';
import { Plus, Eye, Edit2, Trash2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { servicesAPI } from '../lib/api';
import { formatRupiah } from '../lib/formatter';
import { SkeletonTable } from '../components/LoadingSkeleton';
import KeyboardShortcutWrapper from '../components/KeyboardShortcutWrapper';
import { Service } from '../types';

const PAGE_SIZE = 10;

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const fetchServices = async () => {
    try {
      const data = await servicesAPI.getAll();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services data');
    } finally {
      setLoading(false);
    }
  };

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
        await servicesAPI.create({ name: formData.name, description: formData.description, price: priceValue });
      } else if (modalMode === 'edit' && selectedService) {
        await servicesAPI.update(selectedService.id, { name: formData.name, description: formData.description, price: priceValue });
      }
      setFormData({ name: '', description: '', price: '' });
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
    setFormData({ name: service.name, description: service.description || '', price: Math.round(service.price).toString() });
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
    setFormData({ name: '', description: '', price: '' });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedService(null);
    setFormData({ name: '', description: '', price: '' });
    setError('');
  };


  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Services</h1>
          <p className="text-sm text-gray-500">Manage your service catalog and pricing</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shrink-0"
        >
          <Plus size={16} />
          Add Service
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        {!loading && (
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {filtered.length} service{filtered.length !== 1 ? 's' : ''}
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No services found matching your search.' : 'No services yet.'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-500 max-w-xs truncate">{service.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-800">{formatRupiah(service.price)}</span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleView(service)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye size={16} /></button>
                          <button onClick={() => handleEdit(service)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(service.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
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
                {searchTerm ? 'No services found.' : 'No services yet.'}
              </div>
            ) : (
              paginated.map((service) => (
                <div key={service.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{service.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-4 shrink-0">
                      <button onClick={() => handleView(service)} className="p-2 text-blue-600 bg-blue-50 rounded-lg" title="View"><Eye size={16} /></button>
                      <button onClick={() => handleEdit(service)} className="p-2 text-amber-600 bg-amber-50 rounded-lg" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(service.id)} className="p-2 text-red-600 bg-red-50 rounded-lg" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Harga Layanan</span>
                    <span className="text-sm font-bold text-blue-600">{formatRupiah(service.price)}</span>
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
