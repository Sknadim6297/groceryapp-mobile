import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useAuthSession } from '@/context/AuthSessionContext';
import { useCustomerAccount } from '@/context/CustomerAccountContext';
import { useRememberedCustomer } from '@/context/RememberedCustomerContext';
import {
  activateDeviceCustomerProfileStore,
  buildCustomerProfile,
  loadCustomerProfile,
  profileOwnerKey,
  saveCustomerProfile,
} from '@/services/customerProfileStore';
import type { CustomerProfile, CustomerProfileDraft } from '@/types/customerProfile';

type SaveProfileResult =
  | { ok: true; profile: CustomerProfile; serverSynced: false }
  | { ok: false; reason: 'validation' | 'no-owner' | 'persist' };

type CustomerProfileContextValue = {
  hydrated: boolean;
  ownerKey: string | null;
  profile: CustomerProfile | null;
  saveProfile: (draft: CustomerProfileDraft) => Promise<SaveProfileResult>;
  clearActiveProfile: () => void;
};

const CustomerProfileContext = createContext<CustomerProfileContextValue | null>(null);

export function CustomerProfileProvider({ children }: { children: ReactNode }) {
  const { hydrated: authHydrated, session, devSession, updateSessionName } = useAuthSession();
  const { account, setAccount } = useCustomerAccount();
  const { customer: remembered, rememberCustomer } = useRememberedCustomer();
  const [hydrated, setHydrated] = useState(false);
  const [ownerKey, setOwnerKey] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  const resolveOwner = useCallback(() => {
    if (session) {
      return {
        key: profileOwnerKey({ kind: 'temporary-ui', mobile: session.mobile }),
        mobile: session.mobile,
        customerId: session.customerId.trim(),
        kind: 'temporary-ui' as const,
      };
    }
    if (devSession) {
      return {
        key: profileOwnerKey({ kind: 'development-test', mobile: devSession.mobile }),
        mobile: devSession.mobile,
        customerId: '',
        kind: 'development-test' as const,
      };
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
        await activateDeviceCustomerProfileStore();
      }
      const owner = resolveOwner();
      if (!owner?.key) {
        if (!cancelled) {
          setOwnerKey(null);
          setProfile(null);
          setHydrated(true);
        }
        return;
      }
      const loaded = await loadCustomerProfile(owner.key);
      if (cancelled) {
        return;
      }
      setOwnerKey(owner.key);
      setProfile(loaded);
      if (loaded?.name) {
        setAccount({
          customerId: owner.customerId,
          name: loaded.name,
          mobile: owner.mobile,
          companyMobile: null,
        });
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authHydrated, resolveOwner, setAccount]);

  const saveProfile = useCallback(
    async (draft: CustomerProfileDraft): Promise<SaveProfileResult> => {
      const owner = resolveOwner();
      if (!owner?.key) {
        return { ok: false, reason: 'no-owner' };
      }
      const next = buildCustomerProfile(owner.key, owner.mobile, draft);
      if (!next) {
        return { ok: false, reason: 'validation' };
      }
      const saved = await saveCustomerProfile(next);
      if (!saved) {
        return { ok: false, reason: 'persist' };
      }
      setOwnerKey(owner.key);
      setProfile(next);
      const customerId = owner.customerId || account?.customerId || remembered?.customerId || '';
      setAccount({
        customerId,
        name: next.name,
        mobile: owner.mobile,
        companyMobile: account?.companyMobile ?? null,
      });
      if (owner.kind === 'temporary-ui') {
        await updateSessionName(next.name);
      }
      if (customerId.length > 0) {
        await rememberCustomer({ mobile: owner.mobile, customerId, name: next.name });
      }
      return { ok: true, profile: next, serverSynced: false };
    },
    [account?.companyMobile, account?.customerId, rememberCustomer, remembered?.customerId, resolveOwner, setAccount, updateSessionName],
  );

  const clearActiveProfile = useCallback(() => {
    setOwnerKey(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      ownerKey,
      profile,
      saveProfile,
      clearActiveProfile,
    }),
    [clearActiveProfile, hydrated, ownerKey, profile, saveProfile],
  );

  return <CustomerProfileContext.Provider value={value}>{children}</CustomerProfileContext.Provider>;
}

export function useCustomerProfile(): CustomerProfileContextValue {
  const value = useContext(CustomerProfileContext);
  if (!value) {
    throw new Error('useCustomerProfile must be used within CustomerProfileProvider');
  }
  return value;
}
