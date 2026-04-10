import { useState, useCallback } from 'react';
import { LucideIcon } from 'lucide-react';

export interface DesktopApp {
  id: string;
  title: string;
  icon: LucideIcon;
  component: React.ComponentType;
  defaultSize?: { width: number; height: number };
}

export interface WindowState {
  id: string;
  title: string;
  icon: LucideIcon;
  component: React.ComponentType;
  isMinimized: boolean;
  isMaximized: boolean;
  isSnapped: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isClosing: boolean;
}

// Keep window z-index below 40 so Radix portals (z-50) always render on top
let nextZIndex = 10;
const MAX_WINDOW_Z = 39;

function getNextZIndex() {
  nextZIndex++;
  if (nextZIndex > MAX_WINDOW_Z) {
    nextZIndex = 10;
  }
  return nextZIndex;
}

const DEFAULT_SIZE = { width: 900, height: 600 };

export function useDesktopManager() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

  const openWindow = useCallback((app: DesktopApp) => {
    setWindows(prev => {
      const existing = prev.find(w => w.id === app.id);
      if (existing) {
        setActiveWindowId(app.id);
        return prev.map(w =>
          w.id === app.id
            ? { ...w, isMinimized: false, isClosing: false, zIndex: getNextZIndex() }
            : w
        );
      }
      const offset = prev.length * 30;
      setActiveWindowId(app.id);
      return [...prev, {
        id: app.id,
        title: app.title,
        icon: app.icon,
        component: app.component,
        isMinimized: false,
        isMaximized: false,
        isSnapped: null,
        position: { x: 60 + offset, y: 40 + offset },
        size: app.defaultSize ? { ...app.defaultSize } : { ...DEFAULT_SIZE },
        zIndex: getNextZIndex(),
        isClosing: false,
      }];
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    // Mark as closing for exit animation
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isClosing: true } : w
    ));
    // Remove after animation
    setTimeout(() => {
      setWindows(prev => prev.filter(w => w.id !== id));
      setActiveWindowId(prev => prev === id ? null : prev);
    }, 200);
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMinimized: true } : w
    ));
    setActiveWindowId(prev => prev === id ? null : prev);
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMaximized: !w.isMaximized, isSnapped: null, zIndex: getNextZIndex() } : w
    ));
    setActiveWindowId(id);
  }, []);

  const snapWindow = useCallback((id: string, snap: WindowState['isSnapped']) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isSnapped: snap, isMaximized: false, zIndex: getNextZIndex() } : w
    ));
    setActiveWindowId(id);
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, zIndex: getNextZIndex() } : w
    ));
    setActiveWindowId(id);
  }, []);

  const updatePosition = useCallback((id: string, position: { x: number; y: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, position } : w
    ));
  }, []);

  const updateSize = useCallback((id: string, size: { width: number; height: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, size } : w
    ));
  }, []);

  const toggleMinimizeFromTaskbar = useCallback((id: string) => {
    setWindows(prev => {
      const win = prev.find(w => w.id === id);
      if (!win) return prev;
      if (win.isMinimized) {
        setActiveWindowId(id);
        return prev.map(w =>
          w.id === id ? { ...w, isMinimized: false, zIndex: getNextZIndex() } : w
        );
      }
      const maxZ = Math.max(...prev.map(w => w.zIndex));
      if (win.zIndex === maxZ) {
        setActiveWindowId(null);
        return prev.map(w =>
          w.id === id ? { ...w, isMinimized: true } : w
        );
      }
      setActiveWindowId(id);
      return prev.map(w =>
        w.id === id ? { ...w, zIndex: getNextZIndex() } : w
      );
    });
  }, []);

  const cycleWindows = useCallback(() => {
    setWindows(prev => {
      const visible = prev.filter(w => !w.isMinimized);
      if (visible.length <= 1) return prev;
      const sorted = [...visible].sort((a, b) => a.zIndex - b.zIndex);
      const nextWin = sorted[0]; // bring lowest to top
      setActiveWindowId(nextWin.id);
      return prev.map(w =>
        w.id === nextWin.id ? { ...w, zIndex: getNextZIndex() } : w
      );
    });
  }, []);

  const closeActiveWindow = useCallback(() => {
    if (activeWindowId) closeWindow(activeWindowId);
  }, [activeWindowId, closeWindow]);

  return {
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    snapWindow,
    focusWindow,
    updatePosition,
    updateSize,
    toggleMinimizeFromTaskbar,
    cycleWindows,
    closeActiveWindow,
  };
}
