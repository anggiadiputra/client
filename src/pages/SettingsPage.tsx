import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, ExternalLink, HardDrive, Mail, Edit, Plus, Trash2, Star, Palette } from 'lucide-react';
import { settingsAPI, bankAccountsAPI, whatsappAPI } from '../lib/api';
import { useAppSettings } from '../context/AppContext';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { updateSettings, userRole } = useAppSettings();

  // Appearance states
  const [editingAppearance, setEditingAppearance] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [appearanceStatus, setAppearanceStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [appearanceMessage, setAppearanceMessage] = useState('');

  // Company Info states
  const [editingCompany, setEditingCompany] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [companyStatus, setCompanyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [companyMessage, setCompanyMessage] = useState('');

  // Turnstile states
  const [editingTurnstile, setEditingTurnstile] = useState(false);
  const [savingTurnstile, setSavingTurnstile] = useState(false);
  const [turnstileStatus, setTurnstileStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [turnstileMessage, setTurnstileMessage] = useState('');

  // Fonnte states
  const [editingFonnte, setEditingFonnte] = useState(false);
  const [savingFonnte, setSavingFonnte] = useState(false);
  const [testingFonnte, setTestingFonnte] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  // S3 Storage states
  const [editingS3, setEditingS3] = useState(false);
  const [savingS3, setSavingS3] = useState(false);
  const [testingS3, setTestingS3] = useState(false);
  const [s3Status, setS3Status] = useState<'idle' | 'success' | 'error'>('idle');
  const [s3Message, setS3Message] = useState('');

  // SMTP states
  const [editingSmtp, setEditingSmtp] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [smtpMessage, setSmtpMessage] = useState('');

  // Bank accounts states
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBankId, setEditingBankId] = useState<number | null>(null);
  const [savingBank, setSavingBank] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    is_primary: false,
  });

  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    company_logo: '',
    turnstile_site_key: '',
    turnstile_secret_key: '',
    fonnte_token: '',
    fonnte_test_target: '',
    fonnte_test_message: '',
    wa_invoice_template: '',
    s3_endpoint: '',
    s3_bucket_name: '',
    s3_region: '',
    s3_access_key: '',
    s3_secret_key: '',
    s3_public_url: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    smtp_from_email: '',
    smtp_from_name: '',
    smtp_encryption: 'tls',
    smtp_test_target: '',
    smtp_test_message: '',
    app_name: 'Invoice System',
  });

  useEffect(() => {
    fetchSettings();
    fetchBankAccounts();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingsAPI.get();
      setFormData({
        company_name: data.company_name || '',
        company_email: data.company_email || '',
        company_phone: data.company_phone || '',
        company_address: data.company_address || '',
        company_logo: data.company_logo || '',
        turnstile_site_key: data.turnstile_site_key || '',
        turnstile_secret_key: data.turnstile_secret_key || '',
        fonnte_token: data.fonnte_token || '',
        fonnte_test_target: data.fonnte_test_target || '',
        wa_invoice_template: data.wa_invoice_template || '',
        s3_endpoint: data.s3_endpoint || '',
        s3_bucket_name: data.s3_bucket_name || '',
        s3_region: data.s3_region || '',
        s3_access_key: data.s3_access_key || '',
        s3_secret_key: data.s3_secret_key || '',
        s3_public_url: data.s3_public_url || '',
        smtp_host: data.smtp_host || '',
        smtp_port: data.smtp_port || 587,
        smtp_user: data.smtp_user || '',
        smtp_pass: data.smtp_pass || '',
        smtp_from_email: data.smtp_from_email || '',
        smtp_from_name: data.smtp_from_name || '',
        smtp_encryption: data.smtp_encryption || 'tls',
        smtp_test_target: data.smtp_test_target || '',
        smtp_test_message: data.smtp_test_message || '',
        app_name: data.app_name || 'Invoice System',
      });
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, section: 'company' | 'turnstile' | 'all') => {
    e.preventDefault();

    if (section === 'company' && savingCompany) return;
    if (section === 'turnstile' && savingTurnstile) return;

    if (section === 'company') {
      setSavingCompany(true);
      try {
        await settingsAPI.update({
          company_name: formData.company_name,
          company_email: formData.company_email,
          company_phone: formData.company_phone,
          company_address: formData.company_address,
          company_logo: formData.company_logo,
        });
        setCompanyStatus('success');
        setCompanyMessage('Informasi perusahaan berhasil disimpan!');
        setTimeout(() => setCompanyStatus('idle'), 3000);
      } catch (error: any) {
        console.error('Error saving company settings:', error);
        setCompanyStatus('error');
        setCompanyMessage(error.message || 'Gagal menyimpan informasi perusahaan');
        setTimeout(() => setCompanyStatus('idle'), 3000);
      } finally {
        setSavingCompany(false);
      }
    } else if (section === 'turnstile') {
      setSavingTurnstile(true);
      try {
        await settingsAPI.updateSystem({
          turnstile_site_key: formData.turnstile_site_key,
          turnstile_secret_key: formData.turnstile_secret_key,
        });
        setTurnstileStatus('success');
        setTurnstileMessage('Konfigurasi Turnstile berhasil disimpan!');
        setTimeout(() => setTurnstileStatus('idle'), 3000);
      } catch (error: any) {
        console.error('Error saving turnstile settings:', error);
        setTurnstileStatus('error');
        setTurnstileMessage(error.message || 'Gagal menyimpan konfigurasi Turnstile');
        setTimeout(() => setTurnstileStatus('idle'), 3000);
      } finally {
        setSavingTurnstile(false);
      }
    } else {
      // Save all - exclude fonnte_test_target and app_name
      setSavingCompany(true);
      try {
        const { fonnte_test_target, app_name, ...dataWithoutTestTarget } = formData;
        await settingsAPI.update(dataWithoutTestTarget);
        setCompanyStatus('success');
        setCompanyMessage('Semua pengaturan berhasil disimpan!');
        setTimeout(() => setCompanyStatus('idle'), 3000);
      } catch (error: any) {
        console.error('Error saving all settings:', error);
        setCompanyStatus('error');
        setCompanyMessage(error.message || 'Gagal menyimpan pengaturan');
        setTimeout(() => setCompanyStatus('idle'), 3000);
      } finally {
        setSavingCompany(false);
      }
    }
  };

  const handleTestFonnteConnection = async () => {
    if (!formData.fonnte_token) {
      setConnectionStatus('error');
      setConnectionMessage('Masukkan Fonnte Token terlebih dahulu');
      return;
    }

    if (!formData.fonnte_test_target) {
      setConnectionStatus('error');
      setConnectionMessage('Masukkan Nomor Test WhatsApp terlebih dahulu');
      return;
    }

    setTestingFonnte(true);
    setConnectionStatus('idle');
    setConnectionMessage('');

    try {
      const result = await whatsappAPI.testConnection(
        formData.fonnte_token,
        formData.fonnte_test_target,
        formData.fonnte_test_message || 'Test connection from Invoice System'
      );

      if (result.success) {
        setConnectionStatus('success');
        setConnectionMessage(result.message);
      } else {
        setConnectionStatus('error');
        setConnectionMessage(result.message || result.error || 'Koneksi gagal. Periksa token Anda.');
      }
    } catch (error: any) {
      console.error('Test connection error:', error);
      setConnectionStatus('error');

      if (error.message.includes('Sesi Anda telah berakhir')) {
        setConnectionMessage(error.message);
      } else {
        setConnectionMessage(error.message || 'Gagal terhubung ke Fonnte API');
      }
    } finally {
      setTestingFonnte(false);
    }
  };

  const handleTestS3Connection = async () => {
    if (!formData.s3_endpoint || !formData.s3_bucket_name || !formData.s3_access_key || !formData.s3_secret_key) {
      setS3Status('error');
      setS3Message('Isi semua field yang diperlukan (Endpoint, Bucket, Access Key, Secret Key)');
      return;
    }

    setTestingS3(true);
    setS3Status('idle');
    setS3Message('');

    try {
      const result = await settingsAPI.testS3({
        s3_endpoint: formData.s3_endpoint,
        s3_bucket_name: formData.s3_bucket_name,
        s3_region: formData.s3_region || 'us-east-1',
        s3_access_key: formData.s3_access_key,
        s3_secret_key: formData.s3_secret_key,
      });

      if (result.success) {
        setS3Status('success');
        setS3Message(result.message);
      } else {
        setS3Status('error');
        setS3Message(result.message || 'Failed to connect to S3');
      }
    } catch (error: any) {
      console.error('Test S3 error:', error);
      setS3Status('error');
      setS3Message(error.message || 'Gagal terhubung ke S3');
    } finally {
      setTestingS3(false);
    }
  };

  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    try {
      await settingsAPI.updateSystem({
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port,
        smtp_user: formData.smtp_user,
        smtp_pass: formData.smtp_pass,
        smtp_from_email: formData.smtp_from_email,
        smtp_from_name: formData.smtp_from_name,
        smtp_encryption: formData.smtp_encryption,
      });
      setEditingSmtp(false);
      setSmtpStatus('success');
      setSmtpMessage('Konfigurasi SMTP berhasil disimpan!');
      setTimeout(() => setSmtpStatus('idle'), 3000);
    } catch (error: any) {
      setSmtpStatus('error');
      setSmtpMessage(error.message || 'Gagal menyimpan konfigurasi SMTP');
      setTimeout(() => setSmtpStatus('idle'), 3000);
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestSmtpConnection = async () => {
    if (!formData.smtp_host || !formData.smtp_port || !formData.smtp_user || !formData.smtp_pass || !formData.smtp_from_email) {
      setSmtpStatus('error');
      setSmtpMessage('Isi semua field konfigurasi SMTP terlebih dahulu');
      return;
    }

    setTestingSmtp(true);
    setSmtpStatus('idle');
    setSmtpMessage('');

    try {
      const result = await settingsAPI.testSmtp({
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port,
        smtp_user: formData.smtp_user,
        smtp_pass: formData.smtp_pass,
        smtp_from_email: formData.smtp_from_email,
        smtp_from_name: formData.smtp_from_name,
        smtp_encryption: formData.smtp_encryption,
        smtp_test_target: formData.smtp_test_target,
        smtp_test_message: formData.smtp_test_message || 'Test connection from Invoice System',
      });

      if (result.success) {
        setSmtpStatus('success');
        setSmtpMessage(result.message);
      } else {
        setSmtpStatus('error');
        setSmtpMessage(result.message || 'Failed to send test email');
      }
    } catch (error: any) {
      console.error('Test SMTP error:', error);
      setSmtpStatus('error');
      setSmtpMessage(error.message || 'Gagal mengirim email test');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSaveAppearance = async () => {
    setSavingAppearance(true);
    try {
      await settingsAPI.updateSystem({
        app_name: formData.app_name,
        primary_color: formData.primary_color,
        sidebar_color: formData.sidebar_color,
        company_logo: formData.company_logo,
      });

      // Update global app settings
      updateSettings({
        appName: formData.app_name,
        logoUrl: formData.company_logo || undefined,
      });

      setEditingAppearance(false);
      setAppearanceStatus('success');
      setAppearanceMessage('Pengaturan tampilan berhasil disimpan!');
      setTimeout(() => setAppearanceStatus('idle'), 3000);
    } catch (error: any) {
      setAppearanceStatus('error');
      setAppearanceMessage(error.message || 'Gagal menyimpan pengaturan tampilan');
      setTimeout(() => setAppearanceStatus('idle'), 3000);
    } finally {
      setSavingAppearance(false);
    }
  };

  // Bank Accounts functions
  const fetchBankAccounts = async () => {
    try {
      const data = await bankAccountsAPI.getAll();
      setBankAccounts(data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const handleAddBankAccount = async () => {
    if (!bankFormData.bank_name || !bankFormData.account_name || !bankFormData.account_number) {
      return;
    }

    setSavingBank(true);
    try {
      if (editingBankId) {
        await bankAccountsAPI.update(editingBankId, bankFormData);
      } else {
        await bankAccountsAPI.create(bankFormData);
      }
      setShowBankForm(false);
      setEditingBankId(null);
      setBankFormData({ bank_name: '', account_name: '', account_number: '', is_primary: false });
      fetchBankAccounts();
    } catch (error) {
      console.error('Error saving bank account:', error);
    } finally {
      setSavingBank(false);
    }
  };

  const handleEditBankAccount = (account: any) => {
    setEditingBankId(account.id);
    setBankFormData({
      bank_name: account.bank_name,
      account_name: account.account_name,
      account_number: account.account_number,
      is_primary: account.is_primary,
    });
    setShowBankForm(true);
  };

  const handleDeleteBankAccount = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus rekening ini?')) {
      try {
        await bankAccountsAPI.delete(id);
        fetchBankAccounts();
      } catch (error) {
        console.error('Error deleting bank account:', error);
      }
    }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      await bankAccountsAPI.setPrimary(id);
      fetchBankAccounts();
    } catch (error) {
      console.error('Error setting primary bank account:', error);
    }
  };

  const cancelBankForm = () => {
    setShowBankForm(false);
    setEditingBankId(null);
    setBankFormData({ bank_name: '', account_name: '', account_number: '', is_primary: false });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Pengaturan</h1>
        <p className="text-sm text-gray-500">Konfigurasi sistem, integrasi, dan tampilan aplikasi</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
          {/* Section 1: Company Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Informasi Perusahaan
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Perusahaan</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  disabled={!editingCompany}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="PT. Contoh Perusahaan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Perusahaan</label>
                <input
                  type="email"
                  value={formData.company_email}
                  onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                  disabled={!editingCompany}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="info@perusahaan.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telepon Perusahaan</label>
                <input
                  type="tel"
                  value={formData.company_phone}
                  onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                  disabled={!editingCompany}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="021-1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Perusahaan</label>
                <textarea
                  value={formData.company_address}
                  onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                  disabled={!editingCompany}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  rows={3}
                  placeholder="Jl. Contoh No. 123, Jakarta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Logo Perusahaan</label>
                <input
                  type="text"
                  value={formData.company_logo}
                  onChange={(e) => setFormData({ ...formData, company_logo: e.target.value })}
                  disabled={!editingCompany}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              {/* Bank Accounts Section */}
              <div className="pt-4 border-t border-gray-200 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800">Rekening Pembayaran</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBankForm(true);
                      setEditingBankId(null);
                      setBankFormData({ bank_name: '', account_name: '', account_number: '', is_primary: false });
                    }}
                    className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={14} />
                    Tambah Rekening
                  </button>
                </div>

                {/* Bank Accounts List */}
                <div className="space-y-3">
                  {bankAccounts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Belum ada rekening. Klik "Tambah Rekening" untuk menambah.</p>
                  ) : (
                    bankAccounts.map((account) => (
                      <div
                        key={account.id}
                        className={`border rounded-lg p-4 ${account.is_primary ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {account.is_primary && (
                                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                              )}
                              <span className="font-semibold text-gray-900">{account.bank_name}</span>
                              {account.is_primary && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Utama</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{account.account_name}</p>
                            <p className="text-sm font-mono text-gray-900 mt-1">{account.account_number}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!account.is_primary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(account.id)}
                                className="text-gray-400 hover:text-yellow-500 p-1"
                                title="Jadikan Utama"
                              >
                                <Star size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleEditBankAccount(account)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBankAccount(account.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bank Account Form Modal */}
                {showBankForm && (
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h4 className="text-sm font-bold text-gray-800 mb-3">
                      {editingBankId ? 'Edit Rekening' : 'Tambah Rekening Baru'}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Bank</label>
                        <input
                          type="text"
                          value={bankFormData.bank_name}
                          onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="BCA, Mandiri, BNI, dll"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Atas Nama</label>
                          <input
                            type="text"
                            value={bankFormData.account_name}
                            onChange={(e) => setBankFormData({ ...bankFormData, account_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Nama pemilik"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor Rekening</label>
                          <input
                            type="text"
                            value={bankFormData.account_number}
                            onChange={(e) => setBankFormData({ ...bankFormData, account_number: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="1234567890"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_primary"
                          checked={bankFormData.is_primary}
                          onChange={(e) => setBankFormData({ ...bankFormData, is_primary: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_primary" className="text-sm text-gray-700">Jadikan rekening utama</label>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleAddBankAccount}
                          disabled={savingBank}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          {savingBank ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                          {savingBank ? 'Menyimpan...' : 'Simpan'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelBankForm}
                          className="text-sm text-gray-600 hover:text-gray-800 py-2 px-4"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Edit/Save/Cancel Buttons for Company Info */}
            <div className="mt-4 flex items-center gap-3">
              {!editingCompany ? (
                <button
                  type="button"
                  onClick={() => setEditingCompany(true)}
                  className="flex items-center gap-1.5 border border-gray-300 hover:border-blue-500 hover:text-blue-600 text-gray-600 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors bg-white"
                >
              <ExternalLink size={14} />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      setSavingCompany(true);
                      try {
                        await settingsAPI.update({
                          company_name: formData.company_name,
                          company_email: formData.company_email,
                          company_phone: formData.company_phone,
                          company_address: formData.company_address,
                          company_logo: formData.company_logo,
                        });
                        setEditingCompany(false);
                        setCompanyStatus('success');
                        setCompanyMessage('Informasi perusahaan berhasil disimpan!');
                        setTimeout(() => setCompanyStatus('idle'), 3000);
                      } catch (error) {
                        console.error('Error saving settings:', error);
                        setCompanyStatus('error');
                        setCompanyMessage('Gagal menyimpan informasi perusahaan');
                        setTimeout(() => setCompanyStatus('idle'), 3000);
                      } finally {
                        setSavingCompany(false);
                      }
                    }}
                    disabled={savingCompany}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
                  >
                    {savingCompany ? (
                      <>
                      <Loader2 size={14} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                      <CheckCircle size={14} />
                        Simpan
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCompany(false);
                      fetchSettings(); // Reset form to original values
                    }}
                    className="flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                </>
              )}

              {companyStatus !== 'idle' && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  companyStatus === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {companyStatus === 'success' ? (
                    <CheckCircle size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  <span className="text-sm font-medium">{companyMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* BELOW ARE ADMIN-ONLY SECTIONS IN LEFT COLUMN */}
          {userRole === 'admin' && (
            <>
              {/* Section 1.5: Appearance Configuration */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
              <Palette size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Tampilan Aplikasi</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama Aplikasi
                </label>
                <input
                  type="text"
                  value={formData.app_name}
                  onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                  disabled={!editingAppearance}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Invoice System"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nama aplikasi yang akan ditampilkan di sidebar dan title halaman
                </p>
              </div>
            </div>

            {/* Edit/Save/Cancel Buttons for Appearance */}
            <div className="mt-4 flex items-center gap-3">
              {!editingAppearance ? (
                <button
                  type="button"
                  onClick={() => setEditingAppearance(true)}
                  className="flex items-center gap-1.5 border border-gray-300 hover:border-blue-500 hover:text-blue-600 text-gray-600 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors bg-white"
                >
                  <Edit size={14} />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveAppearance}
                    disabled={savingAppearance}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
                  >
                    {savingAppearance ? (
                      <>
                      <Loader2 size={14} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                      <CheckCircle size={14} />
                        Simpan
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingAppearance(false);
                      fetchSettings();
                    }}
                    className="flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                </>
              )}

              {appearanceStatus !== 'idle' && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  appearanceStatus === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {appearanceStatus === 'success' ? (
                    <CheckCircle size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  <span className="text-sm font-medium">{appearanceMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Cloudflare Turnstile Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Cloudflare Turnstile Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Turnstile Site Key
                </label>
                <input
                  type="text"
                  value={formData.turnstile_site_key}
                  onChange={(e) => setFormData({ ...formData, turnstile_site_key: e.target.value })}
                  disabled={!editingTurnstile}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Your Cloudflare Turnstile Site Key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dapatkan Site Key dari Cloudflare dashboard di{' '}
                  <a
                    href="https://dash.cloudflare.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    https://dash.cloudflare.com/
                    <ExternalLink size={12} />
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Turnstile Secret Key
                </label>
                <input
                  type="password"
                  value={formData.turnstile_secret_key}
                  onChange={(e) => setFormData({ ...formData, turnstile_secret_key: e.target.value })}
                  disabled={!editingTurnstile}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Your Cloudflare Turnstile Secret Key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Jaga Secret Key Anda dengan aman. Jangan bagikan ke siapapun.
                </p>
              </div>
            </div>

            {/* Edit/Save/Cancel Buttons for Turnstile */}
            <div className="mt-4 flex items-center gap-3">
              {!editingTurnstile ? (
                <button
                  type="button"
                  onClick={() => setEditingTurnstile(true)}
                  className="flex items-center gap-1.5 border border-gray-300 hover:border-blue-500 hover:text-blue-600 text-gray-600 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors bg-white"
                >
              <ExternalLink size={14} />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      setSavingTurnstile(true);
                      try {
                        await settingsAPI.update({
                          turnstile_site_key: formData.turnstile_site_key,
                          turnstile_secret_key: formData.turnstile_secret_key,
                        });
                        setEditingTurnstile(false);
                        setTurnstileStatus('success');
                        setTurnstileMessage('Konfigurasi Turnstile berhasil disimpan!');
                        setTimeout(() => setTurnstileStatus('idle'), 3000);
                      } catch (error) {
                        console.error('Error saving settings:', error);
                        setTurnstileStatus('error');
                        setTurnstileMessage('Gagal menyimpan konfigurasi Turnstile');
                        setTimeout(() => setTurnstileStatus('idle'), 3000);
                      } finally {
                        setSavingTurnstile(false);
                      }
                    }}
                    disabled={savingTurnstile}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
                  >
                    {savingTurnstile ? (
                      <>
                      <Loader2 size={14} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                      <CheckCircle size={14} />
                        Simpan
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingTurnstile(false);
                      fetchSettings(); // Reset form to original values
                    }}
                    className="flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                </>
              )}

              {turnstileStatus !== 'idle' && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  turnstileStatus === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {turnstileStatus === 'success' ? (
                    <CheckCircle size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  <span className="text-sm font-medium">{turnstileMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Fonnte WhatsApp Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Fonnte WhatsApp Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fonnte Token
                </label>
                <input
                  type="text"
                  value={formData.fonnte_token}
                  onChange={(e) => setFormData({ ...formData, fonnte_token: e.target.value })}
                  disabled={!editingFonnte}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Masukkan Fonnte Token Anda"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dapatkan token dari{' '}
                  <a
                    href="https://fonnte.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    https://fonnte.com
                    <ExternalLink size={12} />
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nomor Test WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.fonnte_test_target}
                  onChange={(e) => setFormData({ ...formData, fonnte_test_target: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nomor WhatsApp yang akan digunakan untuk testing. Pesan test akan dikirim ke nomor ini.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Pesan Test (Opsional)
                </label>
                <textarea
                  value={formData.fonnte_test_message}
                  onChange={(e) => setFormData({ ...formData, fonnte_test_message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Test message from Invoice System (kosongkan untuk default)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pesan yang akan dikirim saat Anda klik "Test Connection".
                </p>
              </div>

              {/* Edit/Save/Cancel/Test Buttons for Fonnte */}
              <div className="flex items-start gap-4 flex-wrap">
                {!editingFonnte ? (
                  <button
                    type="button"
                    onClick={() => setEditingFonnte(true)}
                    className="flex items-center gap-1.5 border border-gray-300 hover:border-blue-500 hover:text-blue-600 text-gray-600 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors bg-white"
                  >
                <ExternalLink size={14} />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        setSavingFonnte(true);
                        setConnectionStatus('idle');
                        setConnectionMessage('');
                        try {
                          await settingsAPI.updateSystem({ fonnte_token: formData.fonnte_token });
                          setEditingFonnte(false);
                          setConnectionStatus('success');
                          setConnectionMessage('Token Fonnte berhasil disimpan!');
                          setTimeout(() => {
                            setConnectionStatus('idle');
                            setConnectionMessage('');
                          }, 3000);
                        } catch (error) {
                          console.error('Error saving fonnte token:', error);
                          setConnectionStatus('error');
                          setConnectionMessage('Gagal menyimpan token Fonnte');
                          setTimeout(() => {
                            setConnectionStatus('idle');
                            setConnectionMessage('');
                          }, 3000);
                        } finally {
                          setSavingFonnte(false);
                        }
                      }}
                      disabled={savingFonnte}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
                    >
                      {savingFonnte ? (
                        <>
                        <Loader2 size={14} className="animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                        <CheckCircle size={14} />
                          Simpan
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingFonnte(false);
                        fetchSettings(); // Reset form to original values
                      }}
                      className="flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
                    >
                      Batal
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleTestFonnteConnection}
                  disabled={testingFonnte || !formData.fonnte_token}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
                >
                  {testingFonnte ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Test Connection
                    </>
                  )}
                </button>

                {connectionStatus !== 'idle' && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    connectionStatus === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {connectionStatus === 'success' ? (
                      <CheckCircle size={18} />
                    ) : (
                      <XCircle size={18} />
                    )}
                    <span className="text-sm font-medium">{connectionMessage}</span>
                  </div>
                )}
              </div>

              {connectionStatus === 'idle' && connectionMessage && (
                <p className="text-sm text-gray-600">{connectionMessage}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>

        {/* RIGHT COLUMN - ADMIN ONLY */}
        {userRole === 'admin' && (
          <div className="space-y-6">
          {/* Section 4: S3 Compatible Storage Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">S3 Compatible Storage</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  S3 Endpoint
                </label>
                <input
                  type="text"
                  value={formData.s3_endpoint}
                  onChange={(e) => setFormData({ ...formData, s3_endpoint: e.target.value })}
                  disabled={!editingS3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="https://s3.amazonaws.com or https://minio.example.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL endpoint S3. Untuk MinIO atau S3-compatible lainnya, gunakan URL lokal Anda.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bucket Name
                </label>
                <input
                  type="text"
                  value={formData.s3_bucket_name}
                  onChange={(e) => setFormData({ ...formData, s3_bucket_name: e.target.value })}
                  disabled={!editingS3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="my-invoice-bucket"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Region
                </label>
                <input
                  type="text"
                  value={formData.s3_region}
                  onChange={(e) => setFormData({ ...formData, s3_region: e.target.value })}
                  disabled={!editingS3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="us-east-1 atau kosongkan untuk MinIO"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Access Key
                </label>
                <input
                  type="password"
                  value={formData.s3_access_key}
                  onChange={(e) => setFormData({ ...formData, s3_access_key: e.target.value })}
                  disabled={!editingS3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Your S3 Access Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={formData.s3_secret_key}
                  onChange={(e) => setFormData({ ...formData, s3_secret_key: e.target.value })}
                  disabled={!editingS3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Your S3 Secret Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Public URL (Optional)
                </label>
                <input
                  type="text"
                  value={formData.s3_public_url}
                  onChange={(e) => setFormData({ ...formData, s3_public_url: e.target.value })}
                  disabled={!editingS3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="https://cdn.example.com (untuk akses publik)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL publik untuk mengakses file. Kosongkan jika menggunakan endpoint default.
                </p>
              </div>
            </div>

            {/* Edit/Save/Cancel/Test Buttons for S3 */}
            <div className="mt-6 flex items-center gap-4 flex-wrap">
              {!editingS3 ? (
                <button
                  type="button"
                  onClick={() => setEditingS3(true)}
                  className="flex items-center gap-1.5 border border-gray-300 hover:border-blue-500 hover:text-blue-600 text-gray-600 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors bg-white"
                >
              <ExternalLink size={14} />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      setSavingS3(true);
                      try {
                        await settingsAPI.updateSystem({
                          s3_endpoint: formData.s3_endpoint,
                          s3_bucket_name: formData.s3_bucket_name,
                          s3_region: formData.s3_region,
                          s3_access_key: formData.s3_access_key,
                          s3_secret_key: formData.s3_secret_key,
                          s3_public_url: formData.s3_public_url,
                        });
                        setEditingS3(false);
                        setS3Status('success');
                        setS3Message('Konfigurasi S3 berhasil disimpan!');
                        setTimeout(() => {
                          setS3Status('idle');
                          setS3Message('');
                        }, 3000);
                      } catch (error) {
                        console.error('Error saving S3 settings:', error);
                        setS3Status('error');
                        setS3Message('Gagal menyimpan konfigurasi S3');
                        setTimeout(() => {
                          setS3Status('idle');
                          setS3Message('');
                        }, 3000);
                      } finally {
                        setSavingS3(false);
                      }
                    }}
                    disabled={savingS3}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
                  >
                    {savingS3 ? (
                      <>
                      <Loader2 size={14} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                      <CheckCircle size={14} />
                        Simpan
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingS3(false);
                      fetchSettings(); // Reset form to original values
                    }}
                    className="flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleTestS3Connection}
                disabled={testingS3 || !formData.s3_endpoint || !formData.s3_bucket_name || !formData.s3_access_key || !formData.s3_secret_key}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
              >
                {testingS3 ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                <ExternalLink size={14} />
                    Test Connection
                  </>
                )}
              </button>

              {s3Status !== 'idle' && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  s3Status === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {s3Status === 'success' ? (
                    <CheckCircle size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  <span className="text-sm font-medium">{s3Message}</span>
                </div>
              )}
            </div>

            {s3Status === 'idle' && s3Message && (
              <p className="text-sm text-gray-600 mt-4">{s3Message}</p>
            )}

            {/* S3 Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Supported Services:</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Amazon S3</li>
                <li>• MinIO</li>
                <li>• DigitalOcean Spaces</li>
                <li>• Linode Object Storage</li>
                <li>• Cloudflare R2</li>
                <li>• Backblaze B2</li>
              </ul>
            </div>
          </div>

          {/* Section 5: SMTP Email Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">SMTP Email Configuration</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  SMTP Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.smtp_host}
                  onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                  disabled={!editingSmtp}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Port</label>
                  <input
                    type="number"
                    value={formData.smtp_port}
                    onChange={(e) => setFormData({ ...formData, smtp_port: Number(e.target.value) })}
                    disabled={!editingSmtp}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="587"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Encryption</label>
                  <select
                    value={formData.smtp_encryption}
                    onChange={(e) => setFormData({ ...formData, smtp_encryption: e.target.value })}
                    disabled={!editingSmtp}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                <input
                  type="text"
                  value={formData.smtp_user}
                  onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                  disabled={!editingSmtp}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={formData.smtp_pass}
                  onChange={(e) => setFormData({ ...formData, smtp_pass: e.target.value })}
                  disabled={!editingSmtp}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">From Email</label>
                <input
                  type="email"
                  value={formData.smtp_from_email}
                  onChange={(e) => setFormData({ ...formData, smtp_from_email: e.target.value })}
                  disabled={!editingSmtp}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="noreply@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">From Name</label>
                <input
                  type="text"
                  value={formData.smtp_from_name}
                  onChange={(e) => setFormData({ ...formData, smtp_from_name: e.target.value })}
                  disabled={!editingSmtp}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="My Company"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Test Email</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Test
                    </label>
                    <input
                      type="email"
                      value={formData.smtp_test_target}
                      onChange={(e) => setFormData({ ...formData, smtp_test_target: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="recipient@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email yang akan menerima email test
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Pesan Test (Opsional)
                    </label>
                    <textarea
                      value={formData.smtp_test_message}
                      onChange={(e) => setFormData({ ...formData, smtp_test_message: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Test message from Invoice System (kosongkan untuk default)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Pesan yang akan dikirim saat Anda klik "Test Koneksi".
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit/Save/Cancel/Test Buttons for SMTP */}
            <div className="flex items-start gap-4 flex-wrap">
              {!editingSmtp ? (
                <button
                  type="button"
                  onClick={() => setEditingSmtp(true)}
                  className="flex items-center gap-1.5 border border-gray-300 hover:border-blue-500 hover:text-blue-600 text-gray-600 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors bg-white"
                >
                  <Edit size={14} />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveSmtp}
                    disabled={savingSmtp}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
                  >
                    {savingSmtp ? (
                      <>
                      <Loader2 size={14} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                      <CheckCircle size={14} />
                        Simpan
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingSmtp(false);
                      fetchSettings();
                    }}
                    className="flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleTestSmtpConnection}
                disabled={testingSmtp || !formData.smtp_host || !formData.smtp_port || !formData.smtp_user || !formData.smtp_pass || !formData.smtp_from_email || !formData.smtp_test_target}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
              >
                {testingSmtp ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    Test Koneksi
                  </>
                )}
              </button>

              {smtpStatus !== 'idle' && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  smtpStatus === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {smtpStatus === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  <span className="text-sm font-medium">{smtpMessage}</span>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Contoh Konfigurasi:</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Gmail:</strong> Host: smtp.gmail.com, Port: 587, Encryption: TLS</li>
                <li>• <strong>Outlook:</strong> Host: smtp-mail.outlook.com, Port: 587, Encryption: TLS</li>
                <li>• <strong>Yahoo:</strong> Host: smtp.mail.yahoo.com, Port: 465, Encryption: SSL</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
