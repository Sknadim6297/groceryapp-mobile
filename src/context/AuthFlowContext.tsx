import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

import type { MobileOtpVerification } from '@/services/mobileVerification';

export type CustomerStanding = 'unknown' | 'unregistered' | 'registered';

type AuthFlowContextValue = {
  nationalNumber: string;
  setNationalNumber: (value: string) => void;
  standing: CustomerStanding;
  setStanding: (value: CustomerStanding) => void;
  otpDispatched: boolean;
  setOtpDispatched: (value: boolean) => void;
  /**
   * Set only after a successful OTP verification in this onboarding flow.
   * Cleared when the mobile number changes. Not a substitute for server Status Success.
   */
  mobileVerification: MobileOtpVerification | null;
  setMobileVerification: (value: MobileOtpVerification | null) => void;
  /** Sets the number and onboarding step together. Does not clear a step that was just restored. */
  commitAuthFlow: (next: {
    nationalNumber: string;
    standing: CustomerStanding;
    otpDispatched: boolean;
    mobileVerification?: MobileOtpVerification | null;
  }) => void;
};

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [nationalNumber, setNationalNumberState] = useState('');
  const [standing, setStanding] = useState<CustomerStanding>('unknown');
  const [otpDispatched, setOtpDispatched] = useState(false);
  const [mobileVerification, setMobileVerification] = useState<MobileOtpVerification | null>(null);
  const numberRef = useRef('');

  const setNationalNumber = useCallback((value: string) => {
    if (numberRef.current !== value) {
      numberRef.current = value;
      setStanding('unknown');
      setOtpDispatched(false);
      setMobileVerification(null);
    }
    setNationalNumberState(value);
  }, []);

  const commitAuthFlow = useCallback(
    (next: {
      nationalNumber: string;
      standing: CustomerStanding;
      otpDispatched: boolean;
      mobileVerification?: MobileOtpVerification | null;
    }) => {
      numberRef.current = next.nationalNumber;
      setNationalNumberState(next.nationalNumber);
      setStanding(next.standing);
      setOtpDispatched(next.otpDispatched);
      if (next.mobileVerification !== undefined) {
        setMobileVerification(next.mobileVerification);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      nationalNumber,
      setNationalNumber,
      standing,
      setStanding,
      otpDispatched,
      setOtpDispatched,
      mobileVerification,
      setMobileVerification,
      commitAuthFlow,
    }),
    [commitAuthFlow, mobileVerification, nationalNumber, otpDispatched, setNationalNumber, standing],
  );

  return <AuthFlowContext.Provider value={value}>{children}</AuthFlowContext.Provider>;
}

export function useAuthFlow(): AuthFlowContextValue {
  const value = useContext(AuthFlowContext);

  if (!value) {
    throw new Error('useAuthFlow must be used within AuthFlowProvider');
  }

  return value;
}
