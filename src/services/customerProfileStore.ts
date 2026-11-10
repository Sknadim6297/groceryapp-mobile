/**
 * Local editable customer profile for Edit Profile fields.
 */

import type { CustomerProfile, CustomerProfileDraft } from '@/types/customerProfile';
import { isValidIndiaMobile } from '@/utils/phoneValidation';
import { isValidEmail, parseIsoDate } from '@/utils/profileValidation';

const STORAGE_KEY = 'groceryapp.customer-profiles';

type ProfileStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: ProfileStore = {
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

let store: ProfileStore = memoryStore;

/** Tests replace the store so a restart can be simulated without a device. */
export function installCustomerProfileStoreForTests(next: ProfileStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export function profileOwnerKey(
  input: {
    mobile?: string | null;
    kind: 'temporary-ui' | 'development-test';
  } | null,
): string | null {
  const mobile = input?.mobile?.trim() ?? '';
  if (!input || !isValidIndiaMobile(mobile)) {
    return null;
  }
  return `${input.kind}:${mobile}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  return typeof value === 'string'
    ? value.trim()
    : typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : '';
}

export function parseCustomerProfile(value: unknown): CustomerProfile | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const ownerKey = text(record.ownerKey);
  const mobile = text(record.mobile);
  const name = text(record.name);
  const email = text(record.email);
  const dateOfBirth = text(record.dateOfBirth);
  if (!ownerKey || !isValidIndiaMobile(mobile) || name.length < 2) {
    return null;
  }
  if (email.length > 0 && !isValidEmail(email)) {
    return null;
  }
  if (dateOfBirth.length > 0 && !parseIsoDate(dateOfBirth)) {
    return null;
  }
  const updatedAt =
    typeof record.updatedAt === 'number' && Number.isFinite(record.updatedAt)
      ? record.updatedAt
      : Date.now();
  return {
    ownerKey,
    mobile,
    name,
    email,
    dateOfBirth,
    updatedAt,
  };
}

export function parseProfileVault(raw: string | null): Record<string, CustomerProfile> {
  if (!raw) {
    return {};
  }
  try {
    const root = asRecord(JSON.parse(raw) as unknown);
    if (!root) {
      return {};
    }
    const books = asRecord(root.profiles) ?? root;
    const vault: Record<string, CustomerProfile> = {};
    for (const [ownerKey, value] of Object.entries(books)) {
      const profile = parseCustomerProfile({
        ...(asRecord(value) ?? {}),
        ownerKey,
      });
      if (profile) {
        vault[ownerKey] = profile;
      }
    }
    return vault;
  } catch {
    return {};
  }
}

export function serializeProfileVault(vault: Record<string, CustomerProfile>): string {
  return JSON.stringify({ profiles: vault });
}

export async function loadProfileVault(): Promise<Record<string, CustomerProfile>> {
  return parseProfileVault(await store.read());
}

export async function saveProfileVault(vault: Record<string, CustomerProfile>): Promise<void> {
  if (Object.keys(vault).length === 0) {
    await store.remove();
    return;
  }
  await store.write(serializeProfileVault(vault));
}

export async function loadCustomerProfile(ownerKey: string): Promise<CustomerProfile | null> {
  const vault = await loadProfileVault();
  return vault[ownerKey] ?? null;
}

export function buildCustomerProfile(
  ownerKey: string,
  mobile: string,
  draft: CustomerProfileDraft,
  updatedAt = Date.now(),
  _previous: CustomerProfile | null = null,
): CustomerProfile | null {
  const name = draft.name.trim();
  const email = draft.email.trim();
  const dateOfBirth = draft.dateOfBirth.trim();
  if (!isValidIndiaMobile(mobile) || name.length < 2) {
    return null;
  }
  if (email.length > 0 && !isValidEmail(email)) {
    return null;
  }
  if (dateOfBirth.length > 0 && !parseIsoDate(dateOfBirth)) {
    return null;
  }

  return {
    ownerKey,
    mobile,
    name,
    email,
    dateOfBirth,
    updatedAt,
  };
}

export async function saveCustomerProfile(profile: CustomerProfile): Promise<boolean> {
  const parsed = parseCustomerProfile(profile);
  if (!parsed) {
    return false;
  }
  const vault = await loadProfileVault();
  vault[parsed.ownerKey] = parsed;
  await saveProfileVault(vault);
  return true;
}

export async function clearCustomerProfile(ownerKey: string): Promise<void> {
  const vault = await loadProfileVault();
  if (!(ownerKey in vault)) {
    return;
  }
  delete vault[ownerKey];
  await saveProfileVault(vault);
}

export async function secureCustomerProfileStore(): Promise<ProfileStore> {
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

export async function activateDeviceCustomerProfileStore(): Promise<void> {
  store = await secureCustomerProfileStore();
}
