import { Plane, LogIn, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSettings } from '../context/AppContext';

interface NavbarProps {
  onLoginClick: () => void;
  onGetStartedClick: () => void;
  onSectionClick?: (sectionId: string) => void;
  showLogin?: boolean;
  showRegister?: boolean;
}

export default function Navbar({ 
  onLoginClick, 
  onGetStartedClick, 
  onSectionClick,
  showLogin = true, 
  showRegister = true 
}: NavbarProps) {
  const { settings, theme, toggleTheme } = useAppSettings();
  const navigate = useNavigate();

  const handleMenuClick = (id: string) => {
    if (onSectionClick) {
      onSectionClick(id);
    } else {
      navigate('/#' + id);
    }
  };

  return (
    <nav className="bg-surface border-b border-separator sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt={settings.appName} 
                className="h-8 w-auto object-contain"
              />
            ) : (
              <>
                <div className="text-blue-600">
                  <Plane size={24} strokeWidth={2} />
                </div>
                <span className="font-bold text-tx-main text-lg">
                  {settings.appName}
                </span>
              </>
            )}
          </div>
          <div className="hidden md:flex items-center gap-6">
            {['Home', 'Templates', 'Pricing', 'Features'].map((item) => (
              <button
                key={item}
                onClick={() => handleMenuClick(item.toLowerCase())}
                className="text-tx-muted hover:text-tx-main text-sm font-medium transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-md border border-separator text-tx-muted hover:bg-surface-2 transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {showLogin && (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 text-sm font-medium text-tx-muted border border-separator rounded-md px-4 py-2 hover:bg-surface-2 transition-colors"
            >
              <LogIn size={15} />
              Login
            </button>
          )}
          {showRegister && (
            <button
              onClick={onGetStartedClick}
              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md px-4 py-2 transition-colors"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
