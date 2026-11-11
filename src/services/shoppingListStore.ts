/**
 * Owner-scoped shopping lists (manual grocery notes + optional catalogue matches).
 */

import { addressOwnerKey } from '@/services/savedAddressStore';
import type { ShoppingList, ShoppingListItem } from '@/types/shoppingList';

const STORAGE_KEY = 'groceryapp.shopping-lists';
export const GUEST_SHOPPING_LIST_OWNER = 'guest';
export const MAX_SHOPPING_LISTS = 20;
export const MAX_LIST_ITEMS = 80;

type ListStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();
const memoryStore: ListStore = {
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

let store: ListStore = memoryStore;

export function installShoppingListStoreForTests(next: ListStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export function shoppingListOwnerKey(
  input: { mobile?: string | null; kind: 'temporary-ui' | 'development-test' } | null,
): string {
  return addressOwnerKey(input) ?? GUEST_SHOPPING_LIST_OWNER;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function clampQty(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return 1;
  }
  return Math.min(99, Math.max(1, Math.floor(n)));
}

export function normalizeShoppingListItem(raw: unknown): ShoppingListItem | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const id = typeof row.id === 'string' ? row.id.trim() : '';
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  if (!id || !name) {
    return null;
  }
  const matched =
    typeof row.matchedProductId === 'string' && row.matchedProductId.trim()
      ? row.matchedProductId.trim()
      : null;
  return {
    id,
    name,
    quantity: clampQty(row.quantity),
    completed: row.completed === true,
    matchedProductId: matched,
  };
}

export function normalizeShoppingList(raw: unknown): ShoppingList | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const id = typeof row.id === 'string' ? row.id.trim() : '';
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  if (!id || !name) {
    return null;
  }
  const itemsRaw = Array.isArray(row.items) ? row.items : [];
  const items: ShoppingListItem[] = [];
  const seen = new Set<string>();
  for (const item of itemsRaw) {
    const next = normalizeShoppingListItem(item);
    if (!next || seen.has(next.id)) {
      continue;
    }
    seen.add(next.id);
    items.push(next);
    if (items.length >= MAX_LIST_ITEMS) {
      break;
    }
  }
  const updatedAt =
    typeof row.updatedAt === 'number' && Number.isFinite(row.updatedAt) ? row.updatedAt : Date.now();
  return { id, name, items, updatedAt };
}

export function normalizeShoppingLists(raw: unknown): ShoppingList[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: ShoppingList[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const list = normalizeShoppingList(row);
    if (!list || seen.has(list.id)) {
      continue;
    }
    seen.add(list.id);
    out.push(list);
    if (out.length >= MAX_SHOPPING_LISTS) {
      break;
    }
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

type Vault = Record<string, ShoppingList[]>;

export function parseShoppingListVault(raw: string | null): Vault {
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
      const lists = normalizeShoppingLists(value);
      if (lists.length > 0) {
        vault[owner] = lists;
      }
    }
    return vault;
  } catch {
    return {};
  }
}

export function serializeShoppingListVault(vault: Vault): string {
  const next: Vault = {};
  for (const [owner, lists] of Object.entries(vault)) {
    const normalized = normalizeShoppingLists(lists);
    if (normalized.length > 0) {
      next[owner] = normalized;
    }
  }
  return JSON.stringify(next);
}

export async function loadShoppingLists(ownerKey: string): Promise<ShoppingList[]> {
  const vault = parseShoppingListVault(await store.read());
  return vault[ownerKey] ?? [];
}

export async function saveShoppingLists(ownerKey: string, lists: readonly ShoppingList[]): Promise<void> {
  const vault = parseShoppingListVault(await store.read());
  const next = normalizeShoppingLists(lists);
  if (next.length === 0) {
    delete vault[ownerKey];
  } else {
    vault[ownerKey] = next;
  }
  if (Object.keys(vault).length === 0) {
    await store.remove();
    return;
  }
  await store.write(serializeShoppingListVault(vault));
}

export function createShoppingListId(): string {
  return `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createShoppingListItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function activateDeviceShoppingListStore(): Promise<void> {
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
