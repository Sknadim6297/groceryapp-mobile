import type { DemoProduct } from '@/types/catalog';
import type {
  CategoryFilterOption,
  PriceRangeId,
  PriceRangeOption,
  ProductFiltersState,
  ProductSortId,
  ProductSortOption,
} from '@/types/productFilters';

export const DEFAULT_PRODUCT_FILTERS: ProductFiltersState = {
  categoryIds: [],
  priceRange: 'all',
  inStockOnly: false,
  discountedOnly: false,
};

export const DEFAULT_PRODUCT_SORT: ProductSortId = 'catalogue';

export const PRICE_RANGE_OPTIONS: PriceRangeOption[] = [
  { id: 'all', label: 'All Prices', min: null, max: null },
  { id: 'under-50', label: 'Under ₹50', min: null, max: 50 },
  { id: '50-100', label: '₹50–₹100', min: 50, max: 100 },
  { id: '100-250', label: '₹100–₹250', min: 100, max: 250 },
  { id: 'above-250', label: 'Above ₹250', min: 250, max: null },
];

/** Honest labels — no Popular claim without ranking data. */
export const PRODUCT_SORT_OPTIONS: ProductSortOption[] = [
  { id: 'catalogue', label: 'Default' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'name-asc', label: 'Name: A to Z' },
  { id: 'name-desc', label: 'Name: Z to A' },
];

export function createDefaultFilters(): ProductFiltersState {
  return {
    categoryIds: [],
    priceRange: 'all',
    inStockOnly: false,
    discountedOnly: false,
  };
}

export function filtersAreActive(filters: ProductFiltersState): boolean {
  return (
    filters.categoryIds.length > 0 ||
    filters.priceRange !== 'all' ||
    filters.inStockOnly ||
    filters.discountedOnly
  );
}

export function countActiveFilters(filters: ProductFiltersState): number {
  let count = 0;
  if (filters.categoryIds.length > 0) {
    count += 1;
  }
  if (filters.priceRange !== 'all') {
    count += 1;
  }
  if (filters.inStockOnly) {
    count += 1;
  }
  if (filters.discountedOnly) {
    count += 1;
  }
  return count;
}

export function sortLabel(sort: ProductSortId): string {
  return PRODUCT_SORT_OPTIONS.find((option) => option.id === sort)?.label ?? 'Default';
}

/** True only when at least one product carries an explicit `available` boolean. */
export function catalogueHasStockSignals(products: readonly DemoProduct[]): boolean {
  return products.some((product) => typeof product.available === 'boolean');
}

/** Discounted when MRP (`compareAt`) is present and strictly above selling price. */
export function isDiscountedProduct(product: DemoProduct): boolean {
  return product.compareAt != null && Number.isFinite(product.compareAt) && product.compareAt > product.price;
}

/**
 * Explicit in-stock only. Missing `available` is unknown — never treated as confirmed stock here.
 * Returns false when the flag is absent.
 */
export function isExplicitlyInStock(product: DemoProduct): boolean {
  return product.available === true;
}

export function matchesPriceRange(price: number, rangeId: PriceRangeId): boolean {
  if (!Number.isFinite(price)) {
    return false;
  }
  switch (rangeId) {
    case 'all':
      return true;
    case 'under-50':
      return price < 50;
    case '50-100':
      return price >= 50 && price <= 100;
    case '100-250':
      return price >= 100 && price <= 250;
    case 'above-250':
      return price > 250;
    default:
      return true;
  }
}

export function matchesSearch(product: DemoProduct, needle: string): boolean {
  if (!needle) {
    return true;
  }
  return product.name.toLowerCase().includes(needle) || product.unit.toLowerCase().includes(needle);
}

export type ListedProduct = DemoProduct & {
  /** Shelf id when known; used for category filtering. */
  shelfId?: string;
};

export type ApplyProductListingArgs = {
  products: readonly ListedProduct[];
  query?: string;
  filters: ProductFiltersState;
  sort: ProductSortId;
  /** When true, inStockOnly is ignored (no explicit stock fields in the pool). */
  stockFilterSupported: boolean;
  /**
   * When there is no search and no category multi-select, keep the listing on this shelf
   * (Shop sidebar selection). Ignored once the customer picks categories or searches.
   */
  activeShelfId?: string;
};

export function applyProductListing({
  products,
  query = '',
  filters,
  sort,
  stockFilterSupported,
  activeShelfId,
}: ApplyProductListingArgs): ListedProduct[] {
  const needle = query.trim().toLowerCase();
  const categorySet = filters.categoryIds.length > 0 ? new Set(filters.categoryIds) : null;
  const shelfScoped = !needle && !categorySet && Boolean(activeShelfId);

  const filtered = products.filter((product) => {
    if (!matchesSearch(product, needle)) {
      return false;
    }
    if (categorySet) {
      if (!product.shelfId || !categorySet.has(product.shelfId)) {
        return false;
      }
    } else if (shelfScoped && product.shelfId !== activeShelfId) {
      return false;
    }
    if (!matchesPriceRange(product.price, filters.priceRange)) {
      return false;
    }
    if (filters.discountedOnly && !isDiscountedProduct(product)) {
      return false;
    }
    if (filters.inStockOnly && stockFilterSupported && !isExplicitlyInStock(product)) {
      return false;
    }
    return true;
  });

  return sortProducts(filtered, sort);
}

export function sortProducts<T extends DemoProduct>(products: readonly T[], sort: ProductSortId): T[] {
  const next = [...products];
  switch (sort) {
    case 'price-asc':
      return next.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    case 'price-desc':
      return next.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
    case 'name-asc':
      return next.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return next.sort((a, b) => b.name.localeCompare(a.name));
    case 'catalogue':
    default:
      return next;
  }
}

export function buildCategoryOptions(
  shelves: readonly { id: string; name: string; products: readonly DemoProduct[] }[],
): CategoryFilterOption[] {
  return shelves
    .map((shelf) => ({
      id: shelf.id,
      name: shelf.name,
      count: shelf.products.length,
    }))
    .filter((option) => option.count > 0);
}

/** Price buckets that actually contain at least one product in the pool (plus All Prices). */
export function availablePriceRanges(products: readonly DemoProduct[]): PriceRangeOption[] {
  const usable = PRICE_RANGE_OPTIONS.filter((option) => {
    if (option.id === 'all') {
      return true;
    }
    return products.some((product) => matchesPriceRange(product.price, option.id));
  });
  return usable.length > 0 ? usable : PRICE_RANGE_OPTIONS;
}

export function cloneFilters(filters: ProductFiltersState): ProductFiltersState {
  return {
    categoryIds: [...filters.categoryIds],
    priceRange: filters.priceRange,
    inStockOnly: filters.inStockOnly,
    discountedOnly: filters.discountedOnly,
  };
}

export function filtersEqual(a: ProductFiltersState, b: ProductFiltersState): boolean {
  if (a.priceRange !== b.priceRange || a.inStockOnly !== b.inStockOnly || a.discountedOnly !== b.discountedOnly) {
    return false;
  }
  if (a.categoryIds.length !== b.categoryIds.length) {
    return false;
  }
  const left = [...a.categoryIds].sort();
  const right = [...b.categoryIds].sort();
  return left.every((id, index) => id === right[index]);
}
