import type { FilterStarRating, ProductFiltersState, ProductSortId } from '@/types/productFilters';
import {
  DEFAULT_PRODUCT_SORT,
  createDefaultFilters,
  filtersAreActive,
} from '@/utils/productFilters';

const SORT_IDS: readonly ProductSortId[] = [
  'catalogue',
  'price-asc',
  'price-desc',
  'name-asc',
  'name-desc',
];

function isSortId(value: string): value is ProductSortId {
  return (SORT_IDS as readonly string[]).includes(value);
}

function isStar(value: number): value is FilterStarRating {
  return value === 3 || value === 4 || value === 5;
}

/** Encode applied filters for Expo Router params (omit when inactive). */
export function encodeShopFilters(filters: ProductFiltersState): string | undefined {
  if (!filtersAreActive(filters)) {
    return undefined;
  }
  const parts: string[] = [];
  if (filters.categoryIds.length > 0) {
    parts.push(`cats:${filters.categoryIds.map((id) => encodeURIComponent(id)).join(',')}`);
  }
  if (filters.priceMin != null) {
    parts.push(`pmin:${filters.priceMin}`);
  }
  if (filters.priceMax != null) {
    parts.push(`pmax:${filters.priceMax}`);
  }
  if (filters.inStockOnly) {
    parts.push('stock:1');
  }
  if (filters.discountedOnly) {
    parts.push('sale:1');
  }
  if (filters.ratingStars.length > 0) {
    parts.push(`stars:${filters.ratingStars.join(',')}`);
  }
  return parts.length > 0 ? parts.join('|') : undefined;
}

export function decodeShopFilters(raw: string | null | undefined): ProductFiltersState {
  const base = createDefaultFilters();
  if (!raw || raw.trim().length === 0) {
    return base;
  }
  for (const part of raw.split('|')) {
    const [key, value] = part.split(':');
    if (!key) {
      continue;
    }
    if (key === 'cats' && value) {
      base.categoryIds = value
        .split(',')
        .map((item) => {
          try {
            return decodeURIComponent(item).trim();
          } catch {
            return item.trim();
          }
        })
        .filter(Boolean);
    } else if (key === 'pmin' && value) {
      const n = Number(value);
      if (Number.isFinite(n)) {
        base.priceMin = n;
      }
    } else if (key === 'pmax' && value) {
      const n = Number(value);
      if (Number.isFinite(n)) {
        base.priceMax = n;
      }
    } else if (key === 'stock' && value === '1') {
      base.inStockOnly = true;
    } else if (key === 'sale' && value === '1') {
      base.discountedOnly = true;
    } else if (key === 'stars' && value) {
      base.ratingStars = value
        .split(',')
        .map((item) => Number(item))
        .filter(isStar);
    }
  }
  return base;
}

export function encodeShopSort(sort: ProductSortId): string | undefined {
  return sort === DEFAULT_PRODUCT_SORT ? undefined : sort;
}

export function decodeShopSort(raw: string | null | undefined): ProductSortId {
  const value = raw?.trim() ?? '';
  return value && isSortId(value) ? value : DEFAULT_PRODUCT_SORT;
}
