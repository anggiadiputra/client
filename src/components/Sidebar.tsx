import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BarChart, FileText, Settings, BarChart3, LayoutTemplate, X, Plane,
  CreditCard, Crown, Wallet, TrendingUp
} from 'lucide-react';
import { useAppSettings } from '../context/AppContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { settings, userRole, subscription, wallet } = useAppSettings();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'customers', label: 'Pelanggan', icon: Users, path: '/customers' },
    { id: 'services', label: 'Layanan', icon: BarChart, path: '/services' },
    { id: 'invoices', label: 'Daftar Invoice', icon: FileText, path: '/invoices' },
    { id: 'revenue', label: 'Pendapatan', icon: TrendingUp, path: '/revenue' },
    { id: 'billing', label: 'Tagihan & Saldo', icon: CreditCard, path: '/billing' },
    { id: 'pricing', label: 'Paket Langganan', icon: Crown, path: '/pricing' },
    { id: 'logs', label: 'Riwayat Log', icon: BarChart3, path: '/logs' },
    { id: 'settings', label: 'Pengaturan', icon: Settings, path: '/settings' },
    { id: 'templates', label: 'Template', icon: LayoutTemplate, path: '/templates' },
    { id: 'users', label: 'Pengguna', icon: Users, path: '/users' },
    { id: 'admin-transactions', label: 'Transaksi Global', icon: BarChart, path: '/admin/transactions' },
    { id: 'admin-plans', label: 'Kelola Paket', icon: Crown, path: '/admin/plans' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.id === 'templates' || item.id === 'users' || item.id === 'admin-transactions' || item.id === 'admin-plans') {
      return userRole === 'admin';
    }
    return true;
  });

  return (
    <aside className={`fixed top-0 left-0 h-full w-64 bg-surface border-r border-separator flex flex-col z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
      <div className="p-6 flex items-center justify-between border-b border-separator">
        <div className="flex items-center gap-2.5">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.appName}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Plane size={18} strokeWidth={2.5} />
              </div>
              <div className="font-bold text-lg text-tx-main tracking-tight">{settings.appName}</div>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-2 text-tx-subtle hover:text-tx-muted hover:bg-surface-2 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {/* Sections Mapping */}
        {[
          { title: 'Ringkasan', items: ['dashboard'] },
          { title: 'Bisnis', items: ['invoices', 'revenue', 'customers', 'services'] },
          { title: 'Billing', items: ['pricing', 'billing'], adminHidden: true },
          { title: 'Sistem', items: ['templates', 'users', 'logs', 'settings'] },
          { title: 'Administrasi', items: ['admin-plans', 'admin-transactions'] }
        ]
        .filter(section => {
          if (section.adminHidden && userRole === 'admin') return false;
          const hasVisibleItems = section.items.some(itemId =>
            filteredMenuItems.some(item => item.id === itemId)
          );
          return hasVisibleItems;
        })
        .map((section) => (
          <div key={section.title} className="mb-5">
            <h3 className="px-4 text-[10px] font-bold text-tx-subtle uppercase tracking-widest mb-2">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {filteredMenuItems
                .filter(item => section.items.includes(item.id))
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path ||
                    (item.id === 'invoices' && location.pathname.startsWith('/invoices'));
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={onClose}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive
                          ? 'bg-blue-500/10 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400'
                          : 'text-tx-muted hover:bg-surface-2 hover:text-tx-main'
                        }`}
                    >
                      <Icon size={18} strokeWidth={isActive ? 2.2 : 2} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* Wallet Balance Widget (Hidden for Admin) */}
      {userRole !== 'admin' && (
        <div className="p-4 border-t border-separator bg-surface-2/40">
          <Link to="/billing" className="group block p-3 bg-surface rounded-xl border border-separator shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <Wallet size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-tx-subtle uppercase tracking-wider leading-none mb-1">Saldo Anda</p>
                <p className="text-sm font-extrabold text-tx-main leading-none truncate">
                  Rp {parseFloat(wallet?.balance || '0').toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-separator">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-900/30 px-2 py-0.5 rounded uppercase tracking-tight">
                {subscription?.plan?.name || 'Free'}
              </span>
              <span className="text-[10px] font-medium text-tx-subtle group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Top-up &rarr;</span>
            </div>
          </Link>
        </div>
      )}

      <div className="p-4 border-t border-separator">
        <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg border border-separator">
          <div className="w-8 h-8 rounded-md bg-blue-500/15 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
            <span className="text-xs">S</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-tx-main leading-none mb-1 truncate">Support Center</p>
            <p className="text-[10px] text-tx-subtle font-medium truncate">Get help 24/7</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
