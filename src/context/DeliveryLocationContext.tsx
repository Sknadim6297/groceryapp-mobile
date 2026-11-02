import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { LocationIntent } from '@/navigation/locationFlow';
import type { DeliveryLocation } from '@/types/location';

type DeliveryLocationContextValue = {
  selection: DeliveryLocation | null;
  confirmed: DeliveryLocation | null;
  locationIntent: LocationIntent;
  setSelection: (location: DeliveryLocation | null) => void;
  beginLocationEdit: (intent: LocationIntent) => void;
  confirmSelection: () => void;
  clearDelivery: () => void;
};

const DeliveryLocationContext = createContext<DeliveryLocationContextValue | null>(null);

export function DeliveryLocationProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<DeliveryLocation | null>(null);
  const [confirmed, setConfirmed] = useState<DeliveryLocation | null>(null);
  const [locationIntent, setLocationIntent] = useState<LocationIntent>('change');
  const clearDelivery = useCallback(() => {
    setSelection(null);
    setConfirmed(null);
    setLocationIntent('change');
  }, []);
  const beginLocationEdit = useCallback((intent: LocationIntent) => {
    setLocationIntent(intent);
  }, []);
  const confirmSelection = useCallback(() => {
    setConfirmed(selection);
  }, [selection]);
  const value = useMemo(
    () => ({
      selection,
      confirmed,
      locationIntent,
      setSelection,
      beginLocationEdit,
      confirmSelection,
      clearDelivery,
    }),
    [selection, confirmed, locationIntent, beginLocationEdit, confirmSelection, clearDelivery],
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
