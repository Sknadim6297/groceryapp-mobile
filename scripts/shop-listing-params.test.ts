/**
 * Shop search/sort/filter URL param encode/decode.
 * Run: npx --yes tsx scripts/shop-listing-params.test.ts
 */

import { createDefaultFilters } from '../src/utils/productFilters';
import {
  decodeShopFilters,
  decodeShopSort,
  encodeShopFilters,
  encodeShopSort,
} from '../src/utils/shopListingParams';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(encodeShopSort('catalogue') === undefined, 'default sort omitted');
assert(encodeShopSort('price-asc') === 'price-asc', 'sort encoded');
assert(decodeShopSort('price-desc') === 'price-desc', 'sort decoded');
assert(decodeShopSort('nope') === 'catalogue', 'invalid sort falls back');

assert(encodeShopFilters(createDefaultFilters()) === undefined, 'inactive filters omitted');

const active = {
  ...createDefaultFilters(),
  inStockOnly: true,
  discountedOnly: true,
  priceMin: 20,
  priceMax: 100,
  ratingStars: [4, 5] as const,
  categoryIds: ['dairy', 'snacks'],
};
const encoded = encodeShopFilters(active);
assert(typeof encoded === 'string' && encoded.includes('stock:1'), 'filters encoded');
const decoded = decodeShopFilters(encoded);
assert(decoded.inStockOnly && decoded.discountedOnly, 'stock/sale restored');
assert(decoded.priceMin === 20 && decoded.priceMax === 100, 'price bounds restored');
assert(decoded.ratingStars.join(',') === '4,5', 'stars restored');
assert(decoded.categoryIds.join(',') === 'dairy,snacks', 'categories restored');

console.log('shop-listing-params.test.ts: all assertions passed');
