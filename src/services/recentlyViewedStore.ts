/**
 * Owner-scoped recently viewed product ids (most-recent-first).
 * Display must resolve against the live catalogue — never invent products.
 */

import { addressOwnerKey } from '@/services/savedAddressStore';

const STORAGE_KEY = 'groceryapp.recently-viewed';
export const GUEST_RECENTLY_VIEWED_OWNER = 'guest';
export const MAX_RECENTLY_VIEWED = 20;

type RecentlyViewedStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: RecentlyViewedStore = {
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

let store: RecentlyViewedStore = memoryStore;

/** Tests replace the store so a restart can be simulated without a device. */
export function installRecentlyViewedStoreForTests(next: RecentlyViewedStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export function recentlyViewedOwnerKey(
  input: { mobile?: string | null; kind: 'temporary-ui' | 'development-test' } | null,
): string {
  return addressOwnerKey(input) ?? GUEST_RECENTLY_VIEWED_OWNER;
}

export function normalizeRecentlyViewedIds(
  ids: readonly string[],
  limit = MAX_RECENTLY_VIEWED,
): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const raw of ids) {
    const id = typeof raw === 'string' ? raw.trim() : '';
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    next.push(id);
    if (next.length >= limit) {
      break;
    }
  }
  return next;
}

/** Move product to the front; drop duplicates; cap length. */
export function recordRecentlyViewedId(
  ids: readonly string[],
  productId: string,
  limit = MAX_RECENTLY_VIEWED,
): string[] {
  const id = productId.trim();
  if (!id) {
    return normalizeRecentlyViewedIds(ids, limit);
  }
  return normalizeRecentlyViewedIds([id, ...ids], limit);
}

type Vault = Record<string, string[]>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function parseRecentlyViewedVault(raw: string | null): Vault {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return { [GUEST_RECENTLY_VIEWED_OWNER]: normalizeRecentlyViewedIds(parsed.filter((item): item is string => typeof item === 'string')) };
    }
    const root = asRecord(parsed);
    if (!root) {
      return {};
    }
    const vault: Vault = {};
    for (const [owner, value] of Object.entries(root)) {
      const key = owner.trim();
      if (!key || !Array.isArray(value)) {
        continue;
      }
      vault[key] = normalizeRecentlyViewedIds(value.filter((item): item is string => typeof item === 'string'));
    }
    return vault;
  } catch {
    return {};
  }
}

export function serializeRecentlyViewedVault(vault: Vault): string {
  const cleaned: Vault = {};
  for (const [owner, ids] of Object.entries(vault)) {
    const normalized = normalizeRecentlyViewedIds(ids);
    if (normalized.length > 0) {
      cleaned[owner] = normalized;
    }
  }
  return JSON.stringify(cleaned);
}

async function readVault(): Promise<Vault> {
  return parseRecentlyViewedVault(await store.read());
}

async function writeVault(vault: Vault): Promise<void> {
  const serialized = serializeRecentlyViewedVault(vault);
  if (serialized === '{}') {
    await store.remove();
    return;
  }
  await store.write(serialized);
}

export async function loadRecentlyViewedIds(ownerKey: string): Promise<string[]> {
  const vault = await readVault();
  return normalizeRecentlyViewedIds(vault[ownerKey] ?? []);
}

export async function saveRecentlyViewedIds(ownerKey: string, ids: readonly string[]): Promise<void> {
  const vault = await readVault();
  const normalized = normalizeRecentlyViewedIds(ids);
  if (normalized.length === 0) {
    delete vault[ownerKey];
  } else {
    vault[ownerKey] = normalized;
  }
  await writeVault(vault);
}

export async function clearRecentlyViewedIds(ownerKey: string): Promise<void> {
  const vault = await readVault();
  delete vault[ownerKey];
  await writeVault(vault);
}

export async function secureRecentlyViewedStore(): Promise<RecentlyViewedStore> {
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

export async function activateDeviceRecentlyViewedStore(): Promise<void> {
  store = await secureRecentlyViewedStore();
}
