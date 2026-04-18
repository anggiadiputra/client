import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, MessageSquare, Save, Receipt, BellRing, Mail, Eye, Code } from 'lucide-react';
import { settingsAPI } from '../lib/api';

type TemplateCategory = 'wa' | 'email';
type TemplateSubKey = 'invoice' | 'paid' | 'reminder';
type TemplateKey = `${TemplateCategory}_${TemplateSubKey}_template`;

export default function TemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<TemplateSubKey>('invoice');
  const [emailViewMode, setEmailViewMode] = useState<'code' | 'preview'>('code');
  
  const [templates, setTemplates] = useState<Record<string, string>>({
    wa_invoice_template: '',
    wa_paid_template: '',
    wa_reminder_template: '',
    email_invoice_template: '',
    email_paid_template: '',
    email_reminder_template: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingsAPI.get();
      setTemplates({
        wa_invoice_template: data.wa_invoice_template || '',
        wa_paid_template: data.wa_paid_template || '',
        wa_reminder_template: data.wa_reminder_template || '',
        email_invoice_template: data.email_invoice_template || '',
        email_paid_template: data.email_paid_template || '',
        email_reminder_template: data.email_reminder_template || '',
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus('idle');
    try {
      await settingsAPI.update(templates);
      setStatus('success');
      setMessage('Template berhasil disimpan!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Error saving templates:', error);
      setStatus('error');
      setMessage(error.message || 'Gagal menyimpan template');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (category: TemplateCategory, variable: string) => {
    const key = `${category}_${activeSubTab}_template` as TemplateKey;
    setTemplates((prev) => ({
      ...prev,
      [key]: prev[key] + variable
    }));
  };

  const renderEmailPreview = () => {
    const html = templates[`email_${activeSubTab}_template`];
    const mock = {
      '{customer_name}': 'John Doe',
      '{company_name}': 'Sumbopad Inc',
      '{invoice_number}': 'INV-2026-001',
      '{issue_date}': '15 April 2026',
      '{due_date}': '30 April 2026',
      '{total_amount}': 'Rp 1.500.000',
      '{public_invoice_url}': '#'
    };
    
    let rendered = html;
    Object.entries(mock).forEach(([key, val]) => {
      rendered = rendered.replace(new RegExp(key, 'g'), val);
    });

    return (
      <div 
        className="flex-1 bg-white border border-gray-200 rounded-lg p-4 overflow-auto min-h-[300px] text-sm"
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  const variables = [
    '{customer_name}',
    '{company_name}',
    '{invoice_number}',
    '{issue_date}',
    '{due_date}',
    '{total_amount}',
    '{public_invoice_url}'
  ];

  const subTabs: { key: TemplateSubKey; label: string; icon: any; color: string }[] = [
    { key: 'invoice', label: 'Penagihan', icon: MessageSquare, color: 'text-blue-600' },
    { key: 'paid', label: 'Lunas', icon: Receipt, color: 'text-green-600' },
    { key: 'reminder', label: 'Pengingat', icon: BellRing, color: 'text-yellow-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Templates</h1>
          <p className="text-sm text-gray-500">Manage your notification message templates.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Templates'}
        </button>
      </div>

      {status !== 'idle' && (
        <div className={`mb-6 flex items-center gap-2 p-4 rounded-lg font-medium border ${
          status === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {status === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                isActive ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <MessageSquare size={18} className="text-gray-500" />
            <h2 className="font-bold text-gray-700">WhatsApp Message</h2>
          </div>
          
          <div className="p-4 sm:p-6">
            <textarea
              value={templates[`wa_${activeSubTab}_template`]}
              onChange={(e) => setTemplates({...templates, [`wa_${activeSubTab}_template`]: e.target.value})}
              className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
              placeholder="Type WhatsApp message..."
            />
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Available Variables</p>
              <div className="flex flex-wrap gap-2">
                {variables.map((v) => (
                  <button
                    key={v}
                    onClick={() => insertVariable('wa', v)}
                    className="px-2 py-1 bg-white border border-gray-200 text-xs font-mono rounded-md hover:border-blue-500 transition-colors shadow-sm"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-gray-500" />
              <h2 className="font-bold text-gray-700">Email Template (HTML)</h2>
            </div>
            
            <div className="flex border border-gray-200 rounded-md overflow-hidden bg-white">
              <button
                onClick={() => setEmailViewMode('code')}
                className={`p-1.5 transition-colors ${emailViewMode === 'code' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Code size={16} />
              </button>
              <button
                onClick={() => setEmailViewMode('preview')}
                className={`p-1.5 transition-colors ${emailViewMode === 'preview' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Eye size={16} />
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 h-full flex flex-col">
            {emailViewMode === 'code' ? (
              <>
                <textarea
                  value={templates[`email_${activeSubTab}_template`]}
                  onChange={(e) => setTemplates({...templates, [`email_${activeSubTab}_template`]: e.target.value})}
                  className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
                  placeholder="Type HTML email body..."
                />
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Available Variables</p>
                  <div className="flex flex-wrap gap-2">
                    {variables.map((v) => (
                      <button
                        key={v}
                        onClick={() => insertVariable('email', v)}
                        className="px-2 py-1 bg-white border border-gray-200 text-xs font-mono rounded-md hover:border-blue-500 transition-colors shadow-sm"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              renderEmailPreview()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
