import { useEffect } from 'react';

interface ShortcutHandlers {
  onCycleWindows: () => void;
  onCloseActiveWindow: () => void;
  onOpenCommandPalette: () => void;
  onToggleFullscreen: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+Tab - cycle windows
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        handlers.onCycleWindows();
        return;
      }

      // Ctrl+W - close active window
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        handlers.onCloseActiveWindow();
        return;
      }

      // Ctrl+P - command palette
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        handlers.onOpenCommandPalette();
        return;
      }

      // F11 - fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        handlers.onToggleFullscreen();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
