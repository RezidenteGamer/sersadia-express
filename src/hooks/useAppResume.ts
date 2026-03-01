import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useAppResume() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let removeListener: (() => void) | undefined;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            queryClient.invalidateQueries();
          }
        });
        removeListener = () => handle.remove();
      } catch {
        // Not running in native shell
      }
    })();

    return () => {
      removeListener?.();
    };
  }, [queryClient]);
}
