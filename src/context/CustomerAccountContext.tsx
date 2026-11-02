import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { RegisteredCustomer } from '@/types/customerApi';

type CustomerAccountContextValue = {
  account: RegisteredCustomer | null;
  setAccount: (account: RegisteredCustomer) => void;
  clearAccount: () => void;
};

const CustomerAccountContext = createContext<CustomerAccountContextValue | null>(null);

/** Holds the customer record from a confirmed registration for this app session. Nothing is written to disk. */
export function CustomerAccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<RegisteredCustomer | null>(null);
  const clearAccount = useCallback(() => setAccount(null), []);
  const value = useMemo(() => ({ account, setAccount, clearAccount }), [account, clearAccount]);

  return <CustomerAccountContext.Provider value={value}>{children}</CustomerAccountContext.Provider>;
}

export function useCustomerAccount(): CustomerAccountContextValue {
  const value = useContext(CustomerAccountContext);
  if (!value) {
    throw new Error('useCustomerAccount must be used within CustomerAccountProvider');
  }
  return value;
}
