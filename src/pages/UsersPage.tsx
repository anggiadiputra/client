import { useState, useEffect, useCallback } from 'react';
import { Shield, Search, Plus, ChevronLeft, ChevronRight, CheckSquare, Square, Edit2, Trash2, X, XCircle, Loader2, Mail, Building2, Crown } from 'lucide-react';
import { usersAPI, plansAPI } from '../lib/api';
import { toTitleCase } from '../lib/formatter';
import { User } from '../types';
import { SkeletonTable } from '../components/LoadingSkeleton';
import DropdownFilter from '../components/DropdownFilter';
import CompactBatchActions from '../components/CompactBatchActions';
import KeyboardShortcutWrapper from '../components/KeyboardShortcutWrapper';
import { toast } from '../components/Toast';

const PAGE_SIZE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    role: 'user',
    status: 'active'
  });

  // Lifetime plan state
  const [showLifetimeModal, setShowLifetimeModal] = useState(false);
  const [lifetimeUser, setLifetimeUser] = useState<User | null>(null);
  const [lifetimeAction, setLifetimeAction] = useState<'grant' | 'revoke'>('grant');
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [lifetimeLoading, setLifetimeLoading] = useState(false);
  const [userSubscriptions, setUserSubscriptions] = useState<Record<number, any>>({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const json = await usersAPI.getAll(page, PAGE_SIZE, searchTerm, statusFilter);
      if (json.pagination) {
        setUsers(json.users || []);
        setTotalPages(json.pagination.totalPages);
      } else {
        setUsers(json.users || []);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const paginated = users; // Now using server-side results directly

  const handleEdit = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      company_name: user.company_name || '',
      role: user.role,
      status: user.status || 'active'
    });
    setShowModal(true);
  };

  // Fetch plans once
  useEffect(() => {
    plansAPI.getAll().then((data: any[]) => {
      // Exclude free plan from lifetime grant options
      setPlans(data.filter((p: any) => p.slug !== 'free'));
    }).catch(console.error);
  }, []);

  const openLifetimeModal = async (user: User) => {
    setLifetimeUser(user);
    setSelectedPlanId('');
    // Fetch current subscription to determine if already lifetime
    try {
      const sub = await usersAPI.getSubscription(user.id);
      setUserSubscriptions(prev => ({ ...prev, [user.id]: sub }));
      setLifetimeAction(sub?.is_lifetime ? 'revoke' : 'grant');
    } catch {
      setLifetimeAction('grant');
    }
    setShowLifetimeModal(true);
  };

  const handleLifetimeSubmit = async () => {
    if (!lifetimeUser) return;
    if (lifetimeAction === 'grant' && !selectedPlanId) {
      toast.error('Pilih paket terlebih dahulu');
      return;
    }
    setLifetimeLoading(true);
    try {
      if (lifetimeAction === 'grant') {
        await usersAPI.grantLifetime(lifetimeUser.id, selectedPlanId);
        const planName = plans.find(p => String(p.id) === selectedPlanId)?.name || 'Plan';
        toast.success(`Lifetime ${planName} berhasil diberikan ke ${lifetimeUser.email}`);
        setUserSubscriptions(prev => ({ ...prev, [lifetimeUser.id]: { is_lifetime: true } }));
      } else {
        await usersAPI.revokeLifetime(lifetimeUser.id);
        toast.success(`Lifetime plan berhasil dicabut dari ${lifetimeUser.email}`);
        setUserSubscriptions(prev => ({ ...prev, [lifetimeUser.id]: { is_lifetime: false } }));
      }
      setShowLifetimeModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses lifetime plan');
    } finally {
      setLifetimeLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user ${user.email}?`)) return;
    try {
      await usersAPI.delete(user.id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) return;
    setIsBatchLoading(true);
    try {
      await usersAPI.batchDelete(selectedIds);
      toast.success(`${selectedIds.length} users deleted`);
      setSelectedIds([]);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to batch delete users');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    try {
      await usersAPI.update(selectedUser.id, formData);
      toast.success('User updated successfully');
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map(u => u.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getRoleBadge = (role: string) =>
    role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';

  const getStatusBadge = (status: string) =>
    status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Users</h1>
          <p className="text-sm text-gray-500">Manage system users and their access levels</p>
        </div>
        <button
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shrink-0"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama, email, atau perusahaan..."
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
            {users.length} user{users.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button
              onClick={fetchUsers}
              className="text-sm px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              Retry
            </button>
          </div>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role/Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Company</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        {searchTerm || statusFilter ? 'No users found matching your filters.' : 'No users yet.'}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((user) => (
                      <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(user.id) ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => toggleSelect(user.id)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            {selectedIds.includes(user.id) ? (
                              <CheckSquare size={18} className="text-blue-600" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {toTitleCase(`${user.first_name} ${user.last_name}`)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="text-sm text-gray-700">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getRoleBadge(user.role)}`}>
                              <Shield size={10} />
                              {user.role}
                            </span>
                            <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(user.status || 'active')}`}>
                              {user.status || 'active'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                          <div className="text-sm text-gray-700">
                            {user.company_name ? toTitleCase(user.company_name) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openLifetimeModal(user)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                userSubscriptions[user.id]?.is_lifetime
                                  ? 'text-yellow-500 hover:bg-yellow-50'
                                  : 'text-gray-400 hover:bg-gray-50'
                              }`}
                              title={userSubscriptions[user.id]?.is_lifetime ? 'Cabut Lifetime' : 'Grant Lifetime'}
                            >
                              <Crown size={16} />
                            </button>
                            <button onClick={() => handleEdit(user)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(user)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
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
                  {searchTerm || statusFilter ? 'No users found matching your filters.' : 'No users yet.'}
                </div>
              ) : (
                paginated.map((user) => (
                  <div key={user.id} className={`p-4 bg-white rounded-xl shadow-sm border border-gray-100 mb-3 mx-2 hover:shadow-md transition-all ${selectedIds.includes(user.id) ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100' : ''}`}>
                    <div className="flex items-start gap-4">
                      <button 
                        onClick={() => toggleSelect(user.id)}
                        className="mt-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {selectedIds.includes(user.id) ? (
                          <CheckSquare size={20} className="text-blue-600" />
                        ) : (
                          <Square size={20} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-extrabold shrink-0 border-2 border-white shadow-sm">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-extrabold text-gray-900 tracking-tight truncate">
                                {toTitleCase(`${user.first_name} ${user.last_name}`)}
                              </h3>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Mail size={10} className="text-gray-400" />
                                <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 ml-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getRoleBadge(user.role)}`}>
                              <Shield size={10} />
                              {user.role}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadge(user.status || 'active')}`}>
                              {user.status || 'active'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md">
                            <Building2 size={12} className="text-gray-400" />
                            <span className="truncate max-w-[120px]">
                              {user.company_name ? toTitleCase(user.company_name) : 'Tanpa Perusahaan'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
                            <button
                              onClick={() => openLifetimeModal(user)}
                              className={`p-1.5 rounded-md transition-all hover:bg-white hover:shadow-sm ${
                                userSubscriptions[user.id]?.is_lifetime ? 'text-yellow-500' : 'text-gray-400'
                              }`}
                              title={userSubscriptions[user.id]?.is_lifetime ? 'Cabut Lifetime' : 'Grant Lifetime'}
                            >
                              <Crown size={14} />
                            </button>
                            <button onClick={() => handleEdit(user)} className="p-1.5 text-amber-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="Edit"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(user)} className="p-1.5 text-red-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
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
      {/* Lifetime Plan Modal */}
      {showLifetimeModal && lifetimeUser && (
        <KeyboardShortcutWrapper onClose={() => setShowLifetimeModal(false)} disabled={lifetimeLoading}>
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full my-8 overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Crown size={18} className="text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {lifetimeAction === 'grant' ? 'Grant Lifetime Plan' : 'Cabut Lifetime Plan'}
                  </h2>
                  <p className="text-xs text-gray-500">{lifetimeUser.email}</p>
                </div>
              </div>
              <button onClick={() => setShowLifetimeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {lifetimeAction === 'grant' ? (
                <>
                  <p className="text-sm text-gray-600">
                    Pilih paket yang akan diberikan secara <strong>lifetime (seumur hidup)</strong> tanpa biaya berulang.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Paket</label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                    >
                      <option value="">-- Pilih paket --</option>
                      {plans.map((plan: any) => (
                        <option key={plan.id} value={String(plan.id)}>
                          {plan.name} — Rp {Number(plan.price_monthly).toLocaleString('id-ID')}/bln
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                    ⚡ User akan mendapatkan akses paket ini tanpa batas waktu. Admin dapat mencabutnya kapan saja.
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    User ini saat ini memiliki <strong>lifetime plan</strong>. Mencabut akses akan memberikan grace period <strong>30 hari</strong> sebelum berakhir.
                  </p>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    ⚠️ Setelah dicabut, user perlu berlangganan secara reguler untuk melanjutkan akses.
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleLifetimeSubmit}
                  disabled={lifetimeLoading || (lifetimeAction === 'grant' && !selectedPlanId)}
                  className={`flex-1 flex items-center justify-center gap-2 font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50 ${
                    lifetimeAction === 'grant'
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {lifetimeLoading ? <Loader2 size={16} className="animate-spin" /> : <Crown size={16} />}
                  {lifetimeAction === 'grant' ? 'Grant Lifetime' : 'Cabut Lifetime'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLifetimeModal(false)}
                  className="px-5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </KeyboardShortcutWrapper>
      )}

      {/* User Edit Modal */}
      {showModal && (
        <KeyboardShortcutWrapper onClose={() => setShowModal(false)} disabled={saving}>
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full my-8 overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {modalMode === 'edit' ? 'Edit User' : 'Add User'}
                </h2>
                <p className="text-sm text-gray-500">{selectedUser?.email}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-600">
                  <XCircle size={14} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </KeyboardShortcutWrapper>
      )}
    </div>
  );
}
