import {
  findDeliveryReview,
  installDeliveryReviewStoreForTests,
  loadDeliveryReviews,
  upsertDeliveryReview,
} from '../src/services/deliveryReviewStore';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  installDeliveryReviewStoreForTests(null);

  const empty = await loadDeliveryReviews();
  assert(empty.length === 0, 'starts empty');

  await upsertDeliveryReview({
    orderId: 'DEMO-1988',
    rating: 5,
    body: 'Fresh groceries, on time.',
    createdAt: 100,
  });

  const found = await findDeliveryReview('DEMO-1988');
  assert(found?.rating === 5, 'saved rating');
  assert(Boolean(found?.body.includes('Fresh')), 'saved body');

  await upsertDeliveryReview({
    orderId: 'DEMO-1988',
    rating: 4,
    body: 'Updated note',
    createdAt: 200,
  });

  const updated = await findDeliveryReview('DEMO-1988');
  assert(updated?.rating === 4, 'upsert replaces same order');
  assert((await loadDeliveryReviews()).length === 1, 'one review per order');

  console.log('delivery review store fixtures passed');
}

void main();
