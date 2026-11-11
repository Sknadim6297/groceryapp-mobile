/**
 * Phase 8 — brand quality + brand/category navigation isolation.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { DemoProduct } from '../src/types/catalog';
import { mapProductRecord } from '../src/services/productsApi';
import {
  applyProductListing,
  createDefaultFilters,
} from '../src/utils/productFilters';
import {
  deriveCatalogueBrands,
  filterProductsByBrand,
  findCatalogueBrand,
  isValidBrandName,
  productMatchesBrand,
  sanitizeProductBrand,
} from '../src/utils/brandIdentity';
import { resolveShopListing } from '../src/utils/resolveShopShelf';
import { liveShelfIdForSubcategory } from '../src/utils/liveCatalogMeta';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function product(
  partial: Partial<DemoProduct> & Pick<DemoProduct, 'id' | 'name' | 'price'>,
): DemoProduct {
  return {
    unit: '1 kg',
    image: { uri: `https://cdn.example/${partial.id}.jpg` },
    images: [{ uri: `https://cdn.example/${partial.id}.jpg` }],
    ...partial,
  };
}

// A) Brand quality — placeholders + live junk "ee"
assert(sanitizeProductBrand('N/A') === undefined, 'sanitize N/A');
assert(sanitizeProductBrand('  Unknown ') === undefined, 'sanitize Unknown');
assert(sanitizeProductBrand('ee') === undefined, 'sanitize ee junk');
assert(sanitizeProductBrand('Fortune') === 'Fortune', 'sanitize keeps Fortune');
assert(sanitizeProductBrand('3M') === '3M', 'sanitize keeps 3M');

const mappedJunk = mapProductRecord({
  Id: 'j1',
  Name: 'Junk Brand Product',
  Price: 10,
  Brand: 'ee',
  Category: 'Grocery',
  SubCategory: 'Misc',
});
assert(mappedJunk != null && mappedJunk.brand === undefined, 'mapProductRecord drops ee brand');

const mappedNa = mapProductRecord({
  Id: 'j2',
  Name: 'NA Brand Product',
  Price: 10,
  Brand: 'N/A',
  Category: 'Grocery',
  SubCategory: 'Misc',
});
assert(mappedNa != null && mappedNa.brand === undefined, 'mapProductRecord drops N/A brand');

const catalogue: DemoProduct[] = [
  product({ id: 'f1', name: 'Fortune Oil', price: 100, brand: 'FORTUNE', category: 'Grocery', subcategory: 'Oil' }),
  product({ id: 'f2', name: 'Fortune Ghee', price: 200, brand: 'Fortune', category: 'Grocery', subcategory: 'Ghee' }),
  product({ id: 'a1', name: 'Amul Milk', price: 28, brand: 'Amul', category: 'Dairy', subcategory: 'Milk' }),
  product({ id: 'e1', name: 'Bad Brand Row', price: 5, brand: 'ee', category: 'Grocery', subcategory: 'Misc' }),
  product({
    id: 'apple1',
    name: 'Apple Bag',
    price: 90,
    brand: 'FreshFarm',
    category: 'Fruits & Vegetables',
    subcategory: 'Organic Red Delicious Apples Bag,',
  }),
];

// Derive excludes junk even if somehow present on product
const brands = deriveCatalogueBrands(catalogue);
assert(!brands.some((b) => b.name.toLowerCase() === 'ee'), 'derive excludes ee');
assert(brands.filter((b) => b.name.toLowerCase() === 'fortune' || b.name === 'Fortune' || b.name === 'FORTUNE').length === 1, 'fortune deduped');

// findCatalogueBrand does not invent brands
assert(findCatalogueBrand(catalogue, 'ee') === undefined, 'find rejects ee');
assert(findCatalogueBrand(catalogue, 'Fortune')?.name === 'Fortune', 'find prefers display Fortune');

// B) Brand navigation isolation
const fortune = filterProductsByBrand(catalogue, 'FORTUNE');
assert(fortune.map((p) => p.id).sort().join(',') === 'f1,f2', 'brand A only');
assert(filterProductsByBrand(catalogue, 'Amul').map((p) => p.id).join(',') === 'a1', 'brand B only');
assert(filterProductsByBrand(catalogue, 'MissingBrand').length === 0, 'invalid brand empty');

const fortunePool = fortune.map((p) => ({ ...p, shelfId: 'brand:fortune' }));
const brandSearch = applyProductListing({
  products: [...fortunePool, { ...catalogue[2]!, shelfId: 'brand:amul' }],
  query: 'Oil',
  filters: createDefaultFilters(),
  sort: 'price-asc',
  stockFilterSupported: false,
  activeShelfId: 'brand:fortune',
});
assert(brandSearch.every((p) => productMatchesBrand(p, 'Fortune')), 'search stays in brand');
assert(!brandSearch.some((p) => p.id === 'a1'), 'brand search no leak');

// C) Category/subcategory — Apples containment + empty bananas; no brand leak into category mode
const fruits = 'Fruits & Vegetables';
const shelves = [
  {
    id: liveShelfIdForSubcategory(fruits, 'Organic Red Delicious Apples Bag,'),
    name: 'Organic Red Delicious Apples Bag,',
    image: { uri: '' },
    products: [catalogue[4]!],
  },
];
const apples = resolveShopListing({
  shelfId: liveShelfIdForSubcategory(fruits, 'Apples'),
  parentName: fruits,
  subcategoryName: 'Apples',
  shelves,
  products: catalogue,
});
assert(apples.status === 'matched' && apples.products[0]?.id === 'apple1', 'apples maps correctly');

const bananas = resolveShopListing({
  shelfId: liveShelfIdForSubcategory(fruits, 'Bananas'),
  parentName: fruits,
  subcategoryName: 'Bananas',
  shelves,
  products: catalogue,
});
assert(bananas.status === 'empty', 'bananas honest empty');

// Brand mode must not use category fallback — empty brand stays empty
assert(filterProductsByBrand(catalogue, 'NotReal').length === 0, 'no silent brand reassignment');

// D) Source guards — image identity + brand/category param clearing
const shop = readFileSync(path.join(root, 'src/app/(tabs)/shop.tsx'), 'utf8');
assert(shop.includes('productMatchesBrand'), 'shop exact brand match');
assert(shop.includes('brand: undefined'), 'shop clears brand when leaving brand mode');
assert(shop.includes('brandEmpty'), 'shop brand empty state');

const card = readFileSync(path.join(root, 'src/components/home/ProductCard.tsx'), 'utf8');
assert(card.includes('identityKey={product.id}'), 'product card image identityKey');

const catalogImage = readFileSync(path.join(root, 'src/components/home/CatalogImage.tsx'), 'utf8');
assert(catalogImage.includes('identityKey'), 'CatalogImage identityKey prop');

assert(isValidBrandName('LG'), 'LG kept');
assert(!isValidBrandName(null) && !isValidBrandName(undefined), 'nullish rejected');

console.log('phase8-brand-nav.test.ts: ok');
