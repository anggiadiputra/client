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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div 
        className="bg-surface rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-separator animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2.5 bg-surface-2 rounded-xl border border-separator flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-tx-main mb-1">{title}</h3>
              <p className="text-[13px] leading-relaxed text-tx-muted">{message}</p>
            </div>
            <button 
              onClick={onCancel}
              className="text-tx-subtle hover:text-tx-muted transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-surface-2 hover:bg-separator text-tx-muted text-xs font-bold rounded-xl border border-separator transition-all active:scale-[0.98]"
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
