/**
 * Catalogue → filter → search → PDP identity regression guards.
 * Fixtures mirror live shelf ids from product.category / product.subcategory.
 */
import type { DemoProduct } from '../src/types/catalog';
import {
  applyProductListing,
  createDefaultFilters,
  matchesSearch,
  normalizeSearchNeedle,
  type ListedProduct,
} from '../src/utils/productFilters';
import { normalizeProductImageUri } from '../src/utils/productImageSource';
import {
  liveShelfIdForCategory,
  liveShelfIdForSubcategory,
} from '../src/utils/liveCatalogMeta';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function product(
  partial: Partial<DemoProduct> & Pick<DemoProduct, 'id' | 'name' | 'price'>,
): DemoProduct {
  return {
    unit: '1 unit',
    image: { uri: `https://cdn.example/img/${partial.id}.jpg` },
    images: [{ uri: `https://cdn.example/img/${partial.id}.jpg` }],
    ...partial,
  };
}

function listed(
  partial: Partial<DemoProduct> &
    Pick<DemoProduct, 'id' | 'name' | 'price'> & { shelfId?: string },
): ListedProduct {
  const { shelfId, ...rest } = partial;
  return { ...product(rest), shelfId };
}

const riceCat = 'Rice';
const milkCat = 'Dairy';
const milkSub = 'Milk';
const biscuitSub = 'Biscuits';
const shampooCat = 'Personal Care';
const shampooSub = 'Shampoo';

const riceShelf = liveShelfIdForCategory(riceCat);
const milkShelf = liveShelfIdForSubcategory(milkCat, milkSub);
const biscuitShelf = liveShelfIdForSubcategory(milkCat, biscuitSub);
const shampooShelf = liveShelfIdForSubcategory(shampooCat, shampooSub);
const dairyParent = liveShelfIdForCategory(milkCat);

const catalogue: ListedProduct[] = [
  listed({
    id: 'p-rice-1',
    name: 'India Gate Basmati',
    price: 120,
    category: riceCat,
    shelfId: riceShelf,
    brand: 'India Gate',
    image: { uri: 'https://cdn.example/img/p-rice-1.jpg' },
  }),
  listed({
    id: 'p-rice-2',
    name: 'Fortune Biryani Rice',
    price: 95,
    category: riceCat,
    shelfId: riceShelf,
    brand: 'Fortune',
  }),
  listed({
    id: 'p-milk-1',
    name: 'Amul Taaza Milk',
    price: 28,
    category: milkCat,
    subcategory: milkSub,
    shelfId: milkShelf,
    brand: 'Amul',
    image: { uri: 'https://cdn.example/img/p-milk-1.jpg' },
  }),
  listed({
    id: 'p-milk-2',
    name: 'Mother Dairy Toned',
    price: 26,
    category: milkCat,
    subcategory: milkSub,
    shelfId: milkShelf,
    brand: 'Mother Dairy',
  }),
  listed({
    id: 'p-biscuit-1',
    name: 'Parle-G',
    price: 10,
    category: milkCat,
    subcategory: biscuitSub,
    shelfId: biscuitShelf,
    brand: 'Parle',
  }),
  listed({
    id: 'p-shampoo-1',
    name: 'Clinic Plus Shampoo',
    price: 140,
    category: shampooCat,
    subcategory: shampooSub,
    shelfId: shampooShelf,
    brand: 'Clinic Plus',
  }),
  listed({
    id: 'p-amul-butter',
    name: 'Amul Butter',
    price: 58,
    category: milkCat,
    subcategory: 'Butter',
    shelfId: liveShelfIdForSubcategory(milkCat, 'Butter'),
    brand: 'Amul',
  }),
];

function idsOf(rows: readonly ListedProduct[]): string {
  return rows.map((row) => row.id).sort().join(',');
}

function listing(args: {
  shelfId?: string;
  query?: string;
  categoryIds?: string[];
  sort?: 'catalogue' | 'price-asc' | 'name-asc';
  priceMax?: number | null;
}): ListedProduct[] {
  return applyProductListing({
    products: catalogue,
    query: args.query ?? '',
    filters: {
      ...createDefaultFilters(),
      categoryIds: args.categoryIds ?? [],
      priceMax: args.priceMax ?? null,
    },
    sort: args.sort ?? 'catalogue',
    stockFilterSupported: false,
    activeShelfId: args.shelfId,
  });
}

// 1. Category A shows only Category A products
const riceOnly = listing({ shelfId: riceShelf });
assert(idsOf(riceOnly) === 'p-rice-1,p-rice-2', '1. rice category only');

// 2. Subcategory A shows only Subcategory A products
const milkOnly = listing({ shelfId: milkShelf });
assert(idsOf(milkOnly) === 'p-milk-1,p-milk-2', '2. milk subcategory only');

// 3. Subcategory B shows only Subcategory B products
const biscuitOnly = listing({ shelfId: biscuitShelf });
assert(idsOf(biscuitOnly) === 'p-biscuit-1', '3. biscuits subcategory only');

// 4. Different subcategories do not leak results
assert(
  milkOnly.every((p) => p.shelfId === milkShelf) &&
    biscuitOnly.every((p) => p.shelfId === biscuitShelf) &&
    idsOf(milkOnly) !== idsOf(biscuitOnly),
  '4. subcategory lists do not leak',
);

// 5. Invalid subcategory shows no unrelated products
const invalid = listing({ shelfId: 'live-not-a-real-shelf' });
assert(invalid.length === 0, '5. invalid shelf → empty (no unrelated products)');

// 6. Search inside subcategory respects scope
const amulInMilk = listing({ shelfId: milkShelf, query: 'Amul' });
assert(idsOf(amulInMilk) === 'p-milk-1', '6. Amul search inside Milk stays in Milk');
assert(
  !amulInMilk.some((p) => p.id === 'p-amul-butter'),
  '6b. Amul Butter outside Milk must not appear',
);

// 7. Search + filter + sort work together
const dairyFilterSorted = applyProductListing({
  products: catalogue.map((row) =>
    row.category === milkCat ? { ...row, shelfId: dairyParent } : row,
  ),
  query: 'amul',
  filters: { ...createDefaultFilters(), categoryIds: [dairyParent], priceMax: 40 },
  sort: 'price-asc',
  stockFilterSupported: false,
});
assert(idsOf(dairyFilterSorted) === 'p-milk-1', '7. search + category filter + price + sort');

// 8. Filtered products retain image sources
assert(
  riceOnly.every(
    (p) =>
      typeof p.image === 'object' &&
      p.image != null &&
      'uri' in p.image &&
      typeof p.image.uri === 'string' &&
      p.image.uri.includes(p.id),
  ),
  '8. filtered products retain image uris',
);

// 9. Missing / invalid image uses null normalization (fallback at render)
assert(normalizeProductImageUri('System.Byte[]') === null, '9a. Byte[] rejected');
assert(normalizeProductImageUri(null) === null, '9b. null rejected');
assert(normalizeProductImageUri('') === null, '9c. empty rejected');
assert(
  normalizeProductImageUri('https://cdn.example/img/p-milk-1.jpg') ===
    'https://cdn.example/img/p-milk-1.jpg',
  '9d. valid url kept',
);

// 10–12. Product identity for PDP (stable ids, no index substitution)
function resolveProduct(id: string): ListedProduct | undefined {
  const needle = String(id ?? '').trim();
  return catalogue.find((row) => row.id === needle);
}
const productA = resolveProduct('p-rice-1');
const productB = resolveProduct('p-milk-1');
assert(productA?.name === 'India Gate Basmati', '10. Product A resolves');
assert(productB?.name === 'Amul Taaza Milk', '11. Product B resolves');
assert(productA?.id !== productB?.id, '12. A and B are distinct (no stale swap)');
assert(resolveProduct('   p-milk-1  ')?.id === 'p-milk-1', '12b. trimmed id resolves');
assert(resolveProduct('missing-product') === undefined, '12c. missing → not found');

// 13. Back navigation preserves intended filters (listing pure function)
const scopedThenSearch = listing({ shelfId: shampooShelf, query: 'clinic' });
assert(idsOf(scopedThenSearch) === 'p-shampoo-1', '13. shelf + search preserved together');
const afterClearSearch = listing({ shelfId: shampooShelf, query: '' });
assert(idsOf(afterClearSearch) === 'p-shampoo-1', '13b. clearing search keeps shelf');

// 14. Normal Shop opens without unintended filters
const openShop = applyProductListing({
  products: catalogue,
  query: '',
  filters: createDefaultFilters(),
  sort: 'catalogue',
  stockFilterSupported: false,
  activeShelfId: undefined,
});
assert(openShop.length === catalogue.length, '14. unscoped shop lists full pool');

// 15. Cart / wishlist continue using correct product ids (identity preserved through filter)
const filteredIds = new Set(listing({ shelfId: milkShelf }).map((p) => p.id));
assert(filteredIds.has('p-milk-1') && filteredIds.has('p-milk-2'), '15. filtered ids stable for cart/wishlist');
assert(!filteredIds.has('p-biscuit-1'), '15b. biscuits not in milk filtered set');

// Extra: search normalization
assert(normalizeSearchNeedle('  Farm   Milk ') === 'farm milk', 'needle normalize');
assert(matchesSearch(catalogue[2]!, 'AMUL'), 'case-insensitive brand/name');

console.log('catalogue flow regression passed');
