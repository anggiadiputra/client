import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart, FileText, Settings, BarChart3, LayoutTemplate, X, Plane } from 'lucide-react';
import { useAppSettings } from '../context/AppContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { settings, userRole } = useAppSettings();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
    { id: 'services', label: 'Services', icon: BarChart, path: '/services' },
    { id: 'invoices', label: 'Invoices', icon: FileText, path: '/invoices' },
    { id: 'logs', label: 'Log History', icon: BarChart3, path: '/logs' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate, path: '/templates' },
    { id: 'users', label: 'Users', icon: Users, path: '/users' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.id === 'templates' || item.id === 'users') {
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
          { title: 'Business', items: ['invoices', 'customers', 'services'] },
          { title: 'System', items: ['templates', 'users', 'logs', 'settings'] }
        ].map((section) => (
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
