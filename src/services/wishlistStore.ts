/**
 * Local wishlist of catalogue product ids.
 * Ready to swap the store for a future C# / ASP.NET wishlist API.
 */

const STORAGE_KEY = 'groceryapp.wishlist';

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

export function serializeWishlistIds(ids: readonly string[]): string {
  return JSON.stringify(normalizeWishlistIds(ids));
}

export function parseWishlistIds(raw: string | null): string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return normalizeWishlistIds(parsed.filter((item): item is string => typeof item === 'string'));
  } catch {
    return [];
  }
}

export async function loadWishlistIds(): Promise<string[]> {
  return parseWishlistIds(await store.read());
}

export async function saveWishlistIds(ids: readonly string[]): Promise<void> {
  const next = normalizeWishlistIds(ids);
  if (next.length === 0) {
    await store.remove();
    return;
  }
  await store.write(serializeWishlistIds(next));
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
