import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Handles the Android hardware/gesture back button.
 * - If there's browser history, go back.
 * - If at root routes, show exit confirmation dialog.
 */
export function useAndroidBackButton() {
  const location = useLocation();
  const [showExitDialog, setShowExitDialog] = useState(false);

  const confirmExit = useCallback(() => {
    setShowExitDialog(false);
    CapacitorApp.exitApp();
  }, []);

  const cancelExit = useCallback(() => {
    setShowExitDialog(false);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const rootPaths = ['/', '/dashboard', '/locations'];
      const isAtRoot = rootPaths.includes(location.pathname);

      if (canGoBack && !isAtRoot) {
        window.history.back();
      } else {
        setShowExitDialog(true);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [location.pathname]);

  return { showExitDialog, confirmExit, cancelExit };
}
