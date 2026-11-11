/**
 * Local collected demo coupon ids.
 * Never treats collection as a server redemption.
 */

const STORAGE_KEY = 'groceryapp.demo-coupons-collected.v1';

type CollectionStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: CollectionStore = {
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

let store: CollectionStore = memoryStore;

export function installCouponCollectionStoreForTests(next: CollectionStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export function parseCollectedCouponIds(raw: string | null): string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  } catch {
    return [];
  }
}

export async function loadCollectedCouponIds(): Promise<string[]> {
  return parseCollectedCouponIds(await store.read());
}

export async function saveCollectedCouponIds(ids: readonly string[]): Promise<boolean> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  await store.write(JSON.stringify(unique));
  return true;
}

/** Clears locally collected demo coupons (logout / account switch). */
export async function clearCollectedCouponIds(): Promise<void> {
  await store.remove();
}

export async function activateDeviceCouponCollectionStore(): Promise<void> {
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
