import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser, neonSignOut } from '../lib/stackAuth';
import { User, LogOut, Settings, Menu } from 'lucide-react';

interface DashboardNavbarProps {
  pageTitle?: string;
  onMenuClick?: () => void;
}

export default function DashboardNavbar({ pageTitle, onMenuClick }: DashboardNavbarProps) {
  const user = useUser();
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
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-4 md:px-10 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 md:hidden text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-50 transition-all group"
          >
            <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 leading-none mb-1">
                    {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 font-medium tracking-tight">
                    {user?.email}
                </p>
            </div>
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold shadow-lg overflow-hidden border-2 border-white">
              {user?.displayName ? getInitials(user.displayName) : 'U'}
            </div>
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 animate-in fade-in slide-in-from-top-2 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <p className="text-sm font-semibold text-gray-900">{user?.displayName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              <div className="p-1 space-y-0.5">
                <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                >
                    <User size={14} />
                    Profile Settings
                </Link>

                <Link
                    to="/settings"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                >
                    <Settings size={14} />
                    App Settings
                </Link>

                <div className="h-px bg-gray-100 my-1 mx-1" />

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
