import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { customersAPI, servicesAPI, invoicesAPI } from '../lib/api';

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

export default function EditInvoicePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    if (id) {
      fetchCustomers();
      fetchServices();
      fetchInvoice();
    }
  }, [id]);

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
    if (!id) return;
    setLoading(true);
    try {
      const data = await invoicesAPI.getById(id);
      
      // Prevent editing of system invoices
      if (data.is_system) {
        navigate(`/invoices/${data.invoice_number || data.id}/view`, { replace: true });
        return;
      }
      
      // Format dates to YYYY-MM-DD for input type="date"
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      };
      
      setFormData({
        customer_id: data.customer_id?.toString() || '',
        invoice_number: data.invoice_number,
        issue_date: formatDate(data.issue_date),
        due_date: formatDate(data.due_date),
        notes: data.notes || '',
        status: data.status,
      });

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
        setItems([{ id: Date.now(), service_id: null, description: '', quantity: 1, unit: '', unit_price: 0, discount: 0, tax_rate: 0 }]);
      }

      // Load display preferences from invoice
      setShowDiscount(data.show_discount || false);
      setShowUnit(data.show_unit || false);
      setShowTax(data.show_tax || false);

      // If the current URL has a numeric ID, replace it with the invoice number for SEO-friendly URLs
      if (id && !isNaN(Number(id)) && data.invoice_number) {
        navigate(`/invoices/${data.invoice_number}/edit`, { replace: true });
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (itemId: number, field: keyof InvoiceItem, value: any) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== itemId) return item;

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

  // Auto-resize textareas when items change
  useEffect(() => {
    items.forEach((item) => {
      const textarea = document.querySelector(`textarea[data-item-id="${item.id}"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    });
  }, [items]);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now(), service_id: null, description: '', quantity: 1, unit: '', unit_price: 0, discount: 0, tax_rate: 0 },
    ]);
  };

  const removeItem = (itemId: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== itemId));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!id) return;
      if (!formData.customer_id) {
        setError('Please select a customer first');
        setSaving(false);
        return;
      }

      if (!formData.due_date) {
        setError('Due date is required');
        setSaving(false);
        return;
      }

      // Validate items
      for (let i = 0; i < items.length; i++) {
        if (!items[i].description || items[i].quantity <= 0 || items[i].unit_price <= 0) {
          setError(`Item ${i + 1} is invalid. Check description, quantity, and price.`);
          setSaving(false);
          return;
        }
      }

      // Update invoice using centralized API
      await invoicesAPI.update(id, {
        customer_id: parseInt(formData.customer_id),
        invoice_number: formData.invoice_number,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        notes: formData.notes,
        status: formData.status,
        show_discount: showDiscount,
        show_unit: showUnit,
        show_tax: showTax,
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

      // Show success message and stay on the page
      setSuccess('Invoice updated successfully');
      setTimeout(() => setSuccess(''), 3000);

      // Update URL if invoice number changed
      if (id !== formData.invoice_number) {
        navigate(`/invoices/${formData.invoice_number}/edit`, { replace: true });
      }
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      setError(error.message || 'Failed to update invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <button
          onClick={() => navigate(`/invoices/${formData.invoice_number}/view`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit Invoice</h1>
        {formData.invoice_number && <p className="text-sm text-gray-600 mt-1">{formData.invoice_number}</p>}
      </div>

      {/* Content */}
      <div className="max-w-6xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {/* Invoice Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Invoice Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Issue Date <span className="text-red-500">*</span>
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
                  Due Date <span className="text-red-500">*</span>
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
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add notes for this invoice..."
              />
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Service Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[1000px]">
                <div className="flex gap-3 bg-slate-700 text-white py-3 px-4 rounded-t-lg items-center">
                  <div className="flex-1 min-w-[150px] text-sm font-semibold">Service</div>
                  <div className="flex-[2] min-w-[200px] text-sm font-semibold">Description</div>
                  <div className={`${showUnit ? 'w-20' : 'w-16'} text-sm font-semibold text-center`}>Qty</div>
                  {showUnit && <div className="w-24 text-sm font-semibold text-center">Unit</div>}
                  <div className="w-28 text-sm font-semibold text-right">Price</div>
                  {showDiscount && <div className="w-20 text-sm font-semibold text-center">Discount%</div>}
                  {showTax && <div className="w-20 text-sm font-semibold text-center">Tax%</div>}
                  <div className="w-32 text-sm font-semibold text-right">Subtotal</div>
                </div>

                <div className="divide-y divide-gray-200 border-x border-gray-200">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 py-4 px-4 items-start">
                      <div className="flex-1 min-w-[150px] pt-0.5">
                        <select
                          value={item.service_id || ''}
                          onChange={(e) => updateItem(item.id!, 'service_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm truncate"
                        >
                          <option value="">Select Service</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-[2] min-w-[200px]">
                        <textarea
                          data-item-id={item.id}
                          value={item.description}
                          onChange={(e) => updateItem(item.id!, 'description', e.target.value)}
                          onInput={handleTextareaInput}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none overflow-hidden leading-normal"
                          rows={1}
                          placeholder="Service description (can be multi-line)"
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
                            placeholder="Unit (e.g. Hrs, pcs)"
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
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Additional Options</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDiscount}
                    onChange={(e) => setShowDiscount(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Show Discount
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnit}
                    onChange={(e) => setShowUnit(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Show Unit
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTax}
                    onChange={(e) => setShowTax(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Show Tax
                </label>
              </div>
            </div>
          </div>

          {/* Total Invoice */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">Invoice Total:</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(calculateTotal())}
                </span>
                <p className="text-xs text-gray-500 mt-1">Excluding admin fees</p>
              </div>
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="flex items-center gap-3 pb-6">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/invoices/${formData.invoice_number}/view`)}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
