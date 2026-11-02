import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type CustomerStanding = 'unknown' | 'unregistered' | 'registered';

type AuthFlowContextValue = {
  nationalNumber: string;
  setNationalNumber: (value: string) => void;
  standing: CustomerStanding;
  setStanding: (value: CustomerStanding) => void;
  otpDispatched: boolean;
  setOtpDispatched: (value: boolean) => void;
};

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [nationalNumber, setNationalNumberState] = useState('');
  const [standing, setStanding] = useState<CustomerStanding>('unknown');
  const [otpDispatched, setOtpDispatched] = useState(false);
  const numberRef = useRef('');

  const setNationalNumber = useCallback((value: string) => {
    if (numberRef.current !== value) {
      numberRef.current = value;
      setStanding('unknown');
      setOtpDispatched(false);
    }
    setNationalNumberState(value);
  }, []);

  const value = useMemo(
    () => ({ nationalNumber, setNationalNumber, standing, setStanding, otpDispatched, setOtpDispatched }),
    [nationalNumber, otpDispatched, setNationalNumber, standing],
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
