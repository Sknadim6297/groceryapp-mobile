import type { ImageSource } from 'expo-image';

export type ReviewSortId = 'helpful' | 'newest';

export type ProductReview = {
  id: string;
  productId: string;
  name: string;
  /** Relative time label for display. */
  whenLabel: string;
  /** Epoch ms used for newest sort. */
  createdAt: number;
  rating: number;
  body: string;
  tags?: string[];
  photos?: ImageSource[];
  helpfulCount: number;
  notHelpfulCount: number;
  /** Preview seed vs device-written review. */
  source: 'preview' | 'device';
};

export type ProductReviewSummary = {
  average: number;
  total: number;
  /** Counts for stars 5 → 1. */
  distribution: readonly [number, number, number, number, number];
  reviews: ProductReview[];
  /** True when seed/preview reviews are included. */
  includesPreview: boolean;
};

export type DeviceReviewDraft = {
  productId: string;
  rating: number;
  body: string;
  tags: string[];
  /** Local file URIs only — never uploaded in this build. */
  photoUris: string[];
  authorName: string;
};

export type ReviewVote = 'helpful' | 'not_helpful';

export const REVIEW_QUICK_TAGS = [
  'Fresh Items',
  'Good Packaging',
  'Value for Money',
  'Fast Delivery',
  'Perfect Choice',
  'Will Buy Again',
] as const;

export type ReviewQuickTag = (typeof REVIEW_QUICK_TAGS)[number];
