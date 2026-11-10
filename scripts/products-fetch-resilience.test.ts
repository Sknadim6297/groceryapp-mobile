import assert from 'node:assert/strict';

import {
  __resetProductsFetchStateForTests,
  fetchProducts,
  mapProductRecord,
} from '../src/services/productsApi';
import { MAX_INLINE_CATEGORY_IMAGE_CHARS } from '../src/utils/productImageSource';

async function run() {
  __resetProductsFetchStateForTests();

  // Concurrent callers join the same in-flight GET (dedupe).
  const a = fetchProducts('8787888888');
  const b = fetchProducts('8787888888');
  const [ra, rb] = await Promise.all([a, b]);
  assert.equal(ra.ok, true, 'first fetch ok');
  assert.equal(rb.ok, true, 'joined fetch ok');
  if (ra.ok && rb.ok) {
    assert.equal(ra.products.length, rb.products.length, 'joined results match');
    assert.ok(ra.products.length >= 1, 'products present');
  }

  // Abort mid-flight must not throw and must report cancelled.
  __resetProductsFetchStateForTests();
  const controller = new AbortController();
  const pending = fetchProducts('8787888888', { signal: controller.signal, force: true });
  controller.abort();
  const cancelled = await pending;
  assert.equal(cancelled.ok, false, 'aborted fetch not ok');
  if (!cancelled.ok) {
    assert.equal(cancelled.cancelled, true, 'cancelled flag set');
  }

  // Oversized CategoryImage must not enter mapped product state.
  const huge = 'iVBORw0KGgo'.padEnd(MAX_INLINE_CATEGORY_IMAGE_CHARS + 64, 'A');
  const mapped = mapProductRecord({
    ProductId: 99,
    ProductName: 'Bound test',
    SellingPrice: 10,
    CategoryImage: huge,
    Image1: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgK',
  });
  assert.ok(mapped, 'mapped product');
  assert.equal(mapped!.categoryImage, undefined, 'oversized category image dropped');
  assert.ok(
    typeof mapped!.image === 'object' &&
      mapped!.image != null &&
      'uri' in mapped!.image &&
      String(mapped!.image.uri).startsWith('data:image/'),
    'product Image1 kept',
  );

  console.log('products-fetch-resilience.test.ts: ok');
}

void run();
