import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { shouldShowOfflineBanner } from '@/utils/networkConnectivity';

export type NetworkConnectivity = {
  /** True when a network interface appears active. Does not guarantee API reachability. */
  isConnected: boolean | null;
  /** True when the OS reports internet reachability (may be null/unknown on some platforms). */
  isInternetReachable: boolean | null;
  /** True when we should show the offline strip (confirmed disconnected). */
  showOfflineBanner: boolean;
};

/**
 * Lightweight connectivity probe via expo-network.
 * Being online does not mean MayapurBazaar APIs are available.
 */
export function useNetworkConnectivity(): NetworkConnectivity {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    let remove: (() => void) | null = null;

    void (async () => {
      try {
        const Network = await import('expo-network');
        const initial = await Network.getNetworkStateAsync();
        if (!cancelled) {
          setIsConnected(initial.isConnected ?? null);
          setIsInternetReachable(initial.isInternetReachable ?? null);
        }
        const subscription = Network.addNetworkStateListener((state) => {
          setIsConnected(state.isConnected ?? null);
          setIsInternetReachable(state.isInternetReachable ?? null);
        });
        remove = () => subscription.remove();
      } catch {
        // Fall back to browser online flag on web; leave unknown on native without the module.
        if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
          const apply = () => {
            setIsConnected(navigator.onLine);
            setIsInternetReachable(navigator.onLine ? null : false);
          };
          apply();
          window.addEventListener('online', apply);
          window.addEventListener('offline', apply);
          remove = () => {
            window.removeEventListener('online', apply);
            window.removeEventListener('offline', apply);
          };
        }
      }
    })();

    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);

  return {
    isConnected,
    isInternetReachable,
    showOfflineBanner: shouldShowOfflineBanner({ isConnected, isInternetReachable }),
  };
}
