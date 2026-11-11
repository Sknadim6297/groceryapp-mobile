/**
 * Named cart snapshots per owner. Quantities only — not authoritative prices.
 */

import { normalizeCartQuantities } from '@/services/cartStore';
import { addressOwnerKey } from '@/services/savedAddressStore';
import type { SavedCart } from '@/types/savedCart';

const STORAGE_KEY = 'groceryapp.saved-carts';
export const GUEST_SAVED_CART_OWNER = 'guest';
export const MAX_SAVED_CARTS = 15;

type CartSnapStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();
const memoryStore: CartSnapStore = {
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

let store: CartSnapStore = memoryStore;

export function installSavedCartStoreForTests(next: CartSnapStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export function savedCartOwnerKey(
  input: { mobile?: string | null; kind: 'temporary-ui' | 'development-test' } | null,
): string {
  return addressOwnerKey(input) ?? GUEST_SAVED_CART_OWNER;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function normalizeSavedCart(raw: unknown): SavedCart | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const id = typeof row.id === 'string' ? row.id.trim() : '';
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  if (!id || !name) {
    return null;
  }
  const quantities = normalizeCartQuantities(asRecord(row.quantities) ?? {});
  if (Object.keys(quantities).length === 0) {
    return null;
  }
  const savedAt =
    typeof row.savedAt === 'number' && Number.isFinite(row.savedAt) ? row.savedAt : Date.now();
  return { id, name, quantities, savedAt };
}

export function normalizeSavedCarts(raw: unknown): SavedCart[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: SavedCart[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const cart = normalizeSavedCart(row);
    if (!cart || seen.has(cart.id)) {
      continue;
    }
    seen.add(cart.id);
    out.push(cart);
    if (out.length >= MAX_SAVED_CARTS) {
      break;
    }
  }
  return out.sort((a, b) => b.savedAt - a.savedAt);
}

type Vault = Record<string, SavedCart[]>;

export function parseSavedCartVault(raw: string | null): Vault {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const root = asRecord(parsed);
    if (!root) {
      return {};
    }
    const vault: Vault = {};
    for (const [owner, value] of Object.entries(root)) {
      const carts = normalizeSavedCarts(value);
      if (carts.length > 0) {
        vault[owner] = carts;
      }
    }
    return vault;
  } catch {
    return {};
  }
}

export function serializeSavedCartVault(vault: Vault): string {
  const next: Vault = {};
  for (const [owner, carts] of Object.entries(vault)) {
    const normalized = normalizeSavedCarts(carts);
    if (normalized.length > 0) {
      next[owner] = normalized;
    }
  }
  return JSON.stringify(next);
}

export async function loadSavedCarts(ownerKey: string): Promise<SavedCart[]> {
  const vault = parseSavedCartVault(await store.read());
  return vault[ownerKey] ?? [];
}

export async function saveSavedCarts(ownerKey: string, carts: readonly SavedCart[]): Promise<void> {
  const vault = parseSavedCartVault(await store.read());
  const next = normalizeSavedCarts(carts);
  if (next.length === 0) {
    delete vault[ownerKey];
  } else {
    vault[ownerKey] = next;
  }
  if (Object.keys(vault).length === 0) {
    await store.remove();
    return;
  }
  await store.write(serializeSavedCartVault(vault));
}

export function createSavedCartId(): string {
  return `saved-cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function activateDeviceSavedCartStore(): Promise<void> {
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
