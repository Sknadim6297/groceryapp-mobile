import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import {
  activateDeviceRememberedStore,
  clearRememberedCustomer,
  loadRememberedCustomer,
  saveRememberedCustomer,
  type RememberedCustomer,
} from '@/services/rememberedCustomer';

type RememberedCustomerContextValue = {
  hydrated: boolean;
  customer: RememberedCustomer | null;
  rememberCustomer: (customer: RememberedCustomer) => Promise<boolean>;
  clearRememberedCustomer: () => void;
};

const RememberedCustomerContext = createContext<RememberedCustomerContextValue | null>(null);

export function RememberedCustomerProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [customer, setCustomer] = useState<RememberedCustomer | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (Platform.OS !== 'web') {
        await activateDeviceRememberedStore();
      }
      const restored = await loadRememberedCustomer();
      if (!cancelled) {
        setCustomer(restored);
        setHydrated(true);
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const rememberCustomer = useCallback(async (next: RememberedCustomer) => {
    const saved = await saveRememberedCustomer(next);
    if (!saved) {
      return false;
    }
    const restored = await loadRememberedCustomer();
    if (!restored) {
      return false;
    }
    setCustomer(restored);
    return true;
  }, []);

  const clear = useCallback(() => {
    setCustomer(null);
    void clearRememberedCustomer();
  }, []);

  const value = useMemo(
    () => ({ hydrated, customer, rememberCustomer, clearRememberedCustomer: clear }),
    [clear, customer, hydrated, rememberCustomer],
  );

  return <RememberedCustomerContext.Provider value={value}>{children}</RememberedCustomerContext.Provider>;
}

export function useRememberedCustomer(): RememberedCustomerContextValue {
  const value = useContext(RememberedCustomerContext);
  if (!value) {
    throw new Error('useRememberedCustomer must be used within RememberedCustomerProvider');
  }
  return value;
}
