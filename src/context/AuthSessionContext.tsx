import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useAuthFlow } from '@/context/AuthFlowContext';
import { clearAuthSession as clearStoredCredential } from '@/services/authSession';
import {
  activateDeviceDevSessionStore,
  clearDevTestSession,
  loadDevTestSession,
  readDevTestSession,
  saveDevTestSession,
  type DevTestSession,
} from '@/services/devOtp';
import {
  activateDeviceTemporaryLoginStore,
  canEnterTemporaryUi,
  clearTemporaryUiLogin,
  loadTemporaryUiLogin,
  saveTemporaryUiLogin,
} from '@/services/temporaryUiLogin';
import type { TemporaryUiLogin } from '@/types/customerApi';

type AuthSessionContextValue = {
  hydrated: boolean;
  /**
   * TEMPORARY device login. Present only after verify-otp returned Status Success.
   * Do not send this value on customer API requests.
   */
  session: TemporaryUiLogin | null;
  /** Development-only UI login. Never a real customer session. */
  devSession: DevTestSession | null;
  signIn: (login: TemporaryUiLogin) => Promise<boolean>;
  keepDevelopmentLogin: () => Promise<boolean>;
  clearAuthSession: () => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const { setNationalNumber, setStanding } = useAuthFlow();
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<TemporaryUiLogin | null>(null);
  const [devSession, setDevSession] = useState<DevTestSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (Platform.OS !== 'web') {
        await activateDeviceTemporaryLoginStore();
        await activateDeviceDevSessionStore();
      }
      const restored = await loadTemporaryUiLogin();
      const development = await loadDevTestSession();
      if (!cancelled) {
        setSession(canEnterTemporaryUi(restored) ? restored : null);
        setDevSession(development);
        if (development) {
          setNationalNumber(development.mobile);
          setStanding(development.destination === 'home' ? 'registered' : 'unregistered');
        }
        setHydrated(true);
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, [setNationalNumber, setStanding]);

  const signIn = useCallback(async (next: TemporaryUiLogin) => {
    const saved = await saveTemporaryUiLogin(next);
    if (!saved) {
      return false;
    }
    const restored = await loadTemporaryUiLogin();
    if (!canEnterTemporaryUi(restored)) {
      return false;
    }
    setSession(restored);
    return true;
  }, []);

  const keepDevelopmentLogin = useCallback(async () => {
    const current = readDevTestSession();
    if (!current) {
      return false;
    }
    const saved = await saveDevTestSession(current);
    if (!saved) {
      return false;
    }
    const restored = await loadDevTestSession();
    if (!restored) {
      return false;
    }
    setNationalNumber(restored.mobile);
    setStanding(restored.destination === 'home' ? 'registered' : 'unregistered');
    setDevSession(restored);
    return true;
  }, [setNationalNumber, setStanding]);

  const clear = useCallback(() => {
    setSession(null);
    setDevSession(null);
    void clearTemporaryUiLogin();
    void clearStoredCredential();
    void clearDevTestSession();
  }, []);

  const value = useMemo(
    () => ({ hydrated, session, devSession, signIn, keepDevelopmentLogin, clearAuthSession: clear }),
    [clear, devSession, hydrated, keepDevelopmentLogin, session, signIn],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const value = useContext(AuthSessionContext);
  if (!value) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return value;
}
