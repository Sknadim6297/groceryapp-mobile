/**
 * Optional cart budget (INR) per owner. Compared to local catalogue subtotal only.
 */

import { addressOwnerKey } from '@/services/savedAddressStore';

const STORAGE_KEY = 'groceryapp.cart-budget';
export const GUEST_CART_BUDGET_OWNER = 'guest';
export const MAX_CART_BUDGET_INR = 1_000_000;

type BudgetStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();
const memoryStore: BudgetStore = {
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

let store: BudgetStore = memoryStore;

export function installCartBudgetStoreForTests(next: BudgetStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export function cartBudgetOwnerKey(
  input: { mobile?: string | null; kind: 'temporary-ui' | 'development-test' } | null,
): string {
  return addressOwnerKey(input) ?? GUEST_CART_BUDGET_OWNER;
}

/** Whole rupees only. null clears the budget. */
export function normalizeCartBudget(raw: unknown): number | null {
  if (raw == null || raw === '') {
    return null;
  }
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return Math.min(MAX_CART_BUDGET_INR, Math.max(1, Math.floor(n)));
}

type Vault = Record<string, number>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function parseCartBudgetVault(raw: string | null): Vault {
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
      const budget = normalizeCartBudget(value);
      if (budget != null) {
        vault[owner] = budget;
      }
    }
    return vault;
  } catch {
    return {};
  }
}

export function serializeCartBudgetVault(vault: Vault): string {
  return JSON.stringify(vault);
}

export async function loadCartBudget(ownerKey: string): Promise<number | null> {
  const vault = parseCartBudgetVault(await store.read());
  return vault[ownerKey] ?? null;
}

export async function saveCartBudget(ownerKey: string, budget: number | null): Promise<void> {
  const vault = parseCartBudgetVault(await store.read());
  const next = normalizeCartBudget(budget);
  if (next == null) {
    delete vault[ownerKey];
  } else {
    vault[ownerKey] = next;
  }
  if (Object.keys(vault).length === 0) {
    await store.remove();
    return;
  }
  await store.write(serializeCartBudgetVault(vault));
}

export async function activateDeviceCartBudgetStore(): Promise<void> {
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

/** Remaining budget vs local item subtotal (no fees/taxes). Positive = under budget. */
export function budgetDelta(budgetInr: number | null, localSubtotal: number): number | null {
  if (budgetInr == null) {
    return null;
  }
  const sub = Number.isFinite(localSubtotal) ? Math.max(0, localSubtotal) : 0;
  return budgetInr - sub;
}
