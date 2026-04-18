import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  onEscape?: () => void;
  onEnter?: (e: KeyboardEvent) => void;
  enabled?: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts
 * @param options - Configuration for keyboard shortcuts
 */
export function useKeyboardShortcuts(options: KeyboardShortcutOptions = {}) {
  const { onEscape, onEnter, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle ESC key
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
      }

      // Handle ENTER key (only if not in textarea/input)
      if (e.key === 'Enter' && onEnter && !isInEditableField(e.target as HTMLElement)) {
        e.preventDefault();
        onEnter(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscape, onEnter, enabled]);
}

/**
 * Check if element is inside an editable field (input, textarea, select)
 */
function isInEditableField(element: HTMLElement | null): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const isEditable =
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.isContentEditable;

  if (isEditable) return true;

  // Check parent elements
  return isInEditableField(element.parentElement);
}

/**
 * Custom hook for global keyboard shortcuts (works even when modal is not focused)
 */
export function useGlobalKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Build key combination string
      let combination = '';
      if (ctrlOrMeta) combination += 'ctrl+';
      if (shift) combination += 'shift+';
      combination += key;

      // Check if combination matches any shortcut
      if (shortcuts[combination]) {
        e.preventDefault();
        shortcuts[combination]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}
