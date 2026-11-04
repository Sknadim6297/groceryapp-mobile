/**
 * Device-local delivery service reviews (post-delivery feedback).
 * Not a live ratings API — ready to swap for a backend later.
 */

export type DeliveryReviewRecord = {
  orderId: string;
  rating: number;
  body: string;
  createdAt: number;
};

type ReviewStore = {
  read: (key: string) => Promise<string | null>;
  write: (key: string, value: string) => Promise<void>;
};

const STORAGE_KEY = 'groceryapp.delivery-reviews';
const memory = new Map<string, string>();

const memoryStore: ReviewStore = {
  async read(key) {
    return memory.get(key) ?? null;
  },
  async write(key, value) {
    memory.set(key, value);
  },
};

let store: ReviewStore = memoryStore;

export function installDeliveryReviewStoreForTests(next: ReviewStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export async function activateDeviceDeliveryReviewStore(): Promise<void> {
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

function normalize(raw: unknown): DeliveryReviewRecord[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const next: DeliveryReviewRecord[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as DeliveryReviewRecord;
    if (typeof row.orderId !== 'string' || !row.orderId.trim()) {
      continue;
    }
    if (seen.has(row.orderId)) {
      continue;
    }
    const rating = Math.round(Number(row.rating));
    if (rating < 1 || rating > 5) {
      continue;
    }
    seen.add(row.orderId);
    next.push({
      orderId: row.orderId.trim(),
      rating,
      body: typeof row.body === 'string' ? row.body.trim() : '',
      createdAt: typeof row.createdAt === 'number' ? row.createdAt : Date.now(),
    });
  }
  return next;
}

export async function loadDeliveryReviews(): Promise<DeliveryReviewRecord[]> {
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

export async function saveDeliveryReviews(reviews: readonly DeliveryReviewRecord[]): Promise<void> {
  await store.write(STORAGE_KEY, JSON.stringify(normalize(reviews)));
}

export async function upsertDeliveryReview(review: DeliveryReviewRecord): Promise<DeliveryReviewRecord[]> {
  const current = await loadDeliveryReviews();
  const without = current.filter((item) => item.orderId !== review.orderId);
  const next = [review, ...without];
  await saveDeliveryReviews(next);
  return next;
}

export async function findDeliveryReview(orderId: string): Promise<DeliveryReviewRecord | null> {
  const id = orderId.trim();
  if (!id) {
    return null;
  }
  const reviews = await loadDeliveryReviews();
  return reviews.find((item) => item.orderId === id) ?? null;
}
