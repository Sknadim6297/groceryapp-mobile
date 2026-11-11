import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useAuthSession } from '@/context/AuthSessionContext';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import {
  buildUpdateAddressRequest,
  fetchAddressDetails,
  mergeRemoteAddressesIntoBook,
  updateAddress,
} from '@/services/customerAddressApi';
import {
  activateDeviceSavedAddressStore,
  addressOwnerKey,
  draftToSavedAddress,
  loadAddressBook,
  removeAddressFromList,
  saveAddressBook,
  withDefaultAddress,
} from '@/services/savedAddressStore';
import type { SavedAddress, SavedAddressDraft } from '@/types/savedAddress';
import {
  resolveConfirmedAfterDelete,
  shouldUpdateConfirmedAfterSave,
} from '@/utils/addressSelectionRules';
import { savedAddressToDeliveryLocation } from '@/utils/savedAddressMapping';
import { findDuplicateAddress, isAddressDraftReady } from '@/utils/savedAddressValidation';

type SaveAddressResult =
  | { ok: true; address: SavedAddress }
  | { ok: false; reason: 'validation' | 'duplicate' | 'no-owner' | 'missing' };

type SavedAddressesContextValue = {
  hydrated: boolean;
  ownerKey: string | null;
  addresses: SavedAddress[];
  defaultAddress: SavedAddress | null;
  saveAddress: (draft: SavedAddressDraft, options?: { id?: string; makeDefault?: boolean }) => Promise<SaveAddressResult>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
  selectAddressForDelivery: (addressId: string) => boolean;
  clearActiveBook: () => void;
};

const SavedAddressesContext = createContext<SavedAddressesContextValue | null>(null);

export function SavedAddressesProvider({ children }: { children: ReactNode }) {
  const { hydrated: authHydrated, session, devSession } = useAuthSession();
  const { confirmed, applyConfirmed, clearDelivery } = useDeliveryLocation();
  const [hydrated, setHydrated] = useState(false);
  const [ownerKey, setOwnerKey] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const confirmedRef = useRef(confirmed);
  const previousOwnerRef = useRef<string | null>(null);
  useEffect(() => {
    confirmedRef.current = confirmed;
  }, [confirmed]);

  const resolveOwner = useCallback(() => {
    if (session) {
      return addressOwnerKey({ kind: 'temporary-ui', mobile: session.mobile });
    }
    if (devSession) {
      return addressOwnerKey({ kind: 'development-test', mobile: devSession.mobile });
    }
    return null;
  }, [devSession, session]);

  useEffect(() => {
    if (!authHydrated) {
      return;
    }
    let cancelled = false;

    void (async () => {
      if (Platform.OS !== 'web') {
        await activateDeviceSavedAddressStore();
      }
      const nextOwner = resolveOwner();
      const previousOwner = previousOwnerRef.current;

      if (!nextOwner) {
        if (!cancelled) {
          // Leaving a signed-in book: drop that customer's saved delivery pick so it
          // cannot linger into a guest session. Keep in-session GPS/map/manual pins.
          if (previousOwner && confirmedRef.current?.source === 'saved') {
            clearDelivery();
          }
          previousOwnerRef.current = null;
          setOwnerKey(null);
          setAddresses([]);
          setHydrated(true);
        }
        return;
      }

      const book = await loadAddressBook(nextOwner);
      if (cancelled) {
        return;
      }

      let nextAddresses = book.addresses;
      const mobile = session?.mobile?.trim();
      if (mobile) {
        const remote = await fetchAddressDetails(mobile);
        if (!cancelled && remote.ok && remote.addresses.length > 0) {
          nextAddresses = mergeRemoteAddressesIntoBook(book.addresses, remote.addresses);
          await saveAddressBook({ ownerKey: nextOwner, addresses: nextAddresses });
        }
      }

      if (cancelled) {
        return;
      }

      const ownerChanged = Boolean(previousOwner && previousOwner !== nextOwner);
      previousOwnerRef.current = nextOwner;
      setOwnerKey(nextOwner);
      setAddresses(nextAddresses);
      setHydrated(true);

      const defaultAddress = nextAddresses.find((address) => address.isDefault) ?? nextAddresses[0];
      if (ownerChanged) {
        // Different signed-in customer: never keep the previous customer's confirmed address.
        if (defaultAddress) {
          applyConfirmed(savedAddressToDeliveryLocation(defaultAddress));
        } else {
          clearDelivery();
        }
        return;
      }

      // Never overwrite an in-session delivery pick (GPS/search/map) with the stored default.
      if (defaultAddress && confirmedRef.current == null) {
        applyConfirmed(savedAddressToDeliveryLocation(defaultAddress));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyConfirmed, authHydrated, clearDelivery, resolveOwner, session?.mobile]);

  const persist = useCallback(async (nextOwner: string, nextAddresses: SavedAddress[]) => {
    setAddresses(nextAddresses);
    await saveAddressBook({ ownerKey: nextOwner, addresses: nextAddresses });
  }, []);

  const syncAddressBookToServer = useCallback((nextAddresses: SavedAddress[]) => {
    const mobile = session?.mobile?.trim();
    if (!mobile || nextAddresses.length === 0) {
      return;
    }
    const built = buildUpdateAddressRequest(mobile, nextAddresses);
    if (!built.ok) {
      return;
    }
    void updateAddress(built.body).catch(() => {
      // Local address book remains the source of truth if update fails.
    });
  }, [session?.mobile]);

  const saveAddress = useCallback(
    async (draft: SavedAddressDraft, options?: { id?: string; makeDefault?: boolean }): Promise<SaveAddressResult> => {
      const nextOwner = ownerKey ?? resolveOwner();
      if (!nextOwner) {
        return { ok: false, reason: 'no-owner' };
      }
      if (!isAddressDraftReady(draft)) {
        return { ok: false, reason: 'validation' };
      }
      if (findDuplicateAddress(addresses, draft, options?.id)) {
        return { ok: false, reason: 'duplicate' };
      }

      let next = [...addresses];
      if (options?.id) {
        const index = next.findIndex((address) => address.id === options.id);
        if (index < 0) {
          return { ok: false, reason: 'missing' };
        }
        const previous = next[index];
        const updated = draftToSavedAddress(draft, {
          id: previous.id,
          isDefault: options.makeDefault === true ? true : previous.isDefault,
        });
        next[index] = updated;
        if (updated.isDefault) {
          next = withDefaultAddress(next, updated.id);
        }
        await persist(nextOwner, next);
        if (
          shouldUpdateConfirmedAfterSave({
            saved: updated,
            confirmedId: confirmedRef.current?.id,
          })
        ) {
          applyConfirmed(savedAddressToDeliveryLocation(updated));
        }
        syncAddressBookToServer(next);
        return { ok: true, address: updated };
      }

      const makeDefault = options?.makeDefault === true || next.length === 0;
      const created = draftToSavedAddress(draft, { isDefault: makeDefault });
      next = makeDefault ? withDefaultAddress([...next, created], created.id) : [...next, created];
      await persist(nextOwner, next);
      if (
        shouldUpdateConfirmedAfterSave({
          saved: created,
          confirmedId: confirmedRef.current?.id,
        })
      ) {
        applyConfirmed(savedAddressToDeliveryLocation(created));
      }
      syncAddressBookToServer(next);
      return { ok: true, address: created };
    },
    [addresses, applyConfirmed, ownerKey, persist, resolveOwner, syncAddressBookToServer],
  );

  const deleteAddress = useCallback(
    async (addressId: string) => {
      if (!ownerKey) {
        return false;
      }
      const existing = addresses.find((address) => address.id === addressId);
      if (!existing) {
        return false;
      }
      const next = removeAddressFromList(addresses, addressId);
      await persist(ownerKey, next);
      const decision = resolveConfirmedAfterDelete({
        confirmedId: confirmedRef.current?.id,
        deletedId: addressId,
        nextAddresses: next,
      });
      if (decision === 'clear') {
        clearDelivery();
      } else if (decision !== 'keep') {
        const selected = next.find((address) => address.id === decision.applyId);
        if (selected) {
          applyConfirmed(savedAddressToDeliveryLocation(selected));
        }
      }
      if (next.length > 0) {
        syncAddressBookToServer(next);
      }
      return true;
    },
    [addresses, applyConfirmed, clearDelivery, ownerKey, persist, syncAddressBookToServer],
  );

  const setDefaultAddress = useCallback(
    async (addressId: string) => {
      if (!ownerKey) {
        return false;
      }
      if (!addresses.some((address) => address.id === addressId)) {
        return false;
      }
      const next = withDefaultAddress(addresses, addressId);
      await persist(ownerKey, next);
      const selected = next.find((address) => address.id === addressId);
      if (selected) {
        applyConfirmed(savedAddressToDeliveryLocation(selected));
      }
      syncAddressBookToServer(next);
      return true;
    },
    [addresses, applyConfirmed, ownerKey, persist, syncAddressBookToServer],
  );

  const selectAddressForDelivery = useCallback(
    (addressId: string) => {
      const selected = addresses.find((address) => address.id === addressId);
      if (!selected) {
        return false;
      }
      applyConfirmed(savedAddressToDeliveryLocation(selected));
      return true;
    },
    [addresses, applyConfirmed],
  );

  const clearActiveBook = useCallback(() => {
    setOwnerKey(null);
    setAddresses([]);
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      ownerKey,
      addresses,
      defaultAddress: addresses.find((address) => address.isDefault) ?? addresses[0] ?? null,
      saveAddress,
      deleteAddress,
      setDefaultAddress,
      selectAddressForDelivery,
      clearActiveBook,
    }),
    [addresses, clearActiveBook, deleteAddress, hydrated, ownerKey, saveAddress, selectAddressForDelivery, setDefaultAddress],
  );

  return <SavedAddressesContext.Provider value={value}>{children}</SavedAddressesContext.Provider>;
}

export function useSavedAddresses(): SavedAddressesContextValue {
  const value = useContext(SavedAddressesContext);
  if (!value) {
    throw new Error('useSavedAddresses must be used within SavedAddressesProvider');
  }
  return value;
}
