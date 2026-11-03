import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import {
  activateDeviceWishlistStore,
  addWishlistId,
  clearWishlistStore,
  loadWishlistIds,
  removeWishlistId,
  saveWishlistIds,
  toggleWishlistId,
} from '@/services/wishlistStore';

type WishlistContextValue = {
  hydrated: boolean;
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
  const [hydrated, setHydrated] = useState(false);
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (Platform.OS !== 'web') {
        await activateDeviceWishlistStore();
      }
      const loaded = await loadWishlistIds();
      if (cancelled) {
        return;
      }
      setIds(loaded);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void saveWishlistIds(ids);
  }, [hydrated, ids]);

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
    void clearWishlistStore();
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      ids,
      count: ids.length,
      isSaved,
      toggle,
      add,
      remove,
      clearWishlist,
    }),
    [add, clearWishlist, hydrated, ids, isSaved, remove, toggle],
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
