import { useState, useCallback } from 'react';
import { LucideIcon } from 'lucide-react';

export interface DesktopApp {
  id: string;
  title: string;
  icon: LucideIcon;
  component: React.ComponentType;
}

export interface WindowState {
  id: string;
  title: string;
  icon: LucideIcon;
  component: React.ComponentType;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  zIndex: number;
}

let nextZIndex = 10;

export function useDesktopManager() {
  const [windows, setWindows] = useState<WindowState[]>([]);

  const openWindow = useCallback((app: DesktopApp) => {
    setWindows(prev => {
      const existing = prev.find(w => w.id === app.id);
      if (existing) {
        // If minimized, restore it; always bring to front
        return prev.map(w =>
          w.id === app.id
            ? { ...w, isMinimized: false, zIndex: ++nextZIndex }
            : w
        );
      }
      // Open new window with staggered position
      const offset = prev.length * 30;
      return [...prev, {
        id: app.id,
        title: app.title,
        icon: app.icon,
        component: app.component,
        isMinimized: false,
        isMaximized: false,
        position: { x: 60 + offset, y: 40 + offset },
        zIndex: ++nextZIndex,
      }];
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMinimized: true } : w
    ));
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMaximized: !w.isMaximized, zIndex: ++nextZIndex } : w
    ));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, zIndex: ++nextZIndex } : w
    ));
  }, []);

  const updatePosition = useCallback((id: string, position: { x: number; y: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, position } : w
    ));
  }, []);

  const toggleMinimizeFromTaskbar = useCallback((id: string) => {
    setWindows(prev => {
      const win = prev.find(w => w.id === id);
      if (!win) return prev;
      if (win.isMinimized) {
        return prev.map(w =>
          w.id === id ? { ...w, isMinimized: false, zIndex: ++nextZIndex } : w
        );
      }
      // If it's the top window, minimize it
      const maxZ = Math.max(...prev.map(w => w.zIndex));
      if (win.zIndex === maxZ) {
        return prev.map(w =>
          w.id === id ? { ...w, isMinimized: true } : w
        );
      }
      // Otherwise just focus
      return prev.map(w =>
        w.id === id ? { ...w, zIndex: ++nextZIndex } : w
      );
    });
  }, []);

  return {
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    focusWindow,
    updatePosition,
    toggleMinimizeFromTaskbar,
  };
}
