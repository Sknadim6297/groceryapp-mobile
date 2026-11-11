/**
 * Phase 7 — catalogue shelf remap, image reject, search scope, deep-link smoke.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { DemoProduct } from '../src/types/catalog';
import type { ShopShelf } from '../src/data/shopCatalog';
import {
  applyProductListing,
  createDefaultFilters,
} from '../src/utils/productFilters';
import { normalizeProductImageUri } from '../src/utils/productImageSource';
import {
  liveShelfIdForCategory,
  liveShelfIdForSubcategory,
} from '../src/utils/liveCatalogMeta';
import { resolveShopListing, resolveShopShelfId } from '../src/utils/resolveShopShelf';
import { resolveIncomingAppHref, isColdStartDeepLink } from '../src/utils/incomingAppLink';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function product(
  partial: Partial<DemoProduct> & Pick<DemoProduct, 'id' | 'name' | 'price' | 'category'>,
): DemoProduct {
  return {
    unit: '1 pc',
    image: { uri: `https://cdn.example/${partial.id}.jpg` },
    images: [{ uri: `https://cdn.example/${partial.id}.jpg` }],
    ...partial,
  };
}

const milk = product({
  id: 'm1',
  name: 'Amul Taaza',
  price: 28,
  category: 'Dairy',
  subcategory: 'Milk',
  brand: 'Amul',
});
const butter = product({
  id: 'b1',
  name: 'Amul Butter',
  price: 56,
  category: 'Dairy',
  subcategory: 'Butter',
  brand: 'Amul',
});
const rice = product({
  id: 'r1',
  name: 'Basmati',
  price: 120,
  category: 'Rice ,Atta & Pulses',
  subcategory: 'Basmati Rice',
});

const products = [milk, butter, rice];
const milkShelfId = liveShelfIdForSubcategory('Dairy', 'Milk');
const butterShelfId = liveShelfIdForSubcategory('Dairy', 'Butter');
const riceShelfId = liveShelfIdForSubcategory('Rice ,Atta & Pulses', 'Basmati Rice');
const dairyParent = liveShelfIdForCategory('Dairy');

const shelves: ShopShelf[] = [
  { id: milkShelfId, name: 'Milk', image: { uri: '' }, products: [milk] },
  { id: butterShelfId, name: 'Butter', image: { uri: '' }, products: [butter] },
  { id: riceShelfId, name: 'Basmati Rice', image: { uri: '' }, products: [rice] },
  { id: dairyParent, name: 'Dairy', image: { uri: '' }, products: [milk, butter] },
];

// Exact match
assert(resolveShopShelfId(milkShelfId, shelves, products) === milkShelfId, 'exact milk shelf');

// ERP parent mismatch: Home browsed Fruits but subcategory slug is Basmati Rice
const wrongParentId = liveShelfIdForSubcategory('Fruits & Vegetables', 'Basmati Rice');
assert(
  resolveShopShelfId(wrongParentId, shelves, products) === riceShelfId,
  'remap mismatched parent → product shelf via subcategory slug',
);

// Ambiguous short slug must not guess (Milk vs Almond Milk style)
const almond = product({
  id: 'a1',
  name: 'Almond Milk',
  price: 90,
  category: 'Beverages',
  subcategory: 'Almond Milk',
});
const almondShelf = liveShelfIdForSubcategory('Beverages', 'Almond Milk');
const shelvesAmbiguous: ShopShelf[] = [
  ...shelves,
  { id: almondShelf, name: 'Almond Milk', image: { uri: '' }, products: [almond] },
];
const ambiguousRequest = liveShelfIdForSubcategory('Snacks', 'Milk');
assert(
  resolveShopShelfId(ambiguousRequest, shelvesAmbiguous, [...products, almond]) === undefined ||
    resolveShopShelfId(ambiguousRequest, shelvesAmbiguous, [...products, almond]) === milkShelfId,
  'milk slug resolves uniquely or stays empty — never almond',
);
const milkResolve = resolveShopShelfId(ambiguousRequest, shelvesAmbiguous, [...products, almond]);
assert(milkResolve !== almondShelf, 'must not resolve Milk request to Almond Milk');

// Invalid → undefined (Shop shows empty, not first shelf)
assert(resolveShopShelfId('live-no-such-shelf', shelves, products) === undefined, 'invalid → undefined');

// Search stays inside subcategory
const pool = [
  { ...milk, shelfId: milkShelfId },
  { ...butter, shelfId: butterShelfId },
];
const scoped = applyProductListing({
  products: pool,
  query: 'Amul',
  filters: createDefaultFilters(),
  sort: 'catalogue',
  stockFilterSupported: false,
  activeShelfId: milkShelfId,
});
assert(scoped.map((p) => p.id).join(',') === 'm1', 'Amul search inside Milk stays Milk');

// Image payload honesty
assert(normalizeProductImageUri('System.Byte[]') === null, 'Byte[] rejected');
assert(normalizeProductImageUri('') === null, 'empty image rejected');
assert(
  normalizeProductImageUri('https://cdn.example/m1.jpg') === 'https://cdn.example/m1.jpg',
  'valid URL kept',
);

// Deep links
assert(isColdStartDeepLink('groceryapp://product/m1'), 'product deep link is cold-start');
assert(resolveIncomingAppHref('groceryapp://product/m1') != null, 'product href resolves');
assert(!isColdStartDeepLink('groceryapp://'), 'bare scheme is not a destination');

// Name-based remap: browse "Apples" → ERP SubCategory containment
const appleBrowse = resolveShopListing({
  shelfId: liveShelfIdForSubcategory('Fruits & Vegetables', 'Apples'),
  parentName: 'Fruits & Vegetables',
  subcategoryName: 'Apples',
  shelves,
  products: [
    ...products,
    {
      id: 'apple-bag',
      name: 'Apple Bag',
      unit: '1',
      price: 1,
      category: 'Fruits & Vegetables',
      subcategory: 'Organic Red Delicious Apples Bag,',
      image: { uri: 'https://cdn.example/a.jpg' },
      images: [{ uri: 'https://cdn.example/a.jpg' }],
    },
  ],
});
assert(appleBrowse.status === 'matched', 'Apples browse maps to loaded apple products');

// Source guards — Android list clipping + shelf resolve wired
const shop = readFileSync(path.join(root, 'src/app/(tabs)/shop.tsx'), 'utf8');
assert(shop.includes('resolveShopListing'), 'shop uses listing resolver');
assert(shop.includes("Platform.OS === 'android' ? false : true"), 'Android disables removeClippedSubviews');
assert(shop.includes('Category unavailable'), 'invalid state copy present');
assert(shop.includes('No products available'), 'empty subcategory state copy present');

const catalogMeta = readFileSync(path.join(root, 'src/services/catalogMetaApi.ts'), 'utf8');
assert(
  catalogMeta.includes('liveShelfIdForSubcategory(trimmedCategory, name)'),
  'subcategory API ids use requested parent',
);

const pdp = readFileSync(path.join(root, 'src/app/product/[id].tsx'), 'utf8');
assert(pdp.includes('setUiForProductId'), 'PDP resets UI on product id change');

console.log('phase7 stabilization passed');
