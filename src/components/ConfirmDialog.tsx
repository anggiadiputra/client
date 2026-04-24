import { AlertCircle, CheckCircle2, XCircle, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  type = 'warning',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={28} />;
      case 'danger': return <XCircle className="text-red-500" size={28} />;
      case 'info': return <Info className="text-blue-500" size={28} />;
      default: return <AlertCircle className="text-amber-500" size={28} />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'success': return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100';
      case 'danger': return 'bg-red-600 hover:bg-red-700 shadow-red-100';
      case 'info': return 'bg-blue-600 hover:bg-blue-700 shadow-blue-100';
      default: return 'bg-amber-600 hover:bg-amber-700 shadow-amber-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
              <p className="text-[13px] leading-relaxed text-gray-600">{message}</p>
            </div>
            <button 
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-all active:scale-[0.98]"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-[1.5] px-4 py-2.5 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] ${getConfirmButtonClass()}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
