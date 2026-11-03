import { hasSuccessStatus } from '@/services/api/interpretCustomerResponse';
import type { CustomerApiResult, TemporaryUiLogin } from '@/types/customerApi';
import { nationalMobile } from '@/services/rememberedCustomer';

const STORAGE_KEY = 'groceryapp.temporary-ui-login';
const BLOCKED_MESSAGE = /customer is not registered|already registered|duplicate mobile|mobile number already|invalid otp|incorrect otp|otp expired|otp is expired|expired otp|already used|otp (has been |is |was )?sent|verification code (has been |is |was )?sent|code (has been |is |was )?sent/i;

type LoginStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: LoginStore = {
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

let store: LoginStore = memoryStore;

/** Tests replace the store so a restart can be simulated without a device. */
export function installTemporaryLoginStoreForTests(next: LoginStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function textField(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  return '';
}

export function isTemporaryUiLogin(value: TemporaryUiLogin | null): value is TemporaryUiLogin {
  return Boolean(value && value.basis === 'temporary-ui' && nationalMobile(value.mobile) === value.mobile);
}

/** UI access for the temporary device login. A customer id or a typed mobile is not enough. */
export function canEnterTemporaryUi(login: TemporaryUiLogin | null): boolean {
  return isTemporaryUiLogin(login);
}

export function buildTemporaryUiLogin(requestedMobile: string, customer?: { mobile: string; customerId: string; name: string }): TemporaryUiLogin | null {
  const requested = nationalMobile(requestedMobile);
  if (!requested) {
    return null;
  }
  if (customer) {
    const returned = nationalMobile(customer.mobile);
    if (returned && returned !== requested) {
      return null;
    }
  }
  return {
    basis: 'temporary-ui',
    mobile: requested,
    customerId: customer?.customerId.trim() ?? '',
    name: customer?.name.trim() ?? '',
  };
}

export function serializeTemporaryUiLogin(login: TemporaryUiLogin): string | null {
  if (!isTemporaryUiLogin(login)) {
    return null;
  }
  return JSON.stringify({
    basis: 'temporary-ui',
    mobile: login.mobile,
    customerId: login.customerId.trim(),
    name: login.name.trim(),
  });
}

export function parseTemporaryUiLogin(raw: string | null): TemporaryUiLogin | null {
  if (!raw) {
    return null;
  }
  try {
    const record = asRecord(JSON.parse(raw) as unknown);
    if (!record || record.basis !== 'temporary-ui') {
      return null;
    }
    const mobile = nationalMobile(textField(record.mobile));
    if (!mobile) {
      return null;
    }
    return { basis: 'temporary-ui', mobile, customerId: textField(record.customerId), name: textField(record.name) };
  } catch {
    return null;
  }
}

/**
 * Turns a verify-otp Status Success into a device login.
 * Does not invent a token. Send, resend, and register results are left unchanged.
 */
export function applyTemporaryUiLogin(result: CustomerApiResult, body: unknown, requestedMobile: string): CustomerApiResult {
  const cleared: CustomerApiResult = { ...result, session: undefined, temporaryLogin: undefined, localLogin: undefined };
  // OTP-first: verified unregistered mobile keeps next=register. Preserve any server verification credential.
  if (result.next === 'register' && result.confirmed) {
    const mobile = nationalMobile(requestedMobile);
    const session =
      result.session && mobile
        ? { ...result.session, mobile }
        : result.session;
    return {
      ...cleared,
      tone: result.tone,
      message: result.message,
      confirmed: true,
      next: 'register',
      customer: result.customer,
      session,
    };
  }
  if (result.tone === 'error' || result.next === 'register' || result.next === 'otp' || BLOCKED_MESSAGE.test(result.message)) {
    return cleared;
  }
  if (!hasSuccessStatus(body)) {
    if (result.next === 'home') {
      return { ...cleared, next: 'stay', confirmed: false };
    }
    return cleared;
  }
  const temporaryLogin = buildTemporaryUiLogin(requestedMobile, result.customer);
  if (!temporaryLogin) {
    return { ...cleared, next: 'stay', confirmed: false };
  }
  const generic = /couldn.?t confirm|sign-in session|did not return status success/i.test(result.message);
  return {
    ...cleared,
    tone: 'success',
    confirmed: true,
    next: 'home',
    localLogin: 'temporary-ui',
    temporaryLogin,
    message: generic ? 'Verified. This sign-in is saved on this device.' : result.message,
  };
}

export async function loadTemporaryUiLogin(): Promise<TemporaryUiLogin | null> {
  const raw = await store.read();
  const login = parseTemporaryUiLogin(raw);
  if (raw && !login) {
    await store.remove();
  }
  return login;
}

export async function saveTemporaryUiLogin(login: TemporaryUiLogin): Promise<boolean> {
  const serialized = serializeTemporaryUiLogin(login);
  if (!serialized) {
    return false;
  }
  await store.write(serialized);
  return true;
}

export async function clearTemporaryUiLogin(): Promise<void> {
  await store.remove();
}

export async function secureTemporaryLoginStore(): Promise<LoginStore> {
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

export async function activateDeviceTemporaryLoginStore(): Promise<void> {
  store = await secureTemporaryLoginStore();
}
