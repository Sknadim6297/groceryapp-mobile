import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useAuthSession } from '@/context/AuthSessionContext';
import { normalizeCartQuantities } from '@/services/cartStore';
import { isDevOtpEnabled } from '@/services/devOtp';
import {
  activateDeviceSavedCartStore,
  createSavedCartId,
  loadSavedCarts,
  MAX_SAVED_CARTS,
  savedCartOwnerKey,
  saveSavedCarts,
} from '@/services/savedCartStore';
import type { SavedCart } from '@/types/savedCart';

type SavedCartsContextValue = {
  hydrated: boolean;
  carts: SavedCart[];
  saveCurrentCart: (name: string, quantities: Record<string, number>) => SavedCart | null;
  renameSavedCart: (id: string, name: string) => void;
  deleteSavedCart: (id: string) => void;
  getSavedCart: (id: string) => SavedCart | null;
};

const SavedCartsContext = createContext<SavedCartsContextValue | null>(null);

export function SavedCartsProvider({ children }: { children: ReactNode }) {
  const { hydrated: authHydrated, session, devSession } = useAuthSession();
  const [hydrated, setHydrated] = useState(false);
  const [ownerKey, setOwnerKey] = useState<string | null>(null);
  const [carts, setCarts] = useState<SavedCart[]>([]);
  const persistReady = useRef(false);

  const resolveOwner = useCallback(() => {
    if (session) {
      return savedCartOwnerKey({ kind: 'temporary-ui', mobile: session.mobile });
    }
    if (isDevOtpEnabled() && devSession) {
      return savedCartOwnerKey({ kind: 'development-test', mobile: devSession.mobile });
    }
    return savedCartOwnerKey(null);
  }, [devSession, session]);

  useEffect(() => {
    if (!authHydrated) {
      return;
    }
    let cancelled = false;
    void (async () => {
      persistReady.current = false;
      if (Platform.OS !== 'web') {
        await activateDeviceSavedCartStore();
      }
      const nextOwner = resolveOwner();
      const loaded = await loadSavedCarts(nextOwner);
      if (cancelled) {
        return;
      }
      setOwnerKey(nextOwner);
      setCarts(loaded);
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
    void saveSavedCarts(ownerKey, carts);
  }, [carts, hydrated, ownerKey]);

  const saveCurrentCart = useCallback((name: string, quantities: Record<string, number>) => {
    const trimmed = name.trim().slice(0, 60);
    const qty = normalizeCartQuantities(quantities);
    if (!trimmed || Object.keys(qty).length === 0) {
      return null;
    }
    let created: SavedCart | null = null;
    setCarts((current) => {
      if (current.length >= MAX_SAVED_CARTS) {
        return current;
      }
      created = {
        id: createSavedCartId(),
        name: trimmed,
        quantities: qty,
        savedAt: Date.now(),
      };
      return [created, ...current];
    });
    return created;
  }, []);

  const renameSavedCart = useCallback((id: string, name: string) => {
    const trimmed = name.trim().slice(0, 60);
    if (!trimmed) {
      return;
    }
    setCarts((current) =>
      current.map((cart) => (cart.id === id ? { ...cart, name: trimmed } : cart)),
    );
  }, []);

  const deleteSavedCart = useCallback((id: string) => {
    setCarts((current) => current.filter((cart) => cart.id !== id));
  }, []);

  const getSavedCart = useCallback((id: string) => carts.find((cart) => cart.id === id) ?? null, [carts]);

  const value = useMemo(
    () => ({ hydrated, carts, saveCurrentCart, renameSavedCart, deleteSavedCart, getSavedCart }),
    [carts, deleteSavedCart, getSavedCart, hydrated, renameSavedCart, saveCurrentCart],
  );

  return <SavedCartsContext.Provider value={value}>{children}</SavedCartsContext.Provider>;
}

export function useSavedCarts(): SavedCartsContextValue {
  const value = useContext(SavedCartsContext);
  if (!value) {
    throw new Error('useSavedCarts must be used within SavedCartsProvider');
  }
  return value;
}
