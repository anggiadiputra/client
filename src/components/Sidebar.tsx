import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BarChart, FileText, Settings, BarChart3, LayoutTemplate, X, Plane,
  CreditCard, Crown, Wallet
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
    { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
    { id: 'services', label: 'Services', icon: BarChart, path: '/services' },
    { id: 'invoices', label: 'Invoices', icon: FileText, path: '/invoices' },
    { id: 'billing', label: 'Billing & Wallet', icon: CreditCard, path: '/billing' },
    { id: 'pricing', label: 'Subscription Plans', icon: Crown, path: '/pricing' },
    { id: 'logs', label: 'Log History', icon: BarChart3, path: '/logs' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate, path: '/templates' },
    { id: 'users', label: 'Users', icon: Users, path: '/users' },
    { id: 'admin-transactions', label: 'Global Transactions', icon: BarChart, path: '/admin/transactions' },
    { id: 'admin-plans', label: 'Plans Management', icon: Crown, path: '/admin/plans' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.id === 'templates' || item.id === 'users' || item.id === 'admin-transactions' || item.id === 'admin-plans') {
      return userRole === 'admin';
    }
    return true;
  });

  return (
    <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
      <div className="p-6 flex items-center justify-between">
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
              <div className="font-bold text-lg text-gray-900 tracking-tight">{settings.appName}</div>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {/* Sections Mapping */}
        {[
          { title: 'Overview', items: ['dashboard'] },
          { title: 'SaaS & Billing', items: ['pricing', 'billing'], adminHidden: true },
          { title: 'Business', items: ['invoices', 'customers', 'services'] },
          { title: 'System', items: ['templates', 'users', 'logs', 'settings'] },
          { title: 'Administration', items: ['admin-plans', 'admin-transactions'] }
        ]
        .filter(section => {
          if (section.adminHidden && userRole === 'admin') return false;
          // Only show section if it has at least one item that passed filteredMenuItems
          const hasVisibleItems = section.items.some(itemId => 
            filteredMenuItems.some(item => item.id === itemId)
          );
          return hasVisibleItems;
        })
        .map((section) => (
          <div key={section.title} className="mb-5">
            <h3 className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {filteredMenuItems
                .filter(item => section.items.includes(item.id))
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={onClose}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive
                          ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-50/50'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
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
        <div className="p-4 border-t border-gray-50 bg-gray-50/50">
          <Link to="/billing" className="group block p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-300 transition-all duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <Wallet size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Saldo Anda</p>
                <p className="text-sm font-extrabold text-gray-900 leading-none truncate">
                  Rp {parseFloat(wallet?.balance || '0').toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-tight">
                {subscription?.plan?.name || 'Free'}
              </span>
              <span className="text-[10px] font-medium text-gray-400 group-hover:text-blue-600 transition-colors">Top-up &rarr;</span>
            </div>
          </Link>
        </div>
      )}

      <div className="p-4 border-t border-gray-50">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100/50">
          <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
            <span className="text-xs">S</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-900 leading-none mb-1 truncate">Support Center</p>
            <p className="text-[10px] text-gray-500 font-medium truncate">Get help 24/7</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
