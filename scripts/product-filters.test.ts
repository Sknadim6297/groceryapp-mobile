import type { DemoProduct } from '../src/types/catalog';
import type { ProductFiltersState } from '../src/types/productFilters';
import {
  applyProductListing,
  catalogueHasRatingSignals,
  catalogueHasStockSignals,
  cloneFilters,
  countActiveFilters,
  createDefaultFilters,
  filtersAreActive,
  filtersEqual,
  isDiscountedProduct,
  isExplicitlyInStock,
  matchesPriceBounds,
  matchesPriceRange,
  matchesRatingStars,
  matchesSearch,
  priceBoundsFromPool,
  sortProducts,
  type ListedProduct,
} from '../src/utils/productFilters';

function product(partial: Partial<DemoProduct> & Pick<DemoProduct, 'id' | 'name' | 'price'>): DemoProduct {
  return {
    unit: '1 kg',
    image: 1 as never,
    images: [1 as never],
    ...partial,
  };
}

function listed(
  partial: Partial<DemoProduct> &
    Pick<DemoProduct, 'id' | 'name' | 'price'> & { shelfId?: string; ratingAverage?: number },
): ListedProduct {
  const { shelfId, ratingAverage, ...rest } = partial;
  return { ...product(rest), shelfId, ratingAverage };
}

const sample: ListedProduct[] = [
  listed({ id: 'a', name: 'Apples', price: 40, shelfId: 'fruits', compareAt: 60, ratingAverage: 5 }),
  listed({ id: 'b', name: 'Bananas', price: 54, shelfId: 'fruits', compareAt: 68, ratingAverage: 4 }),
  listed({ id: 'c', name: 'Curd', price: 120, shelfId: 'dairy', compareAt: 120, ratingAverage: 3 }),
  listed({ id: 'd', name: 'Basmati', price: 549, shelfId: 'grains', ratingAverage: 5 }),
  listed({ id: 'e', name: 'Eggs', price: 72, shelfId: 'dairy', available: false, ratingAverage: 4 }),
  listed({ id: 'f', name: 'Farm Milk', price: 56, shelfId: 'dairy', available: true, compareAt: 70, ratingAverage: 5 }),
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

// 1. Price range / bounds filtering
assert(matchesPriceRange(40, 'under-50'), '40 must be under 50');
assert(matchesPriceRange(50, '50-100'), '50 belongs in 50-100');
assert(matchesPriceBounds(40, null, 50), 'bounds max 50 keeps 40');
assert(!matchesPriceBounds(54, null, 50), 'bounds max 50 drops 54');
assert(matchesPriceBounds(120, 100, 250), '100-250 keeps 120');
assert(!matchesPriceBounds(Number.NaN, null, 50), 'NaN prices do not match');

const under50 = applyProductListing({
  products: sample,
  filters: { ...createDefaultFilters(), priceMax: 49 },
  sort: 'catalogue',
  stockFilterSupported: false,
});
assert(under50.map((p) => p.id).join(',') === 'a', 'priceMax 49 keeps only Apples');

const bounds = priceBoundsFromPool(sample);
assert(bounds.min === 40 && bounds.max === 549, 'pool price bounds');

// 2. Category filtering
const fruitsOnly = applyProductListing({
  products: sample,
  filters: { ...createDefaultFilters(), categoryIds: ['fruits'] },
  sort: 'catalogue',
  stockFilterSupported: false,
});
assert(fruitsOnly.every((p) => p.shelfId === 'fruits') && fruitsOnly.length === 2, 'category fruits filter');

// 3. Combined category + price
const dairyMid = applyProductListing({
  products: sample,
  filters: { ...createDefaultFilters(), categoryIds: ['dairy'], priceMin: 50, priceMax: 100 },
  sort: 'catalogue',
  stockFilterSupported: false,
});
assert(dairyMid.map((p) => p.id).sort().join(',') === 'e,f', 'dairy + 50-100');

// 4. Search + filters
const searchB = applyProductListing({
  products: sample,
  query: 'ba',
  filters: { ...createDefaultFilters(), priceMin: 50, priceMax: 100 },
  sort: 'catalogue',
  stockFilterSupported: false,
});
assert(searchB.map((p) => p.id).join(',') === 'b', 'search ba + price 50-100 => Bananas');
assert(matchesSearch(sample[0]!, 'app'), 'search is case-insensitive via needle');
assert(matchesSearch(sample[0]!, 'APPLES'.toLowerCase()), 'name match');

// 5. In-stock filtering when supported
assert(!catalogueHasStockSignals(sample.filter((p) => p.available === undefined)), 'no signals without available');
assert(catalogueHasStockSignals(sample), 'explicit available flags enable stock filter');
assert(isExplicitlyInStock(sample[5]!) && !isExplicitlyInStock(sample[4]!) && !isExplicitlyInStock(sample[0]!), 'explicit stock rules');

const inStock = applyProductListing({
  products: sample,
  filters: { ...createDefaultFilters(), inStockOnly: true },
  sort: 'catalogue',
  stockFilterSupported: true,
});
assert(inStock.map((p) => p.id).join(',') === 'f', 'in-stock only keeps explicit true');

const stockIgnored = applyProductListing({
  products: sample,
  filters: { ...createDefaultFilters(), inStockOnly: true },
  sort: 'catalogue',
  stockFilterSupported: false,
});
assert(stockIgnored.length === sample.length, 'unsupported stock filter must not drop items');

// 6. Discount filtering
assert(isDiscountedProduct(sample[0]!) && !isDiscountedProduct(sample[2]!) && !isDiscountedProduct(sample[3]!), 'discount uses compareAt > price');
const discounted = applyProductListing({
  products: sample,
  filters: { ...createDefaultFilters(), discountedOnly: true },
  sort: 'catalogue',
  stockFilterSupported: false,
});
assert(discounted.map((p) => p.id).sort().join(',') === 'a,b,f', 'discounted products only');

// 7. Rating stars
assert(catalogueHasRatingSignals(sample), 'rating averages enable star filter');
assert(matchesRatingStars(4.4, [4]), '4.4 rounds to 4');
assert(!matchesRatingStars(undefined, [5]), 'missing rating fails active star filter');
const fiveStar = applyProductListing({
  products: sample,
  filters: { ...createDefaultFilters(), ratingStars: [5] },
  sort: 'catalogue',
  stockFilterSupported: false,
});
assert(fiveStar.map((p) => p.id).sort().join(',') === 'a,d,f', '5-star filter');

const ratingIgnored = applyProductListing({
  products: sample,
  filters: { ...createDefaultFilters(), ratingStars: [5] },
  sort: 'catalogue',
  stockFilterSupported: false,
  ratingFilterSupported: false,
});
assert(ratingIgnored.length === sample.length, 'unsupported rating filter must not drop items');

// 8. Price sorting
const byPrice = sortProducts(sample, 'price-asc').map((p) => p.price);
assert(byPrice.join(',') === [...byPrice].sort((a, b) => a - b).join(','), 'price asc numeric');
assert(sortProducts(sample, 'price-desc')[0]?.id === 'd', 'price desc starts with Basmati');

// 9. Alphabetical sorting
assert(sortProducts(sample, 'name-asc')[0]?.name === 'Apples', 'name A-Z');
assert(sortProducts(sample, 'name-desc')[0]?.name === 'Farm Milk', 'name Z-A');

// 10. Empty results
const empty = applyProductListing({
  products: sample,
  query: 'zzzz-missing',
  filters: createDefaultFilters(),
  sort: 'catalogue',
  stockFilterSupported: false,
});
assert(empty.length === 0, 'empty search results');

// 11. Clear All / active counts
const dirty: ProductFiltersState = {
  categoryIds: ['fruits'],
  priceMin: null,
  priceMax: 49,
  inStockOnly: true,
  discountedOnly: true,
  ratingStars: [5],
};
assert(filtersAreActive(dirty) && countActiveFilters(dirty) === 5, 'active filter count');
assert(!filtersAreActive(createDefaultFilters()), 'defaults are inactive');

// 12. Apply versus Cancel (clone / equality)
const draft = cloneFilters(dirty);
draft.categoryIds.push('dairy');
assert(!filtersEqual(dirty, draft), 'draft edits must not mutate applied via clone');
const cancelled = cloneFilters(dirty);
assert(filtersEqual(dirty, cancelled), 'cancel keeps applied snapshot');

// 13. Filter persistence model — applied state is independent of draft
const applied = createDefaultFilters();
applied.priceMin = 100;
applied.priceMax = 250;
const reopened = cloneFilters(applied);
assert(filtersEqual(applied, reopened), 'reopening preserves applied filters');

// 14. Category switching / active shelf scope
const shelfScoped = applyProductListing({
  products: sample,
  filters: createDefaultFilters(),
  sort: 'catalogue',
  stockFilterSupported: false,
  activeShelfId: 'grains',
});
assert(shelfScoped.map((p) => p.id).join(',') === 'd', 'active shelf scopes when no search/category filter');

const searchOverridesShelf = applyProductListing({
  products: sample,
  query: 'apple',
  filters: createDefaultFilters(),
  sort: 'catalogue',
  stockFilterSupported: false,
  activeShelfId: 'grains',
});
assert(searchOverridesShelf.map((p) => p.id).join(',') === 'a', 'search ignores active shelf scope');

// 15. Invalid / missing product fields
const weird = listed({ id: 'x', name: 'Odd', price: Number.NaN, shelfId: 'fruits', compareAt: undefined });
assert(
  applyProductListing({
    products: [weird],
    filters: { ...createDefaultFilters(), priceMax: 49 },
    sort: 'catalogue',
    stockFilterSupported: false,
  }).length === 0,
  'NaN price excluded from price ranges',
);
assert(!isDiscountedProduct(weird), 'missing compareAt is not discounted');
assert(!isExplicitlyInStock(weird), 'missing available is not confirmed in stock');
assert(!catalogueHasStockSignals([weird]), 'unknown stock must not enable stock filter');
assert(!catalogueHasRatingSignals([weird]), 'missing rating must not enable star filter');

console.log('product filters rules passed');
