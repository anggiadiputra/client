import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser, neonSignOut } from '../lib/stackAuth';
import { User, LogOut, Settings, Menu, Sun, Moon } from 'lucide-react';
import { useAppSettings } from '../context/AppContext';

interface DashboardNavbarProps {
  pageTitle?: string;
  onMenuClick?: () => void;
}

export default function DashboardNavbar({ pageTitle, onMenuClick }: DashboardNavbarProps) {
  const user = useUser();
  const { theme, toggleTheme } = useAppSettings();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await neonSignOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="h-16 bg-surface/90 backdrop-blur-md border-b border-separator sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 md:hidden text-tx-muted hover:bg-surface-2 rounded-lg transition-colors"
        >
          <Menu size={22} />
        </button>
        {pageTitle && (
          <h2 className="hidden md:block text-sm font-semibold text-tx-muted">{pageTitle}</h2>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg border border-separator text-tx-muted hover:bg-surface-2 hover:text-tx-main transition-all"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1 pl-2 rounded-full hover:bg-surface-2 transition-all group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-tx-main leading-none mb-1">
                {user?.displayName || 'User'}
              </p>
              <p className="text-xs text-tx-muted font-medium tracking-tight">
                {user?.email}
              </p>
            </div>
            <div className="w-9 h-9 bg-gray-900 dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow overflow-hidden border-2 border-separator">
              {user?.displayName ? getInitials(user.displayName) : 'U'}
            </div>
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-surface rounded-xl shadow-xl border border-separator py-1 animate-in fade-in slide-in-from-top-2 overflow-hidden">
              <div className="px-4 py-3 border-b border-separator bg-surface-2">
                <p className="text-sm font-semibold text-tx-main">{user?.displayName}</p>
                <p className="text-xs text-tx-muted">{user?.email}</p>
              </div>

              <div className="p-1 space-y-0.5">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-tx-muted hover:bg-surface-2 hover:text-tx-main rounded-md transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <User size={14} />
                  Profile Settings
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-tx-muted hover:bg-surface-2 hover:text-tx-main rounded-md transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings size={14} />
                  App Settings
                </Link>

                {/* Theme toggle shortcut inside menu */}
                <button
                  onClick={() => { toggleTheme(); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-tx-muted hover:bg-surface-2 hover:text-tx-main rounded-md transition-colors"
                >
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                </button>

                <div className="h-px bg-separator my-1 mx-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
