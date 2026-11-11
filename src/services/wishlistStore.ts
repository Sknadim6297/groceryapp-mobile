/**
 * Owner-scoped local wishlist of catalogue product ids.
 * Ready to swap the store for a future C# / ASP.NET wishlist API.
 */

import { addressOwnerKey } from '@/services/savedAddressStore';

const STORAGE_KEY = 'groceryapp.wishlist';
export const GUEST_WISHLIST_OWNER = 'guest';

type WishlistStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: WishlistStore = {
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

let store: WishlistStore = memoryStore;

/** Tests replace the store so a restart can be simulated without a device. */
export function installWishlistStoreForTests(next: WishlistStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export function wishlistOwnerKey(
  input: { mobile?: string | null; kind: 'temporary-ui' | 'development-test' } | null,
): string {
  return addressOwnerKey(input) ?? GUEST_WISHLIST_OWNER;
}

export function normalizeWishlistIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const raw of ids) {
    const id = typeof raw === 'string' ? raw.trim() : '';
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    next.push(id);
  }
  return next;
}

export function toggleWishlistId(ids: readonly string[], productId: string): string[] {
  const id = productId.trim();
  if (!id) {
    return normalizeWishlistIds(ids);
  }
  const current = normalizeWishlistIds(ids);
  if (current.includes(id)) {
    return current.filter((item) => item !== id);
  }
  return [...current, id];
}

export function addWishlistId(ids: readonly string[], productId: string): string[] {
  const id = productId.trim();
  if (!id) {
    return normalizeWishlistIds(ids);
  }
  const current = normalizeWishlistIds(ids);
  return current.includes(id) ? current : [...current, id];
}

export function removeWishlistId(ids: readonly string[], productId: string): string[] {
  const id = productId.trim();
  if (!id) {
    return normalizeWishlistIds(ids);
  }
  return normalizeWishlistIds(ids).filter((item) => item !== id);
}

type WishlistVault = Record<string, string[]>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function parseWishlistVault(raw: string | null): WishlistVault {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    // Legacy flat array shape: ["id1","id2"]
    if (Array.isArray(parsed)) {
      return {
        [GUEST_WISHLIST_OWNER]: normalizeWishlistIds(
          parsed.filter((item): item is string => typeof item === 'string'),
        ),
      };
    }
    const root = asRecord(parsed);
    if (!root) {
      return {};
    }
    const vault: WishlistVault = {};
    for (const [owner, value] of Object.entries(root)) {
      if (!Array.isArray(value)) {
        continue;
      }
      vault[owner] = normalizeWishlistIds(value.filter((item): item is string => typeof item === 'string'));
    }
    return vault;
  } catch {
    return {};
  }
}

export function serializeWishlistVault(vault: WishlistVault): string {
  const next: WishlistVault = {};
  for (const [owner, ids] of Object.entries(vault)) {
    const normalized = normalizeWishlistIds(ids);
    if (normalized.length > 0) {
      next[owner] = normalized;
    }
  }
  return JSON.stringify(next);
}

/** @deprecated Prefer serializeWishlistVault — kept for unit helpers. */
export function serializeWishlistIds(ids: readonly string[]): string {
  return JSON.stringify(normalizeWishlistIds(ids));
}

/** @deprecated Prefer parseWishlistVault — kept for unit helpers. */
export function parseWishlistIds(raw: string | null): string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return normalizeWishlistIds(parsed.filter((item): item is string => typeof item === 'string'));
    }
  } catch {
    return [];
  }
  return [];
}

export async function loadWishlistIds(ownerKey: string): Promise<string[]> {
  const vault = parseWishlistVault(await store.read());
  return vault[ownerKey] ?? [];
}

export async function saveWishlistIds(ownerKey: string, ids: readonly string[]): Promise<void> {
  const vault = parseWishlistVault(await store.read());
  const next = normalizeWishlistIds(ids);
  if (next.length === 0) {
    delete vault[ownerKey];
  } else {
    vault[ownerKey] = next;
  }
  const owners = Object.keys(vault);
  if (owners.length === 0) {
    await store.remove();
    return;
  }
  await store.write(serializeWishlistVault(vault));
}

export async function clearWishlistForOwner(ownerKey: string): Promise<void> {
  await saveWishlistIds(ownerKey, []);
}

export async function clearWishlistStore(): Promise<void> {
  await store.remove();
}

export async function secureWishlistStore(): Promise<WishlistStore> {
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

export async function activateDeviceWishlistStore(): Promise<void> {
  store = await secureWishlistStore();
}
