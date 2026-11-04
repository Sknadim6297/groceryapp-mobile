import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import {
  applyReviewVote,
  buildReviewSummary,
  previewReviewsForProduct,
  sortProductReviews,
} from '@/data/productReviews';
import { findDemoProduct } from '@/data/findDemoProduct';
import {
  activateDeviceProductReviewStore,
  createDeviceReviewId,
  loadDeviceReviews,
  loadReviewVotes,
  saveDeviceReviews,
  saveReviewVotes,
  type VoteMap,
} from '@/services/productReviewStore';
import type {
  DeviceReviewDraft,
  ProductReview,
  ProductReviewSummary,
  ReviewSortId,
  ReviewVote,
} from '@/types/productReviews';

type ProductReviewsContextValue = {
  hydrated: boolean;
  summaryFor: (productId: string) => ProductReviewSummary;
  sortedReviewsFor: (productId: string, sort: ReviewSortId) => ProductReview[];
  voteFor: (reviewId: string) => ReviewVote | null;
  setVote: (review: ProductReview, vote: ReviewVote) => void;
  submitReview: (draft: DeviceReviewDraft) => { ok: true; review: ProductReview } | { ok: false; reason: string };
};

const ProductReviewsContext = createContext<ProductReviewsContextValue | null>(null);

export function ProductReviewsProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [deviceReviews, setDeviceReviews] = useState<ProductReview[]>([]);
  const [votes, setVotes] = useState<VoteMap>({});
  /** Local overrides for preview review helpful counts after voting. */
  const [previewOverrides, setPreviewOverrides] = useState<Record<string, ProductReview>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (Platform.OS !== 'web') {
        await activateDeviceProductReviewStore();
      }
      const [reviews, loadedVotes] = await Promise.all([loadDeviceReviews(), loadReviewVotes()]);
      if (cancelled) {
        return;
      }
      setDeviceReviews(reviews);
      setVotes(loadedVotes);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void saveDeviceReviews(deviceReviews);
  }, [deviceReviews, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void saveReviewVotes(votes);
  }, [hydrated, votes]);

  const reviewsForProduct = useCallback(
    (productId: string): ProductReview[] => {
      const product = findDemoProduct(productId);
      const preview = product
        ? previewReviewsForProduct(product).map((review) => previewOverrides[review.id] ?? review)
        : [];
      const own = deviceReviews.filter((review) => review.productId === productId);
      return [...own, ...preview];
    },
    [deviceReviews, previewOverrides],
  );

  const summaryFor = useCallback(
    (productId: string) => buildReviewSummary(reviewsForProduct(productId)),
    [reviewsForProduct],
  );

  const sortedReviewsFor = useCallback(
    (productId: string, sort: ReviewSortId) => sortProductReviews(reviewsForProduct(productId), sort),
    [reviewsForProduct],
  );

  const voteFor = useCallback((reviewId: string) => votes[reviewId] ?? null, [votes]);

  const setVote = useCallback((review: ProductReview, vote: ReviewVote) => {
    setVotes((current) => {
      const previous = current[review.id] ?? null;
      if (previous === vote) {
        return current;
      }
      const updated = applyReviewVote(review, previous, vote);
      if (review.source === 'device') {
        setDeviceReviews((rows) => rows.map((row) => (row.id === review.id ? updated : row)));
      } else {
        setPreviewOverrides((map) => ({ ...map, [review.id]: updated }));
      }
      return { ...current, [review.id]: vote };
    });
  }, []);

  const submitReview = useCallback((draft: DeviceReviewDraft) => {
    const productId = draft.productId.trim();
    if (!productId || !findDemoProduct(productId)) {
      return { ok: false as const, reason: 'Product not found.' };
    }
    const rating = Math.round(draft.rating);
    if (rating < 1 || rating > 5) {
      return { ok: false as const, reason: 'Choose a star rating from 1 to 5.' };
    }
    const body = draft.body.trim();
    if (body.length < 8) {
      return { ok: false as const, reason: 'Write a short review (at least a few words).' };
    }
    const name = draft.authorName.trim() || 'You';
    const review: ProductReview = {
      id: createDeviceReviewId(productId),
      productId,
      name,
      whenLabel: 'Just now',
      createdAt: Date.now(),
      rating,
      body,
      tags: draft.tags.slice(0, 6),
      photos: draft.photoUris.slice(0, 4).map((uri) => ({ uri })),
      helpfulCount: 0,
      notHelpfulCount: 0,
      source: 'device',
    };
    setDeviceReviews((current) => [review, ...current]);
    return { ok: true as const, review };
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      summaryFor,
      sortedReviewsFor,
      voteFor,
      setVote,
      submitReview,
    }),
    [hydrated, setVote, sortedReviewsFor, submitReview, summaryFor, voteFor],
  );

  return <ProductReviewsContext.Provider value={value}>{children}</ProductReviewsContext.Provider>;
}

export function useProductReviews(): ProductReviewsContextValue {
  const value = useContext(ProductReviewsContext);
  if (!value) {
    throw new Error('useProductReviews must be used within ProductReviewsProvider');
  }
  return value;
}
