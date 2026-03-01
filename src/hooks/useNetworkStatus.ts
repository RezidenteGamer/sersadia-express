import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useNetworkStatus() {
  const wasOffline = useRef(false);

  useEffect(() => {
    const showOffline = () => {
      if (!wasOffline.current) {
        wasOffline.current = true;
        toast.warning('Você está sem internet', {
          id: 'network-offline',
          duration: Infinity,
          description: 'Algumas funcionalidades podem não funcionar.',
        });
      }
    };

    const showOnline = () => {
      if (wasOffline.current) {
        wasOffline.current = false;
        toast.dismiss('network-offline');
        toast.success('Conexão restaurada', { duration: 3000 });
      }
    };

    // Browser events
    window.addEventListener('online', showOnline);
    window.addEventListener('offline', showOffline);

    // Capacitor Network plugin (more reliable on native)
    let removeListener: (() => void) | undefined;
    (async () => {
      try {
        const { Network } = await import('@capacitor/network');
        const status = await Network.getStatus();
        if (!status.connected) showOffline();

        const handle = await Network.addListener('networkStatusChange', (s) => {
          if (s.connected) showOnline();
          else showOffline();
        });
        removeListener = () => handle.remove();
      } catch {
        // Not native — rely on browser events
        if (!navigator.onLine) showOffline();
      }
    })();

    return () => {
      window.removeEventListener('online', showOnline);
      window.removeEventListener('offline', showOffline);
      removeListener?.();
    };
  }, []);
}
