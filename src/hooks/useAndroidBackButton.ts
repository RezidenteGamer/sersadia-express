import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Handles the Android hardware/gesture back button.
 * - If there's browser history, go back.
 * - If at root routes, minimize the app instead of closing.
 */
export function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const rootPaths = ['/', '/dashboard', '/locations'];
      const isAtRoot = rootPaths.includes(location.pathname);

      if (canGoBack && !isAtRoot) {
        window.history.back();
      } else {
        // Minimize app instead of closing
        CapacitorApp.minimizeApp();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [location.pathname]);
}
