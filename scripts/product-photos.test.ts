/**
 * Product gallery photo sanitization.
 * Run: npx --yes tsx scripts/product-photos.test.ts
 */

import { productPhotos } from '../src/utils/productPhotos';
import type { DemoProduct } from '../src/types/catalog';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const base: DemoProduct = {
  id: 'tea',
  name: 'Tea',
  unit: '250 g',
  price: 40,
  image: { uri: 'https://example.com/tea.png' },
};

assert(productPhotos(base).length === 1, 'falls back to card image');
assert(
  productPhotos({
    ...base,
    images: [{ uri: '' }, { uri: 'https://example.com/a.png' }, { uri: '   ' }],
  }).length === 1,
  'drops empty uris',
);
assert(
  productPhotos({
    ...base,
    image: { uri: '' },
    images: [],
  }).length === 0,
  'empty gallery when nothing usable',
);

console.log('product-photos.test.ts: all assertions passed');
