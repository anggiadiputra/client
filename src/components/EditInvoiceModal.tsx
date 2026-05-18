import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { customersAPI, servicesAPI, invoicesAPI } from '../lib/api';
import KeyboardShortcutWrapper from './KeyboardShortcutWrapper';

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number;
  onSuccess: () => void;
}

interface InvoiceItem {
  id?: number;
  service_id: number | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number;
  tax_rate: number;
}

export default function EditInvoiceModal({ isOpen, onClose, invoiceId, onSuccess }: EditInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showUnit, setShowUnit] = useState(false);
  const [showTax, setShowTax] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_number: '',
    issue_date: '',
    due_date: '',
    notes: '',
    status: 'draft',
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchCustomers();
      fetchServices();
      fetchInvoice();
    }
  }, [isOpen, invoiceId]);

  const fetchCustomers = async () => {
    try {
      const data = await customersAPI.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const data = await servicesAPI.getAll();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const data = await invoicesAPI.getById(invoiceId);
      
      setFormData({
        customer_id: data.customer_id.toString(),
        invoice_number: data.invoice_number,
        issue_date: data.issue_date,
        due_date: data.due_date,
        notes: data.notes || '',
        status: data.status,
      });

      // Check if any items have discount, unit, or tax
      const hasDiscount = data.items?.some((item: any) => (item.discount || 0) > 0);
      const hasUnit = data.items?.some((item: any) => item.unit);
      const hasTax = data.items?.some((item: any) => (item.tax_rate || 0) > 0);
      
      setShowDiscount(hasDiscount);
      setShowUnit(hasUnit);
      setShowTax(hasTax);

      // Set items
      if (data.items && data.items.length > 0) {
        setItems(data.items.map((item: any) => ({
          id: item.id,
          service_id: item.service_id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || '',
          unit_price: item.unit_price,
          discount: item.discount || 0,
          tax_rate: item.tax_rate || 0,
        })));
      } else {
        setItems([{ service_id: null, description: '', quantity: 1, unit: '', unit_price: 0, discount: 0, tax_rate: 0 }]);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Gagal memuat data invoice');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (id: number, field: keyof InvoiceItem, value: any) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        // Fallback for new items that use timestamps as ID
        const itemId = item.id || 0;
        if (itemId !== id) return item;

        const updatedItem = { ...item, [field]: value };

        // Auto-fill description and price when service is selected
        if (field === 'service_id' && value) {
          const service = services.find((s) => s.id === parseInt(value));
          if (service) {
            updatedItem.description = service.description || service.name;
            updatedItem.unit_price = service.price;
            updatedItem.tax_rate = service.tax_rate || 0;
          }
        }

        return updatedItem;
      })
    );
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now(), service_id: null, description: '', quantity: 1, unit: '', unit_price: 0, discount: 0, tax_rate: 0 },
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const calculateSubtotal = (item: InvoiceItem) => {
    const base = item.quantity * item.unit_price;
    const discountAmount = base * (item.discount / 100);
    return base - discountAmount;
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = calculateSubtotal(item);
    const tax = subtotal * (item.tax_rate / 100);
    return subtotal + tax;
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      return total + calculateItemTotal(item);
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSaving(true);

    try {
      if (!formData.customer_id) {
        setError('Pilih customer terlebih dahulu');
        setSaving(false);
        return;
      }

      if (!formData.due_date) {
        setError('Tanggal jatuh tempo harus diisi');
        setSaving(false);
        return;
      }

      // Validate items
      for (let i = 0; i < items.length; i++) {
        if (!items[i].description || items[i].quantity <= 0 || items[i].unit_price <= 0) {
          setError(`Item ${i + 1} tidak valid. Periksa deskripsi, jumlah, dan harga.`);
          setSaving(false);
          return;
        }
      }

      // Update invoice using centralized API
      await invoicesAPI.update(invoiceId, {
        customer_id: parseInt(formData.customer_id),
        invoice_number: formData.invoice_number,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        notes: formData.notes,
        status: formData.status,
        items: items.map(item => ({
          id: item.id,
          service_id: item.service_id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          discount: item.discount,
          tax_rate: item.tax_rate,
        })),
      });

      setSuccessMessage('Invoice berhasil diupdate!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      setError(error.message || 'Gagal mengupdate invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      customer_id: '',
      invoice_number: '',
      issue_date: '',
      due_date: '',
      notes: '',
      status: 'draft',
    });
    setItems([]);
    setError('');
    setSuccessMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <KeyboardShortcutWrapper onClose={handleClose}>
      <div className="bg-surface rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-separator">
          <div>
            <h2 className="text-xl font-bold text-tx-main">Edit Invoice</h2>
            {formData.invoice_number && <p className="text-sm text-tx-muted mt-1">{formData.invoice_number}</p>}
          </div>
          <button
            onClick={handleClose}
            className="text-tx-subtle hover:text-tx-muted transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-500/10 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <CheckCircle size={18} />
                  {successMessage}
                </div>
              )}

              {/* Invoice Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-tx-muted mb-2">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-tx-muted mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-tx-muted mb-2">
                    Tanggal Issue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-tx-muted mb-2">
                    Tanggal Jatuh Tempo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-tx-main">Item Layanan</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    <Plus size={16} />
                    Tambah Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[1000px]">
                    <div className="flex gap-3 bg-slate-700 text-white py-3 px-4 rounded-t-lg items-center">
                      <div className="flex-1 min-w-[180px] text-sm font-semibold">Layanan</div>
                      <div className="flex-[2] min-w-[250px] text-sm font-semibold">Deskripsi</div>
                      <div className={`${showUnit ? 'w-20' : 'w-16'} text-sm font-semibold text-center`}>Qty</div>
                      {showUnit && <div className="w-24 text-sm font-semibold text-center">Satuan</div>}
                      <div className="w-32 text-sm font-semibold text-right">Harga</div>
                      {showDiscount && <div className="w-20 text-sm font-semibold text-center">Diskon</div>}
                      {showTax && <div className="w-20 text-sm font-semibold text-center">Pajak</div>}
                      <div className="w-32 text-sm font-semibold text-right">Subtotal</div>
                    </div>

                    <div className="divide-y divide-separator border-x border-separator">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-3 py-4 px-4 items-start">
                          <div className="flex-1 min-w-[180px] pt-0.5">
                            <select
                              value={item.service_id || ''}
                              onChange={(e) => updateItem(item.id!, 'service_id', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm truncate"
                            >
                              <option value="">Pilih Layanan</option>
                              {services.map((service) => (
                                <option key={service.id} value={service.id}>
                                  {service.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex-[2] min-w-[250px]">
                            <textarea
                              value={item.description}
                              onChange={(e) => updateItem(item.id!, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none overflow-hidden"
                              rows={1}
                              placeholder="Deskripsi layanan"
                              required
                            />
                          </div>

                          <div className={`${showUnit ? 'w-20' : 'w-16'} pt-0.5`}>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id!, 'quantity', parseFloat(e.target.value) || 0)}
                              min="1"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center"
                              required
                            />
                          </div>

                          {showUnit && (
                            <div className="w-24 pt-0.5">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => updateItem(item.id!, 'unit', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center"
                                placeholder="Pcs"
                              />
                            </div>
                          )}

                          <div className="w-32 pt-0.5">
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateItem(item.id!, 'unit_price', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right"
                              required
                            />
                          </div>

                          {showDiscount && (
                            <div className="w-20 pt-0.5">
                              <input
                                type="number"
                                value={item.discount}
                                onChange={(e) => updateItem(item.id!, 'discount', parseFloat(e.target.value) || 0)}
                                min="0"
                                max="100"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center"
                                placeholder="0"
                              />
                            </div>
                          )}

                          {showTax && (
                            <div className="w-20 pt-0.5">
                              <input
                                type="number"
                                value={item.tax_rate}
                                onChange={(e) => updateItem(item.id!, 'tax_rate', parseFloat(e.target.value) || 0)}
                                min="0"
                                max="100"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center"
                                placeholder="0"
                              />
                            </div>
                          )}

                          <div className="w-32 flex items-start gap-2 pt-0.5">
                            <div className="flex-1 bg-surface-2 px-3 py-2 rounded-lg text-right text-sm font-semibold text-tx-main whitespace-nowrap">
                              {formatCurrency(calculateItemTotal(item))}
                            </div>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(item.id!)}
                                className="text-red-600 hover:text-red-700 p-1 flex-shrink-0"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Opsi Tambahan */}
                <div className="mt-4 pt-4 border-t border-separator">
                  <p className="text-sm text-tx-muted mb-3">Opsi Tambahan</p>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-tx-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showDiscount}
                        onChange={(e) => setShowDiscount(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      Tampilkan Diskon
                    </label>
                    <label className="flex items-center gap-2 text-sm text-tx-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showUnit}
                        onChange={(e) => setShowUnit(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      Tampilkan Satuan
                    </label>
                    <label className="flex items-center gap-2 text-sm text-tx-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showTax}
                        onChange={(e) => setShowTax(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      Tampilkan Pajak
                    </label>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-tx-muted mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Catatan tambahan untuk invoice..."
                />
              </div>

              {/* Total */}
              <div className="bg-surface-2 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-tx-main">Total Invoice:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-separator">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 text-tx-muted font-semibold rounded-lg hover:bg-surface-2 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>
    </KeyboardShortcutWrapper>
  );
}
