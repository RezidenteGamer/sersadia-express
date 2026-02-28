import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

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

  const confirmExit = useCallback(() => {
    setShowExitDialog(false);

    if (Capacitor.isNativePlatform()) {
      CapacitorApp.exitApp();
      return;
    }

    window.close();
  }, []);

  const cancelExit = useCallback(() => {
    setShowExitDialog(false);
  }, []);

  const handleBackAction = useCallback((canGoBack: boolean) => {
    const isAtRoot = ROOT_PATHS.has(currentPathRef.current);

    if (canGoBack && !isAtRoot) {
      window.history.back();
      return;
    }

    setShowExitDialog(true);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;

    let isDisposed = false;
    let removeNativeListener: (() => void) | null = null;

    const onLegacyBackButton = (event: Event) => {
      event.preventDefault();
      handleBackAction(window.history.length > 1);
    };

    document.addEventListener('backbutton', onLegacyBackButton, false);

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      handleBackAction(canGoBack);
    }).then((listener) => {
      if (isDisposed) {
        listener.remove();
        return;
      }
      removeNativeListener = () => listener.remove();
    });

    return () => {
      isDisposed = true;
      document.removeEventListener('backbutton', onLegacyBackButton, false);
      removeNativeListener?.();
    };
  }, [handleBackAction]);

  return { showExitDialog, confirmExit, cancelExit };
}

