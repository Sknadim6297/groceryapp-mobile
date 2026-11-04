/**
 * Device-local product reviews and helpful votes.
 * Preview seeds stay in memory; written reviews persist on device only.
 * Ready to swap for a future ratings API — not a live backend today.
 */

import type { ProductReview, ReviewVote } from '@/types/productReviews';

const REVIEWS_KEY = 'groceryapp.product-reviews';
const VOTES_KEY = 'groceryapp.product-review-votes';

type ReviewStore = {
  read: (key: string) => Promise<string | null>;
  write: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: ReviewStore = {
  async read(key) {
    return memory.get(key) ?? null;
  },
  async write(key, value) {
    memory.set(key, value);
  },
  async remove(key) {
    memory.delete(key);
  },
};

let store: ReviewStore = memoryStore;

export function installProductReviewStoreForTests(next: ReviewStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export async function activateDeviceProductReviewStore(): Promise<void> {
  try {
    const SecureStore = await import('expo-secure-store');
    store = {
      async read(key) {
        return SecureStore.getItemAsync(key);
      },
      async write(key, value) {
        await SecureStore.setItemAsync(key, value);
      },
      async remove(key) {
        await SecureStore.deleteItemAsync(key);
      },
    };
  } catch {
    store = memoryStore;
  }
}

function isReview(value: unknown): value is ProductReview {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const row = value as ProductReview;
  return (
    typeof row.id === 'string' &&
    typeof row.productId === 'string' &&
    typeof row.name === 'string' &&
    typeof row.body === 'string' &&
    typeof row.rating === 'number' &&
    typeof row.createdAt === 'number' &&
    (row.source === 'device' || row.source === 'preview')
  );
}

export function normalizeDeviceReviews(raw: unknown): ProductReview[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const next: ProductReview[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!isReview(item) || item.source !== 'device') {
      continue;
    }
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    next.push({
      ...item,
      helpfulCount: Math.max(0, Number(item.helpfulCount) || 0),
      notHelpfulCount: Math.max(0, Number(item.notHelpfulCount) || 0),
      tags: Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === 'string') : undefined,
      photos: Array.isArray(item.photos) ? item.photos : undefined,
    });
  }
  return next;
}

export async function loadDeviceReviews(): Promise<ProductReview[]> {
  const raw = await store.read(REVIEWS_KEY);
  if (!raw) {
    return [];
  }
  try {
    return normalizeDeviceReviews(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function saveDeviceReviews(reviews: readonly ProductReview[]): Promise<void> {
  const deviceOnly = normalizeDeviceReviews(reviews);
  await store.write(REVIEWS_KEY, JSON.stringify(deviceOnly));
}

export type VoteMap = Record<string, ReviewVote>;

export async function loadReviewVotes(): Promise<VoteMap> {
  const raw = await store.read(VOTES_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: VoteMap = {};
    for (const [id, vote] of Object.entries(parsed)) {
      if (vote === 'helpful' || vote === 'not_helpful') {
        next[id] = vote;
      }
    }
    return next;
  } catch {
    return {};
  }
}

export async function saveReviewVotes(votes: VoteMap): Promise<void> {
  await store.write(VOTES_KEY, JSON.stringify(votes));
}

export function createDeviceReviewId(productId: string): string {
  return `device-${productId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
