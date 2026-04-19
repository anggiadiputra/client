import React from 'react';
import { Trash2, CheckCircle, X } from 'lucide-react';

interface CompactBatchActionsProps {
  selectedCount: number;
  onDelete: () => void;
  onUpdateStatus?: (status: string) => void;
  statusOptions?: { label: string; value: string }[];
  onClear: () => void;
  isLoading?: boolean;
}

export default function CompactBatchActions({
  selectedCount,
  onDelete,
  onUpdateStatus,
  statusOptions,
  onClear,
  isLoading
}: CompactBatchActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-2 pr-3 border-r border-blue-200">
        <span className="text-sm font-semibold text-blue-700">{selectedCount} terpilih</span>
        <button 
          onClick={onClear}
          className="p-0.5 hover:bg-blue-100 rounded-full text-blue-500 transition-colors"
          title="Batal"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {onUpdateStatus && statusOptions && (
          <div className="relative flex items-center group">
            <CheckCircle size={14} className="absolute left-2.5 text-blue-600" />
            <select
              onChange={(e) => {
                if (e.target.value) onUpdateStatus(e.target.value);
                e.target.value = ""; // Reset after selection
              }}
              disabled={isLoading}
              className="pl-8 pr-6 py-1 text-xs font-medium bg-white border border-blue-300 rounded text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer disabled:opacity-50"
            >
              <option value="">Update Status</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Set to {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={onDelete}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors disabled:opacity-50"
        >
          <Trash2 size={13} />
          Hapus
        </button>
      </div>
    </div>
  );
}
