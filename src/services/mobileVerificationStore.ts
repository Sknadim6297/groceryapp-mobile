import type { MobileOtpVerification } from '@/services/mobileVerification';
import { isValidIndiaMobile } from '@/utils/phoneValidation';

const STORAGE_KEY = 'groceryapp.mobile-otp-verification';

type VerificationStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: VerificationStore = {
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

let store: VerificationStore = memoryStore;

export function installMobileVerificationStoreForTests(next: VerificationStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function serializeMobileOtpVerification(value: MobileOtpVerification): string | null {
  if (!isValidIndiaMobile(value.mobile)) {
    return null;
  }
  if (value.standing !== 'registered' && value.standing !== 'unregistered') {
    return null;
  }
  if (value.source !== 'verify-otp' && value.source !== 'development-test') {
    return null;
  }
  // Live proof without a server credential is not durable across restarts.
  if (value.source === 'verify-otp' && !value.credential?.value) {
    return null;
  }
  return JSON.stringify({
    mobile: value.mobile,
    standing: value.standing,
    source: value.source,
    credential: value.credential
      ? { mobile: value.credential.mobile, field: value.credential.field, value: value.credential.value }
      : null,
  });
}

export function parseMobileOtpVerification(raw: string | null): MobileOtpVerification | null {
  if (!raw) {
    return null;
  }
  try {
    const record = asRecord(JSON.parse(raw) as unknown);
    if (!record) {
      return null;
    }
    const mobile = typeof record.mobile === 'string' ? record.mobile : '';
    const standing = record.standing === 'registered' || record.standing === 'unregistered' ? record.standing : null;
    const source = record.source === 'verify-otp' || record.source === 'development-test' ? record.source : null;
    if (!isValidIndiaMobile(mobile) || !standing || !source) {
      return null;
    }
    const credentialRecord = asRecord(record.credential);
    const credential =
      credentialRecord &&
      typeof credentialRecord.field === 'string' &&
      typeof credentialRecord.value === 'string' &&
      credentialRecord.value.trim().length > 0
        ? {
            mobile: typeof credentialRecord.mobile === 'string' && isValidIndiaMobile(credentialRecord.mobile)
              ? credentialRecord.mobile
              : mobile,
            field: credentialRecord.field,
            value: credentialRecord.value.trim(),
          }
        : null;
    if (source === 'verify-otp' && !credential) {
      return null;
    }
    return { mobile, standing, source, credential };
  } catch {
    return null;
  }
}

export async function loadMobileOtpVerification(): Promise<MobileOtpVerification | null> {
  const raw = await store.read();
  const parsed = parseMobileOtpVerification(raw);
  if (raw && !parsed) {
    await store.remove();
  }
  return parsed;
}

export async function saveMobileOtpVerification(value: MobileOtpVerification): Promise<boolean> {
  const serialized = serializeMobileOtpVerification(value);
  if (!serialized) {
    return false;
  }
  await store.write(serialized);
  return true;
}

export async function clearMobileOtpVerification(): Promise<void> {
  await store.remove();
}

export async function activateDeviceMobileVerificationStore(): Promise<void> {
  try {
    const SecureStore = await import('expo-secure-store');
    store = {
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
    store = memoryStore;
  }
}
