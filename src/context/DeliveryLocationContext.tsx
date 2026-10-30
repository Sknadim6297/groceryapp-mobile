import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { DeliveryLocation } from '@/types/location';

type DeliveryLocationContextValue = {
  selection: DeliveryLocation | null;
  confirmed: DeliveryLocation | null;
  revisingProfile: boolean;
  setSelection: (location: DeliveryLocation | null) => void;
  setRevisingProfile: (value: boolean) => void;
  confirmSelection: () => void;
};

const DeliveryLocationContext = createContext<DeliveryLocationContextValue | null>(null);

export function DeliveryLocationProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<DeliveryLocation | null>(null);
  const [confirmed, setConfirmed] = useState<DeliveryLocation | null>(null);
  const [revisingProfile, setRevisingProfile] = useState(false);
  const value = useMemo(
    () => ({
      selection,
      confirmed,
      revisingProfile,
      setSelection,
      setRevisingProfile,
      confirmSelection: () => {
        setConfirmed(selection);
      },
    }),
    [selection, confirmed, revisingProfile],
  );

  return <DeliveryLocationContext.Provider value={value}>{children}</DeliveryLocationContext.Provider>;
}

export function useDeliveryLocation(): DeliveryLocationContextValue {
  const value = useContext(DeliveryLocationContext);

  if (!value) {
    throw new Error('useDeliveryLocation must be used within DeliveryLocationProvider');
  }

  return value;
}
