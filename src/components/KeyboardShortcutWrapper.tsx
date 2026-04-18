import { ReactNode } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutWrapperProps {
  children: ReactNode;
  onClose: () => void;
  disabled?: boolean;
}

/**
 * Wrapper component that adds ESC keyboard shortcut to close modals
 */
export default function KeyboardShortcutWrapper({ 
  children, 
  onClose, 
  disabled = false 
}: KeyboardShortcutWrapperProps) {
  useKeyboardShortcuts({
    onEscape: onClose,
    enabled: !disabled,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      {children}
    </div>
  );
}
