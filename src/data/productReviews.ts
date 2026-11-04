import type { DemoProduct } from '@/types/catalog';
import type { ProductReview, ProductReviewSummary, ReviewSortId } from '@/types/productReviews';

const REVIEWERS = [
  { name: 'Ananya S.', whenLabel: '2 weeks ago', daysAgo: 14 },
  { name: 'Rahul M.', whenLabel: '1 month ago', daysAgo: 30 },
  { name: 'Priya K.', whenLabel: '3 weeks ago', daysAgo: 21 },
  { name: 'Dev Patel', whenLabel: '12 months ago', daysAgo: 365 },
] as const;

const BODIES = [
  'Fresh quality for everyday cooking. Packed well and matched the listing.',
  'Good value for the pack size. Will order again with the weekly groceries.',
  'Arrived in good condition. Useful staple for our Mayapur kitchen.',
  'Taste and freshness were solid. Handy to keep on repeat order.',
] as const;

function hashId(id: string): number {
  let total = 0;
  for (let index = 0; index < id.length; index += 1) {
    total = (total + id.charCodeAt(index) * (index + 3)) % 997;
  }
  return total;
}

function daysAgoMs(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

/**
 * Preview-only review fixtures for the product page.
 * Not customer-verified and not loaded from a ratings backend.
 */
export function previewReviewsForProduct(product: DemoProduct): ProductReview[] {
  const seed = hashId(product.id);
  const photos = product.images.length > 1 ? product.images.slice(0, 3) : [product.image];

  return REVIEWERS.map((reviewer, index) => {
    const rating = index === 0 ? 5 : index === 1 ? 4 : index === 2 ? 5 : 3;
    return {
      id: `${product.id}-preview-${index}`,
      productId: product.id,
      name: reviewer.name,
      whenLabel: reviewer.whenLabel,
      createdAt: daysAgoMs(reviewer.daysAgo) - seed,
      rating,
      body: BODIES[(seed + index) % BODIES.length]!,
      photos: index === 1 || index === 3 ? photos : undefined,
      helpfulCount: 40 + ((seed + index * 11) % 60),
      notHelpfulCount: 1 + ((seed + index) % 8),
      source: 'preview' as const,
    };
  });
}

export function buildReviewSummary(reviews: readonly ProductReview[]): ProductReviewSummary {
  const total = reviews.length;
  if (total === 0) {
    return {
      average: 0,
      total: 0,
      distribution: [0, 0, 0, 0, 0],
      reviews: [],
      includesPreview: false,
    };
  }

  const buckets = [0, 0, 0, 0, 0] as [number, number, number, number, number];
  let sum = 0;
  for (const review of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(review.rating)));
    buckets[5 - star] += 1;
    sum += review.rating;
  }

  return {
    average: Math.round((sum / total) * 10) / 10,
    total,
    distribution: buckets,
    reviews: [...reviews],
    includesPreview: reviews.some((review) => review.source === 'preview'),
  };
}

/**
 * Combines preview seeds with device-written reviews for one product.
 */
export function productReviewSummary(
  product: DemoProduct,
  deviceReviews: readonly ProductReview[] = [],
): ProductReviewSummary {
  const preview = previewReviewsForProduct(product);
  const own = deviceReviews.filter((review) => review.productId === product.id);
  return buildReviewSummary([...own, ...preview]);
}

export function sortProductReviews(
  reviews: readonly ProductReview[],
  sort: ReviewSortId,
): ProductReview[] {
  const next = [...reviews];
  if (sort === 'newest') {
    next.sort((a, b) => b.createdAt - a.createdAt);
    return next;
  }
  next.sort((a, b) => {
    const helpfulDelta = b.helpfulCount - a.helpfulCount;
    if (helpfulDelta !== 0) {
      return helpfulDelta;
    }
    return b.createdAt - a.createdAt;
  });
  return next;
}

export function applyReviewVote(
  review: ProductReview,
  previous: 'helpful' | 'not_helpful' | null,
  next: 'helpful' | 'not_helpful',
): ProductReview {
  let helpfulCount = review.helpfulCount;
  let notHelpfulCount = review.notHelpfulCount;

  if (previous === 'helpful') {
    helpfulCount = Math.max(0, helpfulCount - 1);
  } else if (previous === 'not_helpful') {
    notHelpfulCount = Math.max(0, notHelpfulCount - 1);
  }

  if (next === 'helpful') {
    helpfulCount += 1;
  } else {
    notHelpfulCount += 1;
  }

  return { ...review, helpfulCount, notHelpfulCount };
}
