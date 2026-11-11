/**
 * Owner-scoped local cart quantities.
 * Buy Now sessions are never stored here — only the persistent basket.
 */

import { addressOwnerKey } from '@/services/savedAddressStore';

const STORAGE_KEY = 'groceryapp.cart-quantities';
export const GUEST_CART_OWNER = 'guest';

type CartStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: CartStore = {
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

let store: CartStore = memoryStore;

/** Tests replace the store so a restart can be simulated without a device. */
export function installCartStoreForTests(next: CartStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export function cartOwnerKey(
  input: { mobile?: string | null; kind: 'temporary-ui' | 'development-test' } | null,
): string {
  return addressOwnerKey(input) ?? GUEST_CART_OWNER;
}

/**
 * Trim ids, drop invalid/zero qty, clamp 1–99, collapse duplicates by last write per id.
 */
export function normalizeCartQuantities(
  raw: Record<string, unknown> | null | undefined,
): Record<string, number> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const next: Record<string, number> = {};
  for (const [rawId, rawQty] of Object.entries(raw)) {
    const id = rawId.trim();
    if (!id) {
      continue;
    }
    const qty = typeof rawQty === 'number' ? rawQty : Number(rawQty);
    if (!Number.isFinite(qty)) {
      continue;
    }
    const clamped = Math.min(99, Math.max(0, Math.floor(qty)));
    if (clamped <= 0) {
      continue;
    }
    next[id] = clamped;
  }
  return next;
}

type CartVault = Record<string, Record<string, number>>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function parseCartVault(raw: string | null): CartVault {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const root = asRecord(parsed);
    if (!root) {
      return {};
    }
    // Legacy single-cart shape: { "productId": 2 }
    const looksLikeQuantities = Object.values(root).every(
      (value) => typeof value === 'number' || value == null,
    );
    if (looksLikeQuantities) {
      return { [GUEST_CART_OWNER]: normalizeCartQuantities(root) };
    }
    const vault: CartVault = {};
    for (const [owner, value] of Object.entries(root)) {
      const key = owner.trim();
      if (!key) {
        continue;
      }
      vault[key] = normalizeCartQuantities(asRecord(value) ?? undefined);
    }
    return vault;
  } catch {
    return {};
  }
}

export function serializeCartVault(vault: CartVault): string {
  const cleaned: CartVault = {};
  for (const [owner, quantities] of Object.entries(vault)) {
    const normalized = normalizeCartQuantities(quantities);
    if (Object.keys(normalized).length > 0) {
      cleaned[owner] = normalized;
    }
  }
  return JSON.stringify(cleaned);
}

async function readVault(): Promise<CartVault> {
  return parseCartVault(await store.read());
}

async function writeVault(vault: CartVault): Promise<void> {
  const serialized = serializeCartVault(vault);
  if (serialized === '{}') {
    await store.remove();
    return;
  }
  await store.write(serialized);
}

export async function loadCartQuantities(ownerKey: string): Promise<Record<string, number>> {
  const vault = await readVault();
  return normalizeCartQuantities(vault[ownerKey] ?? {});
}

export async function saveCartQuantities(
  ownerKey: string,
  quantities: Record<string, number>,
): Promise<void> {
  const vault = await readVault();
  const normalized = normalizeCartQuantities(quantities);
  if (Object.keys(normalized).length === 0) {
    delete vault[ownerKey];
  } else {
    vault[ownerKey] = normalized;
  }
  await writeVault(vault);
}

export async function clearCartQuantities(ownerKey: string): Promise<void> {
  const vault = await readVault();
  delete vault[ownerKey];
  await writeVault(vault);
}

export async function secureCartStore(): Promise<CartStore> {
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

export async function activateDeviceCartStore(): Promise<void> {
  store = await secureCartStore();
}
