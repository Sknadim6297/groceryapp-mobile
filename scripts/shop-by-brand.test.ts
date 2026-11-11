/**
 * Shop by Brand — identity, listing scope, Home/PDP wiring guards.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { DemoProduct } from '../src/types/catalog';
import {
  applyProductListing,
  createDefaultFilters,
} from '../src/utils/productFilters';
import {
  brandIdFromName,
  brandInitials,
  brandsEqual,
  deriveCatalogueBrands,
  filterProductsByBrand,
  isValidBrandName,
  normalizeBrandKey,
  preferBrandDisplayName,
  productMatchesBrand,
} from '../src/utils/brandIdentity';

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
    unit: '1 pc',
    image: { uri: `https://cdn.example/${partial.id}.jpg` },
    images: [{ uri: `https://cdn.example/${partial.id}.jpg` }],
    ...partial,
  };
}

const catalogue: DemoProduct[] = [
  product({ id: 'f1', name: 'Fortune Oil A', price: 100, brand: 'FORTUNE' }),
  product({ id: 'f2', name: 'Fortune Oil B', price: 120, brand: 'Fortune' }),
  product({ id: 'a1', name: 'Amul Milk', price: 28, brand: 'Amul' }),
  product({ id: 'c1', name: 'Cadbury Dairy Milk', price: 40, brand: 'CADBURY' }),
  product({ id: 'x1', name: 'No Brand Item', price: 10 }),
];

// Identity
assert(normalizeBrandKey('  Fortune  ') === 'fortune', 'normalize brand key');
assert(brandsEqual('FORTUNE', 'Fortune'), 'case-insensitive brand equality');
assert(!brandsEqual('Amul', 'Amulya'), 'no substring brand match');
assert(!productMatchesBrand(catalogue[4]!, 'Amul'), 'missing brand does not match');
assert(isValidBrandName('Amul') && !isValidBrandName('  '), 'valid brand gate');
assert(!isValidBrandName('N/A') && !isValidBrandName('Unknown') && !isValidBrandName('No Brand'), 'placeholders rejected');
assert(!isValidBrandName('ee') && !isValidBrandName('xxx'), 'repeated-letter junk rejected');
assert(isValidBrandName('3M') && isValidBrandName('LG') && isValidBrandName('HP'), 'short legitimate brands kept');
assert(brandInitials('24 MANTRA ORGANIC') === '2M', 'initials from first letters');
assert(brandInitials('Amul') === 'AM', 'single-word initials');
assert(preferBrandDisplayName('FORTUNE', 'Fortune') === 'Fortune', 'prefer mixed case display');
assert(brandIdFromName('Fortune') === brandIdFromName('FORTUNE'), 'stable brand ids');

// Home unique brands — FORTUNE + Fortune collapse
const brands = deriveCatalogueBrands(catalogue);
assert(brands.length === 3, `expected 3 unique brands, got ${brands.length}`);
assert(brands.every((b) => b.id.startsWith('brand-')), 'brand ids prefixed');
assert(
  brands.filter((b) => brandsEqual(b.name, 'Fortune')).length === 1,
  'Fortune deduped once',
);
assert(
  typeof brands[0]!.image === 'object' &&
    brands[0]!.image != null &&
    'uri' in brands[0]!.image &&
    brands[0]!.image.uri === '',
  'no fabricated brand logos',
);

// Brand A / Brand B listing
const fortune = filterProductsByBrand(catalogue, 'fortune');
assert(fortune.map((p) => p.id).sort().join(',') === 'f1,f2', 'Fortune products only');
const amul = filterProductsByBrand(catalogue, 'Amul');
assert(amul.map((p) => p.id).join(',') === 'a1', 'Amul products only');
assert(!fortune.some((p) => p.id === 'a1'), 'no cross-brand leak');

// Invalid brand never returns all products
assert(filterProductsByBrand(catalogue, '').length === 0, 'blank brand → empty');
assert(filterProductsByBrand(catalogue, 'NotARealBrand').length === 0, 'unknown brand → empty');

// Search stays inside brand pool
const brandPool = fortune.map((row) => ({ ...row, shelfId: 'brand:fortune' }));
const searched = applyProductListing({
  products: [
    ...brandPool,
    { ...catalogue[2]!, shelfId: 'brand:amul' },
  ],
  query: 'Oil',
  filters: createDefaultFilters(),
  sort: 'price-asc',
  stockFilterSupported: false,
  activeShelfId: 'brand:fortune',
});
assert(searched.every((p) => p.shelfId === 'brand:fortune'), 'search scoped to brand shelf id');
assert(searched.map((p) => p.id).join(',') === 'f1,f2', 'Fortune oil search results');

// Source wiring
const home = readFileSync(path.join(root, 'src/app/(tabs)/home.tsx'), 'utf8');
assert(home.includes('BrandCarousel'), 'home mounts BrandCarousel');
assert(home.includes('deriveCatalogueBrands'), 'home derives live brands');

const carousel = readFileSync(path.join(root, 'src/components/home/BrandCarousel.tsx'), 'utf8');
assert(carousel.includes('Shop by Brand'), 'heading copy');
assert(carousel.includes("params:"), 'navigates with brand param');
assert(!carousel.includes('mockBrands'), 'no hardcoded mock brands on home carousel');

const pdp = readFileSync(path.join(root, 'src/app/product/[id].tsx'), 'utf8');
assert(pdp.includes('ProductBrandCard'), 'PDP brand card');
assert(pdp.includes('isValidBrandName(resolved.brand)'), 'PDP requires catalogue brand');
assert(!pdp.includes("Sold by\" value={copy.brand}"), 'brand not mislabeled as seller');

const shop = readFileSync(path.join(root, 'src/app/(tabs)/shop.tsx'), 'utf8');
assert(shop.includes('productMatchesBrand'), 'shop uses exact brand match');
assert(shop.includes('brandEmpty'), 'shop brand empty state');
assert(shop.includes('Products`'), 'brand products heading');

console.log('shop-by-brand.test.ts: ok', `brands=${brands.map((b) => b.name).join('|')}`);
