import {
  applyReviewVote,
  buildReviewSummary,
  previewReviewsForProduct,
  productReviewSummary,
  sortProductReviews,
} from '../src/data/productReviews';
import type { DemoProduct } from '../src/types/catalog';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const product = {
  id: 'tomatoes',
  name: 'Tomatoes',
  unit: '1 kg',
  price: 40,
  image: 1 as never,
  images: [1 as never, 2 as never],
} satisfies DemoProduct;

const preview = previewReviewsForProduct(product);
assert(preview.length === 4, 'preview review count');
assert(preview.every((review) => review.source === 'preview'), 'preview source');

const summary = productReviewSummary(product);
assert(summary.total >= 4, 'summary total');
assert(summary.average >= 3, 'summary average');
assert(summary.distribution.reduce((a, b) => a + b, 0) === summary.total, 'distribution sums to total');
assert(summary.includesPreview === true, 'includes preview');

const newest = sortProductReviews(summary.reviews, 'newest');
assert(newest[0]!.createdAt >= newest[newest.length - 1]!.createdAt, 'newest sort');

const helpful = sortProductReviews(summary.reviews, 'helpful');
assert(helpful[0]!.helpfulCount >= helpful[helpful.length - 1]!.helpfulCount, 'helpful sort');

const voted = applyReviewVote(preview[0]!, null, 'helpful');
assert(voted.helpfulCount === preview[0]!.helpfulCount + 1, 'helpful vote increments');

const empty = buildReviewSummary([]);
assert(empty.total === 0 && empty.average === 0, 'empty summary');

console.log('product reviews fixtures passed');
