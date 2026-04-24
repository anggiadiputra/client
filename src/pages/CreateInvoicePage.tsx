import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check } from 'lucide-react';
import { invoicesAPI, customersAPI, servicesAPI } from '../lib/api';

interface InvoiceItem {
  id: number;
  service_id: number | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number;
  tax_rate: number;
}

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showUnit, setShowUnit] = useState(false);
  const [showTax, setShowTax] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, service_id: null, description: '', quantity: 1, unit: '', unit_price: 0, discount: 0, tax_rate: 0 },
  ]);

  // Refs for textarea auto-resize
  const textareaRefs = useRef<{ [key: number]: HTMLTextAreaElement | null }>({});

  useEffect(() => {
    fetchCustomers();
    fetchServices();
  }, []);

  // Auto-resize textareas when items change
  useEffect(() => {
    items.forEach((item) => {
      const textarea = textareaRefs.current[item.id];
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    });
  }, [items]);

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

  const updateItem = (id: number, field: keyof InvoiceItem, value: any) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;

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

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.customer_id) {
        setError('Pilih client terlebih dahulu');
        setLoading(false);
        return;
      }

      if (!formData.due_date) {
        setError('Tanggal jatuh tempo harus diisi');
        setLoading(false);
        return;
      }

      // Validate items
      for (let i = 0; i < items.length; i++) {
        if (!items[i].description || items[i].quantity <= 0 || items[i].unit_price <= 0) {
          setError(`Item ${i + 1} tidak valid. Periksa deskripsi, jumlah, dan harga.`);
          setLoading(false);
          return;
        }
      }

      // Generate invoice number
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const invoice_number = `INV-${year}${month}-${random}`;

      const createdInvoice = await invoicesAPI.create({
        customer_id: parseInt(formData.customer_id),
        invoice_number,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        notes: formData.notes,
        show_discount: showDiscount,
        show_unit: showUnit,
        show_tax: showTax,
        items: items.map((item) => ({
          service_id: item.service_id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          discount: item.discount,
          tax_rate: item.tax_rate,
        })),
      });
      
      toast.success('Invoice berhasil dibuat');
      navigate(`/invoices/${createdInvoice.invoice_number}/view`);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      setError(error.message || 'Gagal membuat invoice');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = (item: InvoiceItem) => {
    const base = item.quantity * item.unit_price;
    const discountAmount = showDiscount ? base * (item.discount / 100) : 0;
    return base - discountAmount;
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = calculateSubtotal(item);
    const tax = showTax ? subtotal * (item.tax_rate / 100) : 0;
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

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Kembali</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Buat Invoice Baru</h1>
        <p className="text-sm text-gray-600 mt-1">Buat invoice baru untuk client</p>
      </div>

      {/* Content */}
      <div className="max-w-6xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Informasi Invoice */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Informasi Invoice</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Client</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Catatan (opsional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Tambahkan catatan untuk invoice ini..."
              />
            </div>
          </div>

          {/* Item Layanan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Item Layanan</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                <Plus size={16} />
                Tambah Item
              </button>
            </div>

            {/* Table Header */}
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <div className="min-w-[1000px]">
                <div className="flex gap-3 bg-slate-700 text-white py-3 px-4 rounded-t-lg items-center">
                  <div className="flex-1 min-w-[150px] text-sm font-semibold">Layanan</div>
                  <div className="flex-[2] min-w-[200px] text-sm font-semibold">Deskripsi</div>
                  <div className={`${showUnit ? 'w-20' : 'w-16'} text-sm font-semibold text-center`}>Qty</div>
                  {showUnit && <div className="w-24 text-sm font-semibold text-center">Satuan</div>}
                  <div className="w-28 text-sm font-semibold text-right">Harga</div>
                  {showDiscount && <div className="w-20 text-sm font-semibold text-center">Diskon%</div>}
                  {showTax && <div className="w-20 text-sm font-semibold text-center">Pajak%</div>}
                  <div className="w-32 text-sm font-semibold text-right">Subtotal</div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-200 border-x border-gray-200">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 py-4 px-4 items-start">
                      <div className="flex-1 min-w-[150px] pt-0.5">
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

                      <div className="flex-[2] min-w-[200px]">
                        <textarea
                          ref={(el) => (textareaRefs.current[item.id] = el)}
                          value={item.description}
                          onChange={(e) => updateItem(item.id!, 'description', e.target.value)}
                          onInput={handleTextareaInput}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none overflow-hidden leading-normal"
                          rows={1}
                          placeholder="Deskripsi layanan (bisa multi-line)"
                          required
                          style={{ minHeight: '38px', lineHeight: '22px' }}
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

                      <div className="w-28 pt-0.5">
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
                        <div className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-right text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(calculateSubtotal(item))}
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id!)}
                            className="text-red-600 hover:text-red-700 p-1 flex-shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3 relative">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Item #{index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id!)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pilih Layanan</label>
                      <select
                        value={item.service_id || ''}
                        onChange={(e) => updateItem(item.id!, 'service_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      >
                        <option value="">Pilih Layanan</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Deskripsi</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(item.id!, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                        rows={2}
                        placeholder="Deskripsi..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Qty {showUnit && `(${item.unit || 'Unit'})`}</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id!, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Harga Satuan</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id!, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-right"
                          required
                        />
                      </div>
                    </div>

                    {(showDiscount || showTax) && (
                      <div className="grid grid-cols-2 gap-3">
                        {showDiscount && (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Diskon %</label>
                            <input
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateItem(item.id!, 'discount', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-center"
                            />
                          </div>
                        )}
                        {showTax && (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pajak %</label>
                            <input
                              type="number"
                              value={item.tax_rate}
                              onChange={(e) => updateItem(item.id!, 'tax_rate', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-center"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-gray-300">
                      <span className="text-sm font-bold text-gray-600">Subtotal</span>
                      <span className="text-sm font-bold text-blue-600">{formatCurrency(calculateSubtotal(item))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Opsi Tambahan */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Opsi Tambahan</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDiscount}
                    onChange={(e) => setShowDiscount(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Tampilkan Diskon
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnit}
                    onChange={(e) => setShowUnit(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Tampilkan Satuan
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
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

          {/* Total Invoice */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(items.reduce((sum, item) => sum + calculateSubtotal(item), 0))}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Total Pajak:</span>
                <span>{formatCurrency(items.reduce((sum, item) => sum + (calculateSubtotal(item) * item.tax_rate / 100), 0))}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">Total Invoice:</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(calculateTotal())}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Belum termasuk biaya admin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="flex items-center gap-3 pb-6">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Check size={18} />
              {loading ? 'Menyimpan...' : 'Simpan Invoice'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
