import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ROOT_PATHS = new Set(['/', '/dashboard', '/locations']);

/**
 * Handles the Android hardware/gesture back button.
 * - If there's browser history, go back.
 * - If at root routes, show exit confirmation dialog.
 */
export function useAndroidBackButton() {
  const location = useLocation();
  const currentPathRef = useRef(location.pathname);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location.pathname]);

  const confirmExit = useCallback(async () => {
    setShowExitDialog(false);
    try {
      const { App: CapacitorApp } = await import('@capacitor/app');
      CapacitorApp.exitApp();
    } catch {
      window.close();
    }
  }, []);

  const cancelExit = useCallback(() => {
    setShowExitDialog(false);
  }, []);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | null = null;

    const setup = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
        if (disposed) return;

        const { App: CapacitorApp } = await import('@capacitor/app');
        if (disposed) return;

        const listener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          const isAtRoot = ROOT_PATHS.has(currentPathRef.current);
          if (canGoBack && !isAtRoot) {
            window.history.back();
          } else {
            setShowExitDialog(true);
          }
        });

        if (disposed) {
          listener.remove();
          return;
        }
        cleanup = () => listener.remove();
      } catch {
        // Not running in Capacitor environment
      }
    };

    setup();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return { showExitDialog, confirmExit, cancelExit };
}
