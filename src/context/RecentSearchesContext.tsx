import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useAuthSession } from '@/context/AuthSessionContext';
import { isDevOtpEnabled } from '@/services/devOtp';
import {
  activateDeviceRecentSearchStore,
  loadRecentSearches,
  recentSearchOwnerKey,
  recordRecentSearch,
  saveRecentSearches,
} from '@/services/recentSearchStore';

type RecentSearchesContextValue = {
  hydrated: boolean;
  queries: string[];
  /** Record a committed search only (not keystrokes). Empty string ignored. */
  remember: (query: string) => void;
  /** Remove one query (case-insensitive). */
  removeQuery: (query: string) => void;
  clearHistory: () => void;
};

const RecentSearchesContext = createContext<RecentSearchesContextValue | null>(null);

export function RecentSearchesProvider({ children }: { children: ReactNode }) {
  const { hydrated: authHydrated, session, devSession } = useAuthSession();
  const [hydrated, setHydrated] = useState(false);
  const [ownerKey, setOwnerKey] = useState<string | null>(null);
  const [queries, setQueries] = useState<string[]>([]);
  const persistReady = useRef(false);

  const resolveOwner = useCallback(() => {
    if (session) {
      return recentSearchOwnerKey({ kind: 'temporary-ui', mobile: session.mobile });
    }
    if (isDevOtpEnabled() && devSession) {
      return recentSearchOwnerKey({ kind: 'development-test', mobile: devSession.mobile });
    }
    return recentSearchOwnerKey(null);
  }, [devSession, session]);

  useEffect(() => {
    if (!authHydrated) {
      return;
    }
    let cancelled = false;
    void (async () => {
      persistReady.current = false;
      if (Platform.OS !== 'web') {
        await activateDeviceRecentSearchStore();
      }
      const nextOwner = resolveOwner();
      const loaded = await loadRecentSearches(nextOwner);
      if (cancelled) {
        return;
      }
      setOwnerKey(nextOwner);
      setQueries(loaded);
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
    void saveRecentSearches(ownerKey, queries);
  }, [hydrated, ownerKey, queries]);

  const remember = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    setQueries((current) => recordRecentSearch(current, trimmed));
  }, []);

  const removeQuery = useCallback((query: string) => {
    const key = query.trim().toLowerCase();
    if (!key) {
      return;
    }
    setQueries((current) => current.filter((item) => item.trim().toLowerCase() !== key));
  }, []);

  const clearHistory = useCallback(() => {
    setQueries([]);
  }, []);

  const value = useMemo(
    () => ({ hydrated, queries, remember, removeQuery, clearHistory }),
    [clearHistory, hydrated, queries, remember, removeQuery],
  );

  return <RecentSearchesContext.Provider value={value}>{children}</RecentSearchesContext.Provider>;
}

export function useRecentSearches(): RecentSearchesContextValue {
  const value = useContext(RecentSearchesContext);
  if (!value) {
    throw new Error('useRecentSearches must be used within RecentSearchesProvider');
  }
  return value;
}
