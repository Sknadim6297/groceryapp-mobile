import { isOtpVerifiedMessage } from '@/services/api/interpretCustomerResponse';
import type { CustomerApiResult, RegisteredCustomer } from '@/types/customerApi';
import { isValidIndiaMobile } from '@/utils/phoneValidation';

const STORAGE_KEY = 'groceryapp.remembered-customer';

/** Profile fields returned by a verified OTP. This is not a sign-in credential. */
export type RememberedCustomer = {
  mobile: string;
  customerId: string;
  name: string;
};

type RememberedStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: RememberedStore = {
  async read() {
    return memory.get(STORAGE_KEY) ?? null;
  },
  async write(value) {
    memory.set(STORAGE_KEY, value);
  },
  async remove() {
    memory.delete(STORAGE_KEY);
  },
};

let store: RememberedStore = memoryStore;

/** Tests replace the store so a restart can be simulated without a device. */
export function installRememberedStoreForTests(next: RememberedStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function textField(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

/** Ten-digit Indian mobile. A leading 91 is removed. Anything else is rejected. */
export function nationalMobile(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  const national = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return isValidIndiaMobile(national) ? national : null;
}

export function isRememberedCustomer(value: RememberedCustomer | null): value is RememberedCustomer {
  return Boolean(value && nationalMobile(value.mobile) === value.mobile && value.customerId.trim().length > 0 && value.name.trim().length > 0);
}

export function serializeRememberedCustomer(customer: RememberedCustomer): string | null {
  if (!isRememberedCustomer(customer)) {
    return null;
  }
  return JSON.stringify({
    mobile: customer.mobile,
    customerId: customer.customerId.trim(),
    name: customer.name.trim(),
  });
}

export function parseRememberedCustomer(raw: string | null): RememberedCustomer | null {
  if (!raw) {
    return null;
  }
  try {
    const record = asRecord(JSON.parse(raw) as unknown);
    if (!record) {
      return null;
    }
    const mobile = nationalMobile(textField(record.mobile) ?? '');
    const customerId = textField(record.customerId);
    const name = textField(record.name);
    if (!mobile || !customerId || !name) {
      return null;
    }
    return { mobile, customerId, name };
  } catch {
    return null;
  }
}

/**
 * Customer fields from a verified OTP.
 * A missing session, a failed status, or a different mobile returns null.
 */
export function profileFromVerifiedOtp(result: CustomerApiResult, requestedMobile: string): RememberedCustomer | null {
  if (!result.customer || result.tone === 'error' || !isOtpVerifiedMessage(result.message)) {
    return null;
  }
  const mobile = nationalMobile(result.customer.mobile);
  const requested = nationalMobile(requestedMobile);
  const customerId = result.customer.customerId.trim();
  const name = result.customer.name.trim();
  if (!mobile || !requested || mobile !== requested || customerId.length === 0 || name.length === 0) {
    return null;
  }
  return { mobile, customerId, name };
}

/**
 * Name / phone shown on Profile, Home, and the side menu.
 * A remembered profile is used only when the device login is for the same mobile.
 * Mobile is always returned when the active login has a valid number — even if Name
 * was missing from verify-otp (backend often omits CustomerId/Name).
 */
export function displayCustomer(
  login: { mobile: string; name?: string; customerId?: string } | null,
  account: RegisteredCustomer | null,
  remembered: RememberedCustomer | null,
): RegisteredCustomer | null {
  const sessionMobile = login ? nationalMobile(login.mobile) : null;
  if (!sessionMobile) {
    return null;
  }
  if (account && nationalMobile(account.mobile) === sessionMobile && account.name.trim().length > 0) {
    return {
      ...account,
      mobile: sessionMobile,
    };
  }
  if (remembered && remembered.mobile === sessionMobile && remembered.name.trim().length > 0) {
    return {
      customerId: remembered.customerId,
      name: remembered.name,
      mobile: remembered.mobile,
      companyMobile: null,
    };
  }
  const loginName = login?.name?.trim() ?? '';
  return {
    customerId: login?.customerId?.trim() || account?.customerId?.trim() || remembered?.customerId || '',
    name: loginName || account?.name?.trim() || '',
    mobile: sessionMobile,
    companyMobile: account?.companyMobile ?? null,
  };
}

/**
 * Prefer temporary UI login (live OTP path).
 * Development-test mobile is only used while Dev OTP mode is explicitly on.
 */
export function activeLoginForDisplay(
  session: { mobile: string; name?: string; customerId?: string } | null,
  devSession: { mobile: string } | null,
  allowDevSession = false,
): { mobile: string; name?: string; customerId?: string } | null {
  if (session?.mobile) {
    return session;
  }
  if (allowDevSession && devSession?.mobile) {
    return { mobile: devSession.mobile };
  }
  return null;
}

export async function loadRememberedCustomer(): Promise<RememberedCustomer | null> {
  const raw = await store.read();
  const customer = parseRememberedCustomer(raw);
  if (raw && !customer) {
    await store.remove();
  }
  return customer;
}

export async function saveRememberedCustomer(customer: RememberedCustomer): Promise<boolean> {
  const serialized = serializeRememberedCustomer(customer);
  if (!serialized) {
    return false;
  }
  await store.write(serialized);
  return true;
}

export async function clearRememberedCustomer(): Promise<void> {
  await store.remove();
}

export async function secureRememberedStore(): Promise<RememberedStore> {
  try {
    const SecureStore = await import('expo-secure-store');
    return {
      async read() {
        return SecureStore.getItemAsync(STORAGE_KEY);
      },
      async write(value) {
        await SecureStore.setItemAsync(STORAGE_KEY, value);
      },
      async remove() {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
      },
    };
  } catch {
    return memoryStore;
  }
}

export async function activateDeviceRememberedStore(): Promise<void> {
  store = await secureRememberedStore();
}
