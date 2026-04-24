import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StackSignInPage from './pages/StackSignInPage';
import StackSignUpPage from './pages/StackSignUpPage';
import StackForgotPasswordPage from './pages/StackForgotPasswordPage';
import StackResetPasswordPage from './pages/StackResetPasswordPage';
import StackVerifyEmailPage from './pages/StackVerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ServicesPage from './pages/ServicesPage';
import InvoicesPage from './pages/InvoicesPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import EditInvoicePage from './pages/EditInvoicePage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import PublicInvoicePage from './pages/PublicInvoicePage';
import SettingsPage from './pages/SettingsPage';
import TemplatesPage from './pages/TemplatesPage';
import LogsPage from './pages/LogsPage';
import WhatsAppLogsPage from './pages/WhatsAppLogsPage';
import EmailLogsPage from './pages/EmailLogsPage';
import WhatsAppLogDetailPage from './pages/WhatsAppLogDetailPage';
import EmailLogDetailPage from './pages/EmailLogDetailPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import PricingPage from './pages/PricingPage';
import BillingPage from './pages/BillingPage';
import AdminPlansPage from './pages/AdminPlansPage';
import AdminTransactionsPage from './pages/AdminTransactionsPage';

// Components
import Sidebar from './components/Sidebar';
import DashboardNavbar from './components/DashboardNavbar';
import AutoSyncIdentity from './components/AutoSyncIdentity';
import { ToastProvider } from './lib/ToastContext';
import { ToastContainer } from './components/Toast';
import { AppProvider, useAppSettings } from './context/AppContext';
import { useUser, authClient } from './lib/stackAuth';
import { NeonAuthUIProvider } from '@neondatabase/auth/react';
import "@neondatabase/auth/ui/css";

/**
 * TitleUpdater component handles dynamic page title updates in the browser
 */
function TitleUpdater() {
  const location = useLocation();
  const { settings } = useAppSettings();

  useEffect(() => {
    const path = location.pathname;
    let title = settings.appName;
    let prefix = '';

    if (path === '/login') prefix = 'Login';
    else if (path === '/register') prefix = 'Register';
    else if (path === '/dashboard') prefix = 'Dashboard';
    else if (path === '/customers') prefix = 'Customers';
    else if (path === '/services') prefix = 'Services';
    else if (path === '/invoices') prefix = 'Invoices';
    else if (path === '/invoices/create') prefix = 'Create Invoice';
    else if (path.match(/^\/invoices\/[^/]+\/edit$/)) prefix = 'Edit Invoice';
    else if (path.match(/^\/invoices\/[^/]+\/view$/)) prefix = 'Invoice Detail';
    else if (path.startsWith('/public/invoice/')) prefix = 'Kwitansi/Invoice';
    else if (path === '/settings') prefix = 'Settings';
    else if (path === '/templates' || path === '/template') prefix = 'Templates';
    else if (path === '/logs') prefix = 'Logs';
    else if (path === '/profile') prefix = 'Profile';
    else if (path === '/users') prefix = 'Users';
    else if (path === '/admin/plans') prefix = 'All Plans';
    else if (path === '/admin/transactions') prefix = 'All Transactions';

    document.title = prefix ? `${prefix} - ${title}` : title;
  }, [location.pathname, settings.appName]);

  return null;
}

/**
 * SessionSync component handles cross-tab authentication synchronization.
 * It listens for changes in localStorage from other tabs and reloads the current tab
 * to ensure all tabs stay in sync when a user logs in or out.
 */
function SessionSync() {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Sync on user, token, or settings changes
      if (e.key === 'token' || e.key === 'user') {
        // Force reload to refresh auth state from localStorage and Neon session
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return null;
}


/**
 * ProtectedRoute component protects internal routes from unauthorized access.
 * Includes a brief stabilization delay to prevent false-negative logouts immediately
 * after Neon Auth OTP verification (race condition where session is not yet settled).
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const [isStabilizing, setIsStabilizing] = useState(true);

  useEffect(() => {
    // Give the auth state 1 second to settle, especially after OTP redirects
    const timer = setTimeout(() => setIsStabilizing(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (user === undefined || isStabilizing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * DashboardLayout provides a consistent layout with Sidebar for internal pages
 */
function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/customers') return 'customers';
    if (path === '/services') return 'services';
    if (path === '/invoices' || path.startsWith('/invoices/')) return 'invoices';
    if (path === '/settings') return 'settings';
    if (path === '/templates' || path === '/template') return 'templates';
    if (path === '/logs') return 'logs';
    if (path === '/profile') return 'profile';
    if (path === '/users') return 'users';
    if (path === '/pricing') return 'pricing';
    if (path === '/billing') return 'billing';
    if (path === '/admin/plans') return 'admin-plans';
    if (path === '/admin/transactions') return 'admin-transactions';
    return 'dashboard';
  };

  const getPageTitle = () => {
    const page = getCurrentPage();
    switch(page) {
      case 'dashboard': return 'Dashboard Overview';
      case 'customers': return 'Manage Customers';
      case 'services': return 'Our Services';
      case 'pricing': return 'Subscription Plans';
      case 'billing': return 'Billing & Wallet';
      case 'invoices': return 'Invoices & Billing';
      case 'settings': return 'System Settings';
      case 'templates': return 'Invoice Templates';
      case 'logs': return 'Operation Logs';
      case 'profile': return 'My Profile';
      case 'users': return 'Manage Users';
      case 'admin-plans': return 'Plans Management';
      case 'admin-transactions': return 'Global Transactions';
      default: return 'Overview';
    }
  };

  return (
    <div className="flex min-h-screen relative overflow-x-hidden">
      {/* Sidebar with mobile drawer logic */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in transition-all"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`flex-1 flex flex-col min-h-screen bg-[#f4f6f9] transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0 md:ml-64'}`}>
        <DashboardNavbar 
          pageTitle={getPageTitle()} 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * AuthWrapper allows NeonAuthUIProvider to use react-router hooks and handle automatic redirection
 */
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  
  return (
    <NeonAuthUIProvider 
      authClient={authClient}
      navigate={(path) => {
        // Jika SDK mendeteksi flow verifikasi email OTP, arahkan ke rute kita
        if (path && (path.includes('verify-email') || path.includes('email-otp'))) {
          navigate('/verify-email');
        } else {
          navigate(path);
        }
      }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Router>
          <AuthWrapper>
            <TitleUpdater />
            <SessionSync />
            <AutoSyncIdentity />
            <Routes>
              {/* Stack Auth routes */}
              {/* Primary Stable Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Specialized Neon Auth (SSO/Google) routes */}
              <Route path="/login-sso" element={<StackSignInPage />} />
              <Route path="/register-sso" element={<StackSignUpPage />} />
              <Route path="/forgot-password" element={<StackForgotPasswordPage />} />
              <Route path="/reset-password" element={<StackResetPasswordPage />} />
              <Route path="/verify-email" element={<StackVerifyEmailPage />} />
              
              {/* Aliases & Internal Paths */}
              <Route path="/sign-in" element={<Navigate to="/login" replace />} />
              <Route path="/sign-up" element={<Navigate to="/register" replace />} />
              <Route path="/auth/sign-in" element={<Navigate to="/login" replace />} />
              <Route path="/auth/sign-up" element={<Navigate to="/register" replace />} />
              <Route path="/auth/forgot-password" element={<StackForgotPasswordPage />} />
              <Route path="/auth/reset-password" element={<StackResetPasswordPage />} />
              <Route path="/auth/email-otp/verify-email" element={<StackVerifyEmailPage />} />
              
              {/* Other Routes */}
              <Route path="/login-legacy" element={<LoginPage />} />
              <Route path="/register-legacy" element={<RegisterPage />} />
              <Route path="/public/invoice/:id" element={<PublicInvoicePage />} />
              <Route path="/invoice-view/:id" element={<Navigate to="/invoices/:id/view" replace />} />

              {/* Private Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><DashboardLayout><CustomersPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/services" element={<ProtectedRoute><DashboardLayout><ServicesPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute><DashboardLayout><InvoicesPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/invoices/create" element={<ProtectedRoute><DashboardLayout><CreateInvoicePage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/invoices/:id/view" element={<ProtectedRoute><DashboardLayout><InvoiceDetailPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/invoices/:id/edit" element={<ProtectedRoute><DashboardLayout><EditInvoicePage /></DashboardLayout></ProtectedRoute>} />
              
              {/* Backward compatibility / Aliases */}
              <Route path="/invoices/:id" element={<Navigate to="view" replace />} />
              <Route path="/settings" element={<ProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><DashboardLayout><TemplatesPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/logs" element={<ProtectedRoute><DashboardLayout><LogsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/logs/whatsapp" element={<ProtectedRoute><DashboardLayout><WhatsAppLogsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/logs/emails" element={<ProtectedRoute><DashboardLayout><EmailLogsPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/logs/whatsapp/:id" element={<ProtectedRoute><DashboardLayout><WhatsAppLogDetailPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/logs/email/:id" element={<ProtectedRoute><DashboardLayout><EmailLogDetailPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><DashboardLayout><UsersPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/pricing" element={<ProtectedRoute><DashboardLayout><PricingPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><DashboardLayout><BillingPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/plans" element={<ProtectedRoute><DashboardLayout><AdminPlansPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/transactions" element={<ProtectedRoute><DashboardLayout><AdminTransactionsPage /></DashboardLayout></ProtectedRoute>} />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <ToastContainer />
          </AuthWrapper>
        </Router>
      </ToastProvider>
    </AppProvider>
  );
}
