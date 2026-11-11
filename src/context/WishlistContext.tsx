import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useAuthSession } from '@/context/AuthSessionContext';
import { isDevOtpEnabled } from '@/services/devOtp';
import {
  activateDeviceWishlistStore,
  addWishlistId,
  clearWishlistForOwner,
  loadWishlistIds,
  removeWishlistId,
  saveWishlistIds,
  toggleWishlistId,
  wishlistOwnerKey,
} from '@/services/wishlistStore';

type WishlistContextValue = {
  hydrated: boolean;
  ownerKey: string | null;
  ids: string[];
  count: number;
  isSaved: (productId: string) => boolean;
  toggle: (productId: string) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { hydrated: authHydrated, session, devSession } = useAuthSession();
  const [hydrated, setHydrated] = useState(false);
  const [ownerKey, setOwnerKey] = useState<string | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  const persistReady = useRef(false);

  const resolveOwner = useCallback(() => {
    if (session) {
      return wishlistOwnerKey({ kind: 'temporary-ui', mobile: session.mobile });
    }
    if (isDevOtpEnabled() && devSession) {
      return wishlistOwnerKey({ kind: 'development-test', mobile: devSession.mobile });
    }
    return wishlistOwnerKey(null);
  }, [devSession, session]);

  useEffect(() => {
    if (!authHydrated) {
      return;
    }
    let cancelled = false;

    void (async () => {
      persistReady.current = false;
      if (Platform.OS !== 'web') {
        await activateDeviceWishlistStore();
      }
      const nextOwner = resolveOwner();
      const loaded = await loadWishlistIds(nextOwner);
      if (cancelled) {
        return;
      }
      setOwnerKey(nextOwner);
      setIds(loaded);
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
    void saveWishlistIds(ownerKey, ids);
  }, [hydrated, ids, ownerKey]);

  const isSaved = useCallback((productId: string) => ids.includes(productId.trim()), [ids]);

  const toggle = useCallback((productId: string) => {
    setIds((current) => toggleWishlistId(current, productId));
  }, []);

  const add = useCallback((productId: string) => {
    setIds((current) => addWishlistId(current, productId));
  }, []);

  const remove = useCallback((productId: string) => {
    setIds((current) => removeWishlistId(current, productId));
  }, []);

  const clearWishlist = useCallback(() => {
    setIds([]);
    if (ownerKey) {
      void clearWishlistForOwner(ownerKey);
    }
  }, [ownerKey]);

  const value = useMemo(
    () => ({
      hydrated,
      ownerKey,
      ids,
      count: ids.length,
      isSaved,
      toggle,
      add,
      remove,
      clearWishlist,
    }),
    [add, clearWishlist, hydrated, ids, isSaved, ownerKey, remove, toggle],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const value = useContext(WishlistContext);
  if (!value) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return value;
}
