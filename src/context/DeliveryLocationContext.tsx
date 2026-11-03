import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Href } from 'expo-router';

import type { LocationIntent } from '@/navigation/locationFlow';
import type { DeliveryLocation } from '@/types/location';

type BeginLocationEditOptions = {
  /** Screen to reopen after Set Location (must not be the location picker itself). */
  returnTo?: Href;
};

type DeliveryLocationContextValue = {
  selection: DeliveryLocation | null;
  confirmed: DeliveryLocation | null;
  locationIntent: LocationIntent;
  /** Caller screen for Set Location exit. Cleared after a successful confirm navigation. */
  returnTo: Href | null;
  /** When true, Location Continue returns to the address form instead of onboarding/home. */
  addressBookPick: boolean;
  /** When address-book pick should return to checkout/cart select mode after save. */
  addressBookSelectMode: boolean;
  /** Filled when Location Continue finishes an address-book pick. */
  addressBookResult: DeliveryLocation | null;
  setSelection: (location: DeliveryLocation | null) => void;
  beginLocationEdit: (intent: LocationIntent, options?: BeginLocationEditOptions) => void;
  beginAddressBookPick: (options?: { selectMode?: boolean; returnTo?: Href }) => void;
  clearAddressBookPick: () => void;
  completeAddressBookPick: (location?: DeliveryLocation | null) => DeliveryLocation | null;
  consumeAddressBookResult: () => void;
  consumeReturnTo: () => Href | null;
  confirmSelection: () => void;
  applyConfirmed: (location: DeliveryLocation) => void;
  clearDelivery: () => void;
};

const DeliveryLocationContext = createContext<DeliveryLocationContextValue | null>(null);

export function DeliveryLocationProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<DeliveryLocation | null>(null);
  const [confirmed, setConfirmed] = useState<DeliveryLocation | null>(null);
  const [locationIntent, setLocationIntent] = useState<LocationIntent>('change');
  const [returnTo, setReturnTo] = useState<Href | null>(null);
  const [addressBookPick, setAddressBookPick] = useState(false);
  const [addressBookSelectMode, setAddressBookSelectMode] = useState(false);
  const [addressBookResult, setAddressBookResult] = useState<DeliveryLocation | null>(null);
  const clearDelivery = useCallback(() => {
    setSelection(null);
    setConfirmed(null);
    setLocationIntent('change');
    setReturnTo(null);
    setAddressBookPick(false);
    setAddressBookSelectMode(false);
    setAddressBookResult(null);
  }, []);
  const beginLocationEdit = useCallback((intent: LocationIntent, options?: BeginLocationEditOptions) => {
    setLocationIntent(intent);
    setReturnTo(options?.returnTo ?? null);
    setAddressBookPick(false);
    setAddressBookSelectMode(false);
  }, []);
  const beginAddressBookPick = useCallback((options?: { selectMode?: boolean; returnTo?: Href }) => {
    setAddressBookPick(true);
    setAddressBookSelectMode(options?.selectMode === true);
    setAddressBookResult(null);
    setReturnTo(options?.returnTo ?? null);
    setLocationIntent('change');
  }, []);
  const clearAddressBookPick = useCallback(() => {
    setAddressBookPick(false);
  }, []);
  const completeAddressBookPick = useCallback(
    (location?: DeliveryLocation | null) => {
      const picked = location ?? selection;
      setAddressBookPick(false);
      setAddressBookResult(picked);
      return picked;
    },
    [selection],
  );
  const consumeAddressBookResult = useCallback(() => {
    setAddressBookResult(null);
  }, []);
  const consumeReturnTo = useCallback(() => {
    const next = returnTo;
    setReturnTo(null);
    return next;
  }, [returnTo]);
  const confirmSelection = useCallback(() => {
    setConfirmed(selection);
  }, [selection]);
  const applyConfirmed = useCallback((location: DeliveryLocation) => {
    setSelection(location);
    setConfirmed(location);
  }, []);
  const value = useMemo(
    () => ({
      selection,
      confirmed,
      locationIntent,
      returnTo,
      addressBookPick,
      addressBookSelectMode,
      addressBookResult,
      setSelection,
      beginLocationEdit,
      beginAddressBookPick,
      clearAddressBookPick,
      completeAddressBookPick,
      consumeAddressBookResult,
      consumeReturnTo,
      confirmSelection,
      applyConfirmed,
      clearDelivery,
    }),
    [
      selection,
      confirmed,
      locationIntent,
      returnTo,
      addressBookPick,
      addressBookSelectMode,
      addressBookResult,
      beginLocationEdit,
      beginAddressBookPick,
      clearAddressBookPick,
      completeAddressBookPick,
      consumeAddressBookResult,
      consumeReturnTo,
      confirmSelection,
      applyConfirmed,
      clearDelivery,
    ],
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
