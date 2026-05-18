import { Filter } from 'lucide-react';

interface DropdownFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}

export default function DropdownFilter({ 
  value, 
  onChange, 
  options, 
  placeholder = 'All Status',
  className = '' 
}: DropdownFilterProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-3 text-tx-subtle pointer-events-none">
        <Filter size={14} />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-9 pr-8 py-1.5 text-sm bg-surface border border-separator rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer text-tx-muted min-w-[140px]"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 pointer-events-none text-tx-subtle">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
