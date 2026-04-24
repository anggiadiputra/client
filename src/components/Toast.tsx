import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const styles = {
    success: 'bg-emerald-50/90 border-emerald-100 text-emerald-900 shadow-emerald-100/50',
    error: 'bg-red-50/90 border-red-100 text-red-900 shadow-red-100/50',
    info: 'bg-blue-50/90 border-blue-100 text-blue-900 shadow-blue-100/50',
  };

  const icons = {
    success: <CheckCircle className="text-emerald-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    info: <AlertCircle className="text-blue-500" size={20} />,
  };

  return (
    <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-md shadow-xl animate-in slide-in-from-right-8 fade-in duration-300 mb-3 min-w-[320px] max-w-md ${styles[type]}`}>
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1 font-bold text-[13px] leading-tight">{message}</div>
      <button 
        onClick={() => onClose(id)} 
        className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const { message, type } = e.detail;
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </div>
    </div>
  );
};

export const toast = {
  success: (message: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type: 'success' } }));
  },
  error: (message: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type: 'error' } }));
  },
  info: (message: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type: 'info' } }));
  },
};
