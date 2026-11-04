/**
 * Tracks which delivered orders already received a product-review submission
 * on this device. Complements per-product reviews in ProductReviewsContext.
 */

type FlagStore = {
  read: (key: string) => Promise<string | null>;
  write: (key: string, value: string) => Promise<void>;
};

const STORAGE_KEY = 'groceryapp.order-product-reviews';
const memory = new Map<string, string>();

const memoryStore: FlagStore = {
  async read(key) {
    return memory.get(key) ?? null;
  },
  async write(key, value) {
    memory.set(key, value);
  },
};

let store: FlagStore = memoryStore;

export async function activateDeviceOrderProductReviewStore(): Promise<void> {
  try {
    const SecureStore = await import('expo-secure-store');
    store = {
      async read(key) {
        return SecureStore.getItemAsync(key);
      },
      async write(key, value) {
        await SecureStore.setItemAsync(key, value);
      },
    };
  } catch {
    store = memoryStore;
  }
}

function normalize(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set<string>();
  const next: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') {
      continue;
    }
    const id = item.trim();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    next.push(id);
  }
  return next;
}

export async function loadReviewedOrderIds(): Promise<string[]> {
  const raw = await store.read(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return normalize(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function markOrderProductsReviewed(orderId: string): Promise<void> {
  const id = orderId.trim();
  if (!id) {
    return;
  }
  const current = await loadReviewedOrderIds();
  if (current.includes(id)) {
    return;
  }
  await store.write(STORAGE_KEY, JSON.stringify([id, ...current]));
}

export async function hasOrderProductsReviewed(orderId: string): Promise<boolean> {
  const id = orderId.trim();
  if (!id) {
    return false;
  }
  const ids = await loadReviewedOrderIds();
  return ids.includes(id);
}
