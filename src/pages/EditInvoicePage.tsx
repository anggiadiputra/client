import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { customersAPI, servicesAPI, invoicesAPI } from '../lib/api';
import { SkeletonBlock, SkeletonForm, SkeletonTable } from '../components/LoadingSkeleton';

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
    template_id: 'classic',
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);

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
        template_id: data.template_id || 'classic',
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
        setItems([{ id: crypto.randomUUID(), service_id: null, description: '', quantity: 1, unit: '', unit_price: 0, discount: 0, tax_rate: 0 }]);
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

  useEffect(() => {
    if (id) {
      fetchCustomers();
      fetchServices();
      fetchInvoice();
    }
  }, [id]);

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
      { id: crypto.randomUUID(), service_id: null, description: '', quantity: 1, unit: '', unit_price: 0, discount: 0, tax_rate: 0 },
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
        show_tax: showTax,
        template_id: formData.template_id,
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
      <div className="p-4 md:p-8 bg-surface-2 min-h-screen">
        <div className="mb-6 md:mb-8">
          <SkeletonBlock width="120px" height="24px" className="mb-4" />
          <SkeletonBlock width="300px" height="36px" />
        </div>
        
        <div className="bg-surface rounded-lg shadow-sm border border-separator overflow-hidden mb-6">
          <div className="p-6 border-b border-separator">
            <SkeletonBlock width="150px" height="24px" />
          </div>
          <div className="p-6">
             <SkeletonForm fields={4} />
          </div>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-separator overflow-hidden mb-6">
          <div className="p-6 border-b border-separator">
            <SkeletonBlock width="150px" height="24px" />
          </div>
          <div className="p-6">
            <SkeletonTable rows={3} columns={5} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <SkeletonBlock width="120px" height="40px" rounded />
          <SkeletonBlock width="150px" height="40px" rounded />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-surface-2 min-h-screen">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <button
          onClick={() => navigate(`/invoices/${formData.invoice_number}/view`)}
          className="flex items-center gap-2 text-tx-muted hover:text-tx-main mb-2 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-tx-main">Edit Invoice</h1>
        {formData.invoice_number && <p className="text-sm text-tx-muted mt-1">{formData.invoice_number}</p>}
      </div>

      {/* Content */}
      <div className="max-w-6xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/10 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {/* Invoice Info */}
          <div className="bg-surface rounded-lg shadow-sm border border-separator p-6">
            <h2 className="text-lg font-bold text-tx-main mb-4">Invoice Information</h2>
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
                  <option value="">Select Customer</option>
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
                <label className="block text-sm font-semibold text-tx-muted mb-2">
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
              <label className="block text-sm font-semibold text-tx-muted mb-2">
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
          <div className="bg-surface rounded-lg shadow-sm border border-separator p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-tx-main">Service Items</h2>
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

                <div className="divide-y divide-separator border-x border-separator">
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
                        <div className="flex-1 bg-surface-2 px-3 py-2 rounded-lg text-right text-sm font-semibold text-tx-main whitespace-nowrap">
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
            <div className="mt-4 pt-4 border-t border-separator">
              <p className="text-sm text-tx-muted mb-3">Additional Options</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-tx-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDiscount}
                    onChange={(e) => setShowDiscount(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Show Discount
                </label>
                <label className="flex items-center gap-2 text-sm text-tx-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnit}
                    onChange={(e) => setShowUnit(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Show Unit
                </label>
                <label className="flex items-center gap-2 text-sm text-tx-muted cursor-pointer">
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
          <div className="bg-surface rounded-lg shadow-sm border border-separator p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-tx-main">Invoice Total:</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(calculateTotal())}
                </span>
                <p className="text-xs text-tx-muted mt-1">Excluding admin fees</p>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-surface rounded-2xl shadow-sm border border-separator p-8">
            <h3 className="text-lg font-bold text-tx-main mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/15 text-blue-600 text-sm">3</span>
              Pilih Desain Invoice
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Classic Template Option */}
              <div 
                onClick={() => setFormData({ ...formData, template_id: 'classic' })}
                className={`relative cursor-pointer rounded-2xl border-2 transition-all overflow-hidden group ${
                  formData.template_id === 'classic' 
                    ? 'border-blue-600 bg-blue-500/10 dark:bg-blue-500/10' 
                    : 'border-separator hover:border-separator bg-surface dark:bg-surface'
                }`}
              >
                <div className="aspect-[4/3] bg-white p-4 overflow-hidden relative">
                   {/* Mini Mockup for Classic */}
                   <div className="bg-slate-50 h-full w-full shadow-sm rounded-sm p-4 space-y-2">
                     <div className="h-4 w-12 bg-blue-600 rounded-full mb-4"></div>
                     <div className="flex justify-between items-start">
                       <div className="space-y-1">
                         <div className="h-1.5 w-16 bg-slate-200 rounded"></div>
                         <div className="h-1.5 w-20 bg-slate-200 rounded"></div>
                       </div>
                       <div className="h-6 w-16 bg-slate-200 rounded"></div>
                     </div>
                     <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
                       <div className="h-2 w-full bg-slate-200 rounded"></div>
                       <div className="h-2 w-full bg-slate-200 rounded"></div>
                     </div>
                   </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-tx-main">Classic Professional</p>
                    <p className="text-xs text-tx-muted">Desain standar yang bersih dan teratur.</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    formData.template_id === 'classic' ? 'bg-blue-600 text-white' : 'border-2 border-separator'
                  }`}>
                    {formData.template_id === 'classic' && <CheckCircle size={14} />}
                  </div>
                </div>
              </div>

              {/* Modern Template Option */}
              <div 
                onClick={() => setFormData({ ...formData, template_id: 'modern' })}
                className={`relative cursor-pointer rounded-2xl border-2 transition-all overflow-hidden group ${
                  formData.template_id === 'modern' 
                    ? 'border-blue-600 bg-blue-500/10 dark:bg-blue-500/10' 
                    : 'border-separator hover:border-separator bg-surface dark:bg-surface'
                }`}
              >
                <div className="aspect-[4/3] bg-slate-900 p-4 overflow-hidden relative">
                   {/* Mini Mockup for Modern */}
                   <div className="bg-surface h-full w-full shadow-sm rounded-sm overflow-hidden flex flex-col">
                     <div className="h-1/3 bg-slate-800 p-3 flex justify-between">
                        <div className="h-3 w-8 bg-blue-400 rounded-full"></div>
                        <div className="h-4 w-12 bg-surface/20 rounded"></div>
                     </div>
                     <div className="p-3 space-y-2 flex-1">
                       <div className="h-1.5 w-24 bg-surface-2 rounded"></div>
                       <div className="h-1.5 w-20 bg-surface-2 rounded"></div>
                       <div className="pt-2 mt-2 border-t border-separator space-y-1">
                         <div className="h-2 w-full bg-surface-2 rounded"></div>
                         <div className="h-2 w-full bg-surface-2 rounded"></div>
                       </div>
                     </div>
                   </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-tx-main">Modern Premium</p>
                    <p className="text-xs text-tx-muted">Tampilan elegan dengan kontras tinggi.</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    formData.template_id === 'modern' ? 'bg-blue-600 text-white' : 'border-2 border-separator'
                  }`}>
                    {formData.template_id === 'modern' && <CheckCircle size={14} />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="flex items-center gap-3 pb-6 mt-8">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/invoices/${formData.invoice_number}/view`)}
              className="flex items-center justify-center px-5 py-2.5 border border-separator text-tx-muted font-semibold rounded-lg hover:bg-surface-2 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
