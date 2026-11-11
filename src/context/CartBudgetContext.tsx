import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useAuthSession } from '@/context/AuthSessionContext';
import {
  activateDeviceCartBudgetStore,
  budgetDelta,
  cartBudgetOwnerKey,
  loadCartBudget,
  normalizeCartBudget,
  saveCartBudget,
} from '@/services/cartBudgetStore';
import { isDevOtpEnabled } from '@/services/devOtp';

type CartBudgetContextValue = {
  hydrated: boolean;
  budgetInr: number | null;
  setBudgetInr: (value: number | null) => void;
  remainingVsSubtotal: (localSubtotal: number) => number | null;
};

const CartBudgetContext = createContext<CartBudgetContextValue | null>(null);

export function CartBudgetProvider({ children }: { children: ReactNode }) {
  const { hydrated: authHydrated, session, devSession } = useAuthSession();
  const [hydrated, setHydrated] = useState(false);
  const [ownerKey, setOwnerKey] = useState<string | null>(null);
  const [budgetInr, setBudgetState] = useState<number | null>(null);
  const persistReady = useRef(false);

  const resolveOwner = useCallback(() => {
    if (session) {
      return cartBudgetOwnerKey({ kind: 'temporary-ui', mobile: session.mobile });
    }
    if (isDevOtpEnabled() && devSession) {
      return cartBudgetOwnerKey({ kind: 'development-test', mobile: devSession.mobile });
    }
    return cartBudgetOwnerKey(null);
  }, [devSession, session]);

  useEffect(() => {
    if (!authHydrated) {
      return;
    }
    let cancelled = false;
    void (async () => {
      persistReady.current = false;
      if (Platform.OS !== 'web') {
        await activateDeviceCartBudgetStore();
      }
      const nextOwner = resolveOwner();
      const loaded = await loadCartBudget(nextOwner);
      if (cancelled) {
        return;
      }
      setOwnerKey(nextOwner);
      setBudgetState(loaded);
      persistReady.current = true;
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authHydrated, resolveOwner]);

  useEffect(() => {
    if (!hydrated || !persistReady.current || !ownerKey) {
      return;
    }
    void saveCartBudget(ownerKey, budgetInr);
  }, [budgetInr, hydrated, ownerKey]);

  const setBudgetInr = useCallback((value: number | null) => {
    setBudgetState(normalizeCartBudget(value));
  }, []);

  const remainingVsSubtotal = useCallback(
    (localSubtotal: number) => budgetDelta(budgetInr, localSubtotal),
    [budgetInr],
  );

  const value = useMemo(
    () => ({ hydrated, budgetInr, setBudgetInr, remainingVsSubtotal }),
    [budgetInr, hydrated, remainingVsSubtotal, setBudgetInr],
  );

  return <CartBudgetContext.Provider value={value}>{children}</CartBudgetContext.Provider>;
}

export function useCartBudget(): CartBudgetContextValue {
  const value = useContext(CartBudgetContext);
  if (!value) {
    throw new Error('useCartBudget must be used within CartBudgetProvider');
  }
  return value;
}
