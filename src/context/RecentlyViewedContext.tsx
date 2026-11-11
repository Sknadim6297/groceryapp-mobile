import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { useAuthSession } from '@/context/AuthSessionContext';
import {
  activateDeviceRecentlyViewedStore,
  loadRecentlyViewedIds,
  recentlyViewedOwnerKey,
  recordRecentlyViewedId,
  saveRecentlyViewedIds,
} from '@/services/recentlyViewedStore';
import { isDevOtpEnabled } from '@/services/devOtp';

type RecentlyViewedContextValue = {
  hydrated: boolean;
  ids: string[];
  /** Record a genuine product detail open. No-ops for blank / missing ids. */
  recordView: (productId: string) => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const { hydrated: authHydrated, session, devSession } = useAuthSession();
  const [hydrated, setHydrated] = useState(false);
  const [ownerKey, setOwnerKey] = useState<string | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  const persistReady = useRef(false);

  const resolveOwner = useCallback(() => {
    if (session) {
      return recentlyViewedOwnerKey({ kind: 'temporary-ui', mobile: session.mobile });
    }
    if (isDevOtpEnabled() && devSession) {
      return recentlyViewedOwnerKey({ kind: 'development-test', mobile: devSession.mobile });
    }
    return recentlyViewedOwnerKey(null);
  }, [devSession, session]);

  useEffect(() => {
    if (!authHydrated) {
      return;
    }
    let cancelled = false;
    void (async () => {
      persistReady.current = false;
      if (Platform.OS !== 'web') {
        await activateDeviceRecentlyViewedStore();
      }
      const nextOwner = resolveOwner();
      const restored = await loadRecentlyViewedIds(nextOwner);
      if (cancelled) {
        return;
      }
      setOwnerKey(nextOwner);
      setIds(restored);
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
    void saveRecentlyViewedIds(ownerKey, ids);
  }, [hydrated, ids, ownerKey]);

  const recordView = useCallback((productId: string) => {
    const id = productId.trim();
    if (!id) {
      return;
    }
    setIds((current) => recordRecentlyViewedId(current, id));
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      ids,
      recordView,
    }),
    [hydrated, ids, recordView],
  );

  return <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>;
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const value = useContext(RecentlyViewedContext);
  if (!value) {
    throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  }
  return value;
}
