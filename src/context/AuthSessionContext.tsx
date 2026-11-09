import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useAuthFlow } from '@/context/AuthFlowContext';
import { clearAuthSession as clearStoredCredential } from '@/services/authSession';
import {
  activateDeviceDevSessionStore,
  clearDevTestSession,
  isDevOtpEnabled,
  loadDevTestSession,
  readDevTestSession,
  saveDevTestSession,
  type DevTestSession,
} from '@/services/devOtp';
import {
  activateDeviceMobileVerificationStore,
  clearMobileOtpVerification,
  loadMobileOtpVerification,
} from '@/services/mobileVerificationStore';
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
  /** Updates the temporary UI login display name on this device only. */
  updateSessionName: (name: string) => Promise<boolean>;
  keepDevelopmentLogin: () => Promise<boolean>;
  clearAuthSession: () => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const { commitAuthFlow } = useAuthFlow();
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<TemporaryUiLogin | null>(null);
  const [devSession, setDevSession] = useState<DevTestSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (Platform.OS !== 'web') {
        await activateDeviceTemporaryLoginStore();
        await activateDeviceDevSessionStore();
        await activateDeviceMobileVerificationStore();
      }
      const restored = await loadTemporaryUiLogin();
      // Dev OTP off → wipe any leftover development-test session (do not treat as live login).
      const development = isDevOtpEnabled() ? await loadDevTestSession() : null;
      if (!isDevOtpEnabled()) {
        await clearDevTestSession();
      }
      let verification = await loadMobileOtpVerification();
      if (verification?.source === 'development-test' && !isDevOtpEnabled()) {
        await clearMobileOtpVerification();
        verification = null;
      }
      if (!cancelled) {
        const login = canEnterTemporaryUi(restored) ? restored : null;
        setSession(login);
        setDevSession(development);
        if (development && isDevOtpEnabled()) {
          commitAuthFlow({
            nationalNumber: development.mobile,
            standing: development.destination === 'home' ? 'registered' : 'unregistered',
            otpDispatched: true,
            mobileVerification:
              verification && verification.mobile === development.mobile
                ? verification
                : development.destination === 'complete-profile'
                  ? {
                      mobile: development.mobile,
                      standing: 'unregistered',
                      source: 'development-test',
                      credential: null,
                    }
                  : null,
          });
        } else if (login) {
          commitAuthFlow({
            nationalNumber: login.mobile,
            standing: 'registered',
            otpDispatched: true,
            mobileVerification: null,
          });
        } else if (verification && verification.source !== 'development-test') {
          commitAuthFlow({
            nationalNumber: verification.mobile,
            standing: verification.standing,
            otpDispatched: true,
            mobileVerification: verification,
          });
        }
        setHydrated(true);
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, [commitAuthFlow]);

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

  const updateSessionName = useCallback(async (name: string) => {
    const current = session;
    if (!current || !canEnterTemporaryUi(current)) {
      return false;
    }
    const next: TemporaryUiLogin = {
      basis: 'temporary-ui',
      mobile: current.mobile,
      customerId: current.customerId,
      name: name.trim(),
    };
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
  }, [session]);

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
    commitAuthFlow({
      nationalNumber: restored.mobile,
      standing: restored.destination === 'home' ? 'registered' : 'unregistered',
      otpDispatched: true,
    });
    setDevSession(restored);
    return true;
  }, [commitAuthFlow]);

  const clear = useCallback(() => {
    setSession(null);
    setDevSession(null);
    void clearTemporaryUiLogin();
    void clearStoredCredential();
    void clearDevTestSession();
    void clearMobileOtpVerification();
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      session,
      devSession,
      signIn,
      updateSessionName,
      keepDevelopmentLogin,
      clearAuthSession: clear,
    }),
    [clear, devSession, hydrated, keepDevelopmentLogin, session, signIn, updateSessionName],
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
