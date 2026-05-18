import { useState, useEffect } from 'react';
import { User, ShieldCheck, Mail, Globe, MapPin, Phone, Smartphone, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { useUser } from '../lib/stackAuth';
import { settingsAPI } from '../lib/api';
import RegionSelect from '../components/RegionSelect';
import { SkeletonBlock, SkeletonCard } from '../components/LoadingSkeleton';
import authService from '../lib/authService';
import { toast } from '../components/Toast';

export default function ProfilePage() {
  const user = useUser();
  const [loading, setLoading] = useState(true);

  // Edit mode states
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [profileName, setProfileName] = useState('');

  const [editingPassword, setEditingPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  const [billingInfo, setBillingInfo] = useState({
    company_name: '',
    company_website: '',
    company_address: '',
    company_postal_code: '',
    company_country: 'Indonesia',
    company_phone: '',
    company_mobile_phone: '',
    company_email: '',
    // Region fields
    province_id: '',
    regency_id: '',
    district_id: '',
    village_id: '',
    province_name: '',
    regency_name: '',
    district_name: '',
    village_name: '',
  });

  const fetchBillingInfo = async () => {
    try {
      const data = await settingsAPI.get();
      setBillingInfo({
        company_name: data.company_name || '',
        company_website: data.company_website || '',
        company_address: data.company_address || '',
        company_postal_code: data.company_postal_code || '',
        company_country: data.company_country || 'Indonesia',
        company_phone: data.company_phone || '',
        company_mobile_phone: data.company_mobile_phone || '',
        company_email: data.company_email || '',
        province_id: data.province_id || '',
        regency_id: data.regency_id || '',
        district_id: data.district_id || '',
        village_id: data.village_id || '',
        province_name: data.province_name || '',
        regency_name: data.regency_name || '',
        district_name: data.district_name || '',
        village_name: data.village_name || '',
      });
    } catch (err) {
      console.error('Failed to fetch billing info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const handleSaveCustomer = async () => {
    setSavingCustomer(true);
    try {
      await settingsAPI.update(billingInfo);
      setEditingCustomer(false);
      toast.success('Billing information updated successfully');
    } catch (err: any) {
      console.error('Failed to save billing info:', err);
      toast.error(err.message || 'Failed to update billing information');
    } finally {
      setSavingCustomer(false);
    }
  };

  useEffect(() => {
    if (user?.displayName) {
      setProfileName(user.displayName);
    }
  }, [user?.displayName]);

  const handleSaveName = async () => {
    if (!profileName.trim()) return;
    setSavingName(true);
    try {
      const parts = profileName.trim().split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || '-';
      
      await authService.updateProfile(firstName, lastName);
      setEditingName(false);
      toast.success('Nama profil berhasil diperbarui');
      
      // Update local storage sync
      localStorage.setItem('auth_sync', Date.now().toString());
    } catch (err: any) {
      console.error('Failed to save name:', err);
      toast.error(err.message || 'Gagal memperbarui nama profil');
    } finally {
      setSavingName(false);
    }
  };

  const handleSavePassword = async () => {
    setSavingPassword(true);
    try {
      await new Promise(res => setTimeout(res, 800));
      setEditingPassword(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err) {
      console.error('Failed to save password:', err);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 border-b border-separator pb-5">
          <SkeletonBlock width="150px" height="32px" className="mb-2" />
          <SkeletonBlock width="250px" height="20px" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-5">
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Page Header */}
      <div className="mb-6 border-b border-separator pb-5">
        <h1 className="text-2xl font-bold text-tx-main mb-1">Profile</h1>
        <p className="text-sm text-tx-muted">Manage your profile and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
          {/* Section 1: Profile Information */}
          <div className="bg-surface rounded-lg shadow-sm border border-separator p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-tx-main">Personal Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-tx-muted mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  disabled={!editingName}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2.5 border border-separator rounded-lg text-sm text-tx-main focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-surface-2 disabled:text-tx-muted disabled:cursor-not-allowed"
                />
              </div>

              <div className="mt-4 flex items-center gap-3">
                {!editingName ? (
                  <button
                    type="button"
                    onClick={() => setEditingName(true)}
                    className="flex items-center gap-1.5 border border-gray-300 hover:border-blue-500 hover:text-blue-600 text-tx-muted text-sm font-medium py-1.5 px-3 rounded-lg transition-colors bg-surface"
                  >
                    <ExternalLink size={14} />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={savingName || !profileName.trim()}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
                    >
                      {savingName ? (
                        <><Loader2 size={14} className="animate-spin" /> Saving...</>
                      ) : (
                        <><CheckCircle size={14} /> Save</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingName(false); setProfileName(user?.displayName || ''); }}
                      className="flex items-center gap-1.5 border border-gray-300 bg-surface hover:bg-surface-2 text-tx-muted text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Email Account */}
          <div className="bg-surface rounded-lg shadow-sm border border-separator p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-tx-main">Account Email</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-tx-muted mb-3 block">Primary email used for login and important notifications. This email cannot be changed.</p>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-subtle" />
                  <input
                    type="text"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2.5 pl-10 border border-separator rounded-lg text-sm text-tx-muted bg-surface-2 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Security & Password */}
          <div className="bg-surface rounded-lg shadow-sm border border-separator p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-tx-main">Security & Password</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-tx-muted mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  disabled={!editingPassword}
                  className="w-full px-3 py-2.5 border border-separator rounded-lg text-sm text-tx-main focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-surface-2 disabled:text-tx-muted disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-tx-muted mb-1.5">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  disabled={!editingPassword}
                  className="w-full px-3 py-2.5 border border-separator rounded-lg text-sm text-tx-main focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-surface-2 disabled:text-tx-muted disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-tx-muted mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  disabled={!editingPassword}
                  className="w-full px-3 py-2.5 border border-separator rounded-lg text-sm text-tx-main focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-surface-2 disabled:text-tx-muted disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>

              <div className="mt-4 flex items-center gap-3">
                {!editingPassword ? (
                  <button
                    type="button"
                    onClick={() => setEditingPassword(true)}
                    className="flex items-center gap-1.5 border border-gray-300 hover:border-blue-500 hover:text-blue-600 text-tx-muted text-sm font-medium py-1.5 px-3 rounded-lg transition-colors bg-surface"
                  >
                    <ExternalLink size={14} />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSavePassword}
                      disabled={savingPassword || !passwordData.current || !passwordData.new || passwordData.new !== passwordData.confirm}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
                    >
                      {savingPassword ? (
                        <><Loader2 size={14} className="animate-spin" /> Saving...</>
                      ) : (
                        <><CheckCircle size={14} /> Save</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingPassword(false); setPasswordData({ current: '', new: '', confirm: '' }); }}
                      className="flex items-center gap-1.5 border border-gray-300 bg-surface hover:bg-surface-2 text-tx-muted text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          {/* Section 4: Address & Billing Information */}
          <div className="bg-surface rounded-lg shadow-sm border border-separator p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-tx-main">Address & Billing Information</h2>
            </div>

            <div className="space-y-4">
              {/* Company / Entity Name */}
              <div>
                <label className="block text-sm font-medium text-tx-muted mb-1.5">Entity / Company Name</label>
                <input
                  type="text"
                  value={billingInfo.company_name}
                  onChange={(e) => setBillingInfo({ ...billingInfo, company_name: e.target.value })}
                  disabled={!editingCustomer}
                  placeholder="Full name or company name"
                  className="w-full px-3 py-2.5 border border-separator rounded-lg text-sm text-tx-main placeholder:text-tx-subtle focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-surface-2 disabled:text-tx-muted disabled:cursor-not-allowed"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-tx-muted mb-1.5">Website</label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-subtle" />
                  <input
                    type="text"
                    value={billingInfo.company_website}
                    onChange={(e) => setBillingInfo({ ...billingInfo, company_website: e.target.value })}
                    disabled={!editingCustomer}
                    placeholder="https://example.com"
                    className="w-full pl-10 pr-3 py-2.5 border border-separator rounded-lg text-sm text-tx-main placeholder:text-tx-subtle focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-surface-2 disabled:text-tx-muted disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-sm font-medium text-tx-muted mb-1.5">Street Address</label>
                <input
                  type="text"
                  value={billingInfo.company_address}
                  onChange={(e) => setBillingInfo({ ...billingInfo, company_address: e.target.value })}
                  disabled={!editingCustomer}
                  placeholder="Street name, house no., RT/RW"
                  className="w-full px-3 py-2.5 border border-separator rounded-lg text-sm text-tx-main placeholder:text-tx-subtle focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-surface-2 disabled:text-tx-muted disabled:cursor-not-allowed"
                />
              </div>

              {/* Region Dropdowns — only shown in edit mode */}
              {editingCustomer ? (
                <div>
                  <label className="block text-sm font-medium text-tx-muted mb-2">Region</label>
                  <RegionSelect
                    provinceId={billingInfo.province_id}
                    regencyId={billingInfo.regency_id}
                    districtId={billingInfo.district_id}
                    villageId={billingInfo.village_id}
                    onProvinceChange={(id, name) =>
                      setBillingInfo({ ...billingInfo, province_id: id, province_name: name, regency_id: '', regency_name: '', district_id: '', district_name: '', village_id: '', village_name: '' })
                    }
                    onRegencyChange={(id, name) =>
                      setBillingInfo({ ...billingInfo, regency_id: id, regency_name: name, district_id: '', district_name: '', village_id: '', village_name: '' })
                    }
                    onDistrictChange={(id, name) =>
                      setBillingInfo({ ...billingInfo, district_id: id, district_name: name, village_id: '', village_name: '' })
                    }
                    onVillageChange={(id, name) =>
                      setBillingInfo({ ...billingInfo, village_id: id, village_name: name })
                    }
                  />
                </div>
              ) : (
                /* View mode: show names as read-only fields */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-tx-muted mb-1.5">Province</label>
                    <input
                      type="text"
                      value={billingInfo.province_name}
                      disabled
                      className="w-full px-3 py-2.5 border border-separator rounded-lg text-sm text-tx-muted bg-surface-2 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-tx-muted mb-1.5">Regency / City</label>
                    <input
                      type="text"
                      value={billingInfo.regency_name}
                      disabled
                      className="w-full px-3 py-2.5 border border-separator rounded-lg text-sm text-tx-muted bg-surface-2 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-tx-muted mb-1.5">District</label>
                    <input
                      type="text"
                      value={billingInfo.district_name}
                      disabled
                      className="w-full px-3 py-2.5 border border-separator rounded-lg text-sm text-tx-muted bg-surface-2 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-tx-muted mb-1.5">Village</label>
                    <input
                      type="text"
                      value={billingInfo.village_name}
                      disabled
                      className="w-full px-3 py-2.5 border border-separator rounded-lg text-sm text-tx-muted bg-surface-2 cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              {/* Postal Code & Country */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-tx-muted mb-1.5">Postal Code</label>
                  <input
                    type="text"
                    value={billingInfo.company_postal_code}
                    onChange={(e) => setBillingInfo({ ...billingInfo, company_postal_code: e.target.value })}
                    disabled={!editingCustomer}
                    className="w-full px-3 py-2.5 border border-separator rounded-lg text-sm text-tx-main focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-surface-2 disabled:text-tx-muted disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-tx-muted mb-1.5">Country</label>
                  <input
                    type="text"
                    value={billingInfo.company_country}
                    onChange={(e) => setBillingInfo({ ...billingInfo, company_country: e.target.value })}
                    disabled={!editingCustomer}
                    className="w-full px-3 py-2.5 border border-separator rounded-lg text-sm text-tx-main focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-surface-2 disabled:text-tx-muted disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-tx-muted mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-subtle" />
                    <input
                      type="text"
                      value={billingInfo.company_phone}
                      onChange={(e) => setBillingInfo({ ...billingInfo, company_phone: e.target.value })}
                      disabled={!editingCustomer}
                      placeholder="021-xxxx"
                      className="w-full pl-10 pr-3 py-2.5 border border-separator rounded-lg text-sm text-tx-main placeholder:text-tx-subtle focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-surface-2 disabled:text-tx-muted disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-tx-muted mb-1.5">WhatsApp / Mobile</label>
                  <div className="relative">
                    <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-subtle" />
                    <input
                      type="text"
                      value={billingInfo.company_mobile_phone}
                      onChange={(e) => setBillingInfo({ ...billingInfo, company_mobile_phone: e.target.value })}
                      disabled={!editingCustomer}
                      placeholder="081xxx"
                      className="w-full pl-10 pr-3 py-2.5 border border-separator rounded-lg text-sm text-tx-main placeholder:text-tx-subtle focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-surface-2 disabled:text-tx-muted disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save / Cancel Buttons */}
            <div className="mt-5 flex items-center gap-3">
              {!editingCustomer ? (
                <button
                  type="button"
                  onClick={() => setEditingCustomer(true)}
                  className="flex items-center gap-1.5 border border-gray-300 hover:border-blue-500 hover:text-blue-600 text-tx-muted text-sm font-medium py-1.5 px-3 rounded-lg transition-colors bg-surface"
                >
                  <ExternalLink size={14} />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveCustomer}
                    disabled={savingCustomer}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors"
                  >
                    {savingCustomer ? (
                      <><Loader2 size={14} className="animate-spin" /> Saving...</>
                    ) : (
                      <><CheckCircle size={14} /> Save</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingCustomer(false); fetchBillingInfo(); }}
                    className="flex items-center gap-1.5 border border-gray-300 bg-surface hover:bg-surface-2 text-tx-muted text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
