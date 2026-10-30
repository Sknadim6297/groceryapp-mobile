import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type AuthFlowContextValue = {
  nationalNumber: string;
  setNationalNumber: (value: string) => void;
};

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [nationalNumber, setNationalNumber] = useState('');
  const value = useMemo(
    () => ({ nationalNumber, setNationalNumber }),
    [nationalNumber],
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
