import type { DemoProduct } from '../src/types/catalog';
import type { ProductFiltersState } from '../src/types/productFilters';
import {
  applyProductListing,
  catalogueHasStockSignals,
  cloneFilters,
  countActiveFilters,
  createDefaultFilters,
  filtersAreActive,
  filtersEqual,
  isDiscountedProduct,
  isExplicitlyInStock,
  matchesPriceRange,
  matchesSearch,
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
  partial: Partial<DemoProduct> & Pick<DemoProduct, 'id' | 'name' | 'price'> & { shelfId?: string },
): ListedProduct {
  const { shelfId, ...rest } = partial;
  return { ...product(rest), shelfId };
}

const sample: ListedProduct[] = [
  listed({ id: 'a', name: 'Apples', price: 40, shelfId: 'fruits', compareAt: 60 }),
  listed({ id: 'b', name: 'Bananas', price: 54, shelfId: 'fruits', compareAt: 68 }),
  listed({ id: 'c', name: 'Curd', price: 120, shelfId: 'dairy', compareAt: 120 }),
  listed({ id: 'd', name: 'Basmati', price: 549, shelfId: 'grains' }),
  listed({ id: 'e', name: 'Eggs', price: 72, shelfId: 'dairy', available: false }),
  listed({ id: 'f', name: 'Farm Milk', price: 56, shelfId: 'dairy', available: true, compareAt: 70 }),
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

// 1. Price range filtering
assert(matchesPriceRange(40, 'under-50'), '40 must be under 50');
assert(matchesPriceRange(50, '50-100'), '50 belongs in 50-100');
assert(matchesPriceRange(100, '100-250'), '100 belongs in 100-250');
assert(matchesPriceRange(251, 'above-250'), '251 is above 250');
assert(!matchesPriceRange(Number.NaN, 'under-50'), 'NaN prices do not match');

const under50 = applyProductListing({
  products: sample,
  filters: { ...createDefaultFilters(), priceRange: 'under-50' },
  sort: 'catalogue',
  stockFilterSupported: false,
});
assert(under50.map((p) => p.id).join(',') === 'a', 'under-50 keeps only Apples');

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
  filters: { ...createDefaultFilters(), categoryIds: ['dairy'], priceRange: '50-100' },
  sort: 'catalogue',
  stockFilterSupported: false,
});
assert(dairyMid.map((p) => p.id).sort().join(',') === 'e,f', 'dairy + 50-100');

// 4. Search + filters
const searchB = applyProductListing({
  products: sample,
  query: 'ba',
  filters: { ...createDefaultFilters(), priceRange: '50-100' },
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

// 7. Price sorting
const byPrice = sortProducts(sample, 'price-asc').map((p) => p.price);
assert(byPrice.join(',') === [...byPrice].sort((a, b) => a - b).join(','), 'price asc numeric');
assert(sortProducts(sample, 'price-desc')[0]?.id === 'd', 'price desc starts with Basmati');

// 8. Alphabetical sorting
assert(sortProducts(sample, 'name-asc')[0]?.name === 'Apples', 'name A-Z');
assert(sortProducts(sample, 'name-desc')[0]?.name === 'Farm Milk', 'name Z-A');

// 9. Empty results
const empty = applyProductListing({
  products: sample,
  query: 'zzzz-missing',
  filters: createDefaultFilters(),
  sort: 'catalogue',
  stockFilterSupported: false,
});
assert(empty.length === 0, 'empty search results');

// 10. Clear All
const dirty: ProductFiltersState = {
  categoryIds: ['fruits'],
  priceRange: 'under-50',
  inStockOnly: true,
  discountedOnly: true,
};
assert(filtersAreActive(dirty) && countActiveFilters(dirty) === 4, 'active filter count');
assert(!filtersAreActive(createDefaultFilters()), 'defaults are inactive');

// 11. Apply versus Cancel (clone / equality)
const draft = cloneFilters(dirty);
draft.categoryIds.push('dairy');
assert(!filtersEqual(dirty, draft), 'draft edits must not mutate applied via clone');
const cancelled = cloneFilters(dirty);
assert(filtersEqual(dirty, cancelled), 'cancel keeps applied snapshot');

// 12. Filter persistence model — applied state is independent of draft
const applied = createDefaultFilters();
applied.priceRange = '100-250';
const reopened = cloneFilters(applied);
assert(filtersEqual(applied, reopened), 'reopening preserves applied filters');

// 13. Category switching / active shelf scope
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

// 14. Invalid / missing product fields
const weird = listed({ id: 'x', name: 'Odd', price: Number.NaN, shelfId: 'fruits', compareAt: undefined });
assert(
  applyProductListing({
    products: [weird],
    filters: { ...createDefaultFilters(), priceRange: 'under-50' },
    sort: 'catalogue',
    stockFilterSupported: false,
  }).length === 0,
  'NaN price excluded from price ranges',
);
assert(!isDiscountedProduct(weird), 'missing compareAt is not discounted');
assert(!isExplicitlyInStock(weird), 'missing available is not confirmed in stock');

// 15. No fake counts / stock claims — stock filter needs real flags
assert(!catalogueHasStockSignals([weird]), 'unknown stock must not enable stock filter');

console.log('product filters rules passed');
