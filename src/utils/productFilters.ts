import type { DemoProduct } from '@/types/catalog';
import type {
  CategoryFilterOption,
  FilterStarRating,
  PriceRangeId,
  PriceRangeOption,
  ProductFiltersState,
  ProductSortId,
  ProductSortOption,
} from '@/types/productFilters';

export const DEFAULT_PRODUCT_FILTERS: ProductFiltersState = {
  categoryIds: [],
  priceMin: null,
  priceMax: null,
  inStockOnly: false,
  discountedOnly: false,
  ratingStars: [],
};

export const DEFAULT_PRODUCT_SORT: ProductSortId = 'catalogue';

export const FILTER_STAR_OPTIONS: { id: FilterStarRating; label: string }[] = [
  { id: 5, label: '5 Star' },
  { id: 4, label: '4 Star' },
  { id: 3, label: '3 Star' },
];

/** Legacy preset chips — still used by tests for bucket helpers. */
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
    priceMin: null,
    priceMax: null,
    inStockOnly: false,
    discountedOnly: false,
    ratingStars: [],
  };
}

export function filtersAreActive(filters: ProductFiltersState): boolean {
  return (
    filters.categoryIds.length > 0 ||
    filters.priceMin != null ||
    filters.priceMax != null ||
    filters.inStockOnly ||
    filters.discountedOnly ||
    filters.ratingStars.length > 0
  );
}

export function countActiveFilters(filters: ProductFiltersState): number {
  let count = 0;
  if (filters.categoryIds.length > 0) {
    count += 1;
  }
  if (filters.priceMin != null || filters.priceMax != null) {
    count += 1;
  }
  if (filters.inStockOnly) {
    count += 1;
  }
  if (filters.discountedOnly) {
    count += 1;
  }
  if (filters.ratingStars.length > 0) {
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

/** True when at least one listing row exposes a real rating average. */
export function catalogueHasRatingSignals(products: readonly ListedProduct[]): boolean {
  return products.some((product) => typeof product.ratingAverage === 'number' && Number.isFinite(product.ratingAverage));
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

export function matchesPriceBounds(price: number, min: number | null, max: number | null): boolean {
  if (!Number.isFinite(price)) {
    return false;
  }
  if (min != null && price < min) {
    return false;
  }
  if (max != null && price > max) {
    return false;
  }
  return true;
}

/** Legacy preset matcher kept for existing unit coverage. */
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

export function matchesRatingStars(average: number | undefined, stars: readonly FilterStarRating[]): boolean {
  if (stars.length === 0) {
    return true;
  }
  if (average == null || !Number.isFinite(average)) {
    return false;
  }
  const rounded = Math.round(average);
  return stars.includes(rounded as FilterStarRating);
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
  /**
   * Rounded-ready average rating when the reviews layer publishes one.
   * Missing = unknown — rating filters exclude the row.
   */
  ratingAverage?: number;
};

export type ApplyProductListingArgs = {
  products: readonly ListedProduct[];
  query?: string;
  filters: ProductFiltersState;
  sort: ProductSortId;
  /** When true, inStockOnly is ignored (no explicit stock fields in the pool). */
  stockFilterSupported: boolean;
  /** When false, ratingStars is ignored (no rating averages on the pool). */
  ratingFilterSupported?: boolean;
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
  ratingFilterSupported = true,
  activeShelfId,
}: ApplyProductListingArgs): ListedProduct[] {
  const needle = query.trim().toLowerCase();
  const categorySet = filters.categoryIds.length > 0 ? new Set(filters.categoryIds) : null;
  const shelfScoped = !needle && !categorySet && Boolean(activeShelfId);
  const ratingActive = ratingFilterSupported && filters.ratingStars.length > 0;

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
    if (!matchesPriceBounds(product.price, filters.priceMin, filters.priceMax)) {
      return false;
    }
    if (filters.discountedOnly && !isDiscountedProduct(product)) {
      return false;
    }
    if (filters.inStockOnly && stockFilterSupported && !isExplicitlyInStock(product)) {
      return false;
    }
    if (ratingActive && !matchesRatingStars(product.ratingAverage, filters.ratingStars)) {
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

/** Inclusive min/max from finite catalogue prices. Falls back to 0–1000 when empty. */
export function priceBoundsFromPool(products: readonly DemoProduct[]): { min: number; max: number } {
  const prices = products.map((product) => product.price).filter((price) => Number.isFinite(price));
  if (prices.length === 0) {
    return { min: 0, max: 1000 };
  }
  const min = Math.floor(Math.min(...prices));
  const max = Math.ceil(Math.max(...prices));
  return min === max ? { min, max: max + 1 } : { min, max };
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
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    inStockOnly: filters.inStockOnly,
    discountedOnly: filters.discountedOnly,
    ratingStars: [...filters.ratingStars],
  };
}

export function filtersEqual(a: ProductFiltersState, b: ProductFiltersState): boolean {
  if (
    a.priceMin !== b.priceMin ||
    a.priceMax !== b.priceMax ||
    a.inStockOnly !== b.inStockOnly ||
    a.discountedOnly !== b.discountedOnly
  ) {
    return false;
  }
  if (a.categoryIds.length !== b.categoryIds.length || a.ratingStars.length !== b.ratingStars.length) {
    return false;
  }
  const left = [...a.categoryIds].sort();
  const right = [...b.categoryIds].sort();
  if (!left.every((id, index) => id === right[index])) {
    return false;
  }
  const starsLeft = [...a.ratingStars].sort((x, y) => x - y);
  const starsRight = [...b.ratingStars].sort((x, y) => x - y);
  return starsLeft.every((star, index) => star === starsRight[index]);
}

export function parsePriceInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.]/g, '').trim();
  if (!cleaned) {
    return null;
  }
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : null;
}
