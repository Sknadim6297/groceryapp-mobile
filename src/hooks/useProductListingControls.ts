import { useCallback, useMemo, useState } from 'react';

import type { DemoProduct } from '@/types/catalog';
import type { ProductFiltersState, ProductSortId } from '@/types/productFilters';
import {
  applyProductListing,
  catalogueHasRatingSignals,
  catalogueHasStockSignals,
  cloneFilters,
  countActiveFilters,
  createDefaultFilters,
  DEFAULT_PRODUCT_SORT,
  filtersAreActive,
  type ListedProduct,
} from '@/utils/productFilters';

type ListingChange = {
  filters: ProductFiltersState;
  sort: ProductSortId;
};

type UseProductListingControlsArgs = {
  /** Full catalogue pool with shelfId when known. */
  pool: readonly ListedProduct[];
  query: string;
  /** Active Shop sidebar shelf — default scope when not searching / multi-selecting. */
  activeShelfId?: string;
  /** Reset filters when this key changes (e.g. active shelf id). Sort is preserved unless seedKey changes. */
  scopeKey: string;
  /** Seed from URL / navigation state. */
  seedFilters?: ProductFiltersState;
  seedSort?: ProductSortId;
  /** When this changes, re-apply seedFilters/seedSort (URL restore). */
  seedKey?: string;
  /** Persist listing state for back/forward (e.g. router.setParams). */
  onListingChange?: (next: ListingChange) => void;
};

/**
 * Draft vs applied filter state for product listings.
 * Closing the filter sheet without Apply discards draft edits.
 */
export function useProductListingControls({
  pool,
  query,
  activeShelfId,
  scopeKey,
  seedFilters,
  seedSort,
  seedKey = '',
  onListingChange,
}: UseProductListingControlsArgs) {
  const [filters, setFilters] = useState<ProductFiltersState>(
    () => (seedFilters ? cloneFilters(seedFilters) : createDefaultFilters()),
  );
  const [sort, setSort] = useState<ProductSortId>(() => seedSort ?? DEFAULT_PRODUCT_SORT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [seenScope, setSeenScope] = useState(scopeKey);
  const [seenSeed, setSeenSeed] = useState(seedKey);

  const stockFilterSupported = useMemo(() => catalogueHasStockSignals(pool), [pool]);
  const ratingFilterSupported = useMemo(() => catalogueHasRatingSignals(pool), [pool]);

  if (seedKey !== seenSeed) {
    setSeenSeed(seedKey);
    setFilters(seedFilters ? cloneFilters(seedFilters) : createDefaultFilters());
    setSort(seedSort ?? DEFAULT_PRODUCT_SORT);
  } else if (scopeKey !== seenScope) {
    setSeenScope(scopeKey);
    setFilters(createDefaultFilters());
  } else if (!stockFilterSupported && filters.inStockOnly) {
    setFilters({ ...filters, inStockOnly: false });
  } else if (!ratingFilterSupported && filters.ratingStars.length > 0) {
    setFilters({ ...filters, ratingStars: [] });
  }

  const products = useMemo(
    () =>
      applyProductListing({
        products: pool,
        query,
        filters,
        sort,
        stockFilterSupported,
        ratingFilterSupported,
        activeShelfId,
      }),
    [activeShelfId, filters, pool, query, ratingFilterSupported, sort, stockFilterSupported],
  );

  const activeFilterCount = countActiveFilters(filters);
  const hasActiveFilters = filtersAreActive(filters);

  const openFilters = useCallback(() => {
    setSortOpen(false);
    setFiltersOpen(true);
  }, []);

  const closeFilters = useCallback(() => {
    setFiltersOpen(false);
  }, []);

  const openSort = useCallback(() => {
    setFiltersOpen(false);
    setSortOpen(true);
  }, []);

  const closeSort = useCallback(() => {
    setSortOpen(false);
  }, []);

  const applyFilters = useCallback(
    (next: ProductFiltersState) => {
      const sanitized = cloneFilters(next);
      if (!stockFilterSupported) {
        sanitized.inStockOnly = false;
      }
      if (!ratingFilterSupported) {
        sanitized.ratingStars = [];
      }
      setFilters(sanitized);
      setFiltersOpen(false);
      onListingChange?.({ filters: sanitized, sort });
    },
    [onListingChange, ratingFilterSupported, sort, stockFilterSupported],
  );

  const clearFilters = useCallback(() => {
    const next = createDefaultFilters();
    setFilters(next);
    onListingChange?.({ filters: next, sort });
  }, [onListingChange, sort]);

  const selectSort = useCallback(
    (next: ProductSortId) => {
      setSort(next);
      setSortOpen(false);
      onListingChange?.({ filters, sort: next });
    },
    [filters, onListingChange],
  );

  /** Preview count for the filter sheet Apply button (draft filters). */
  const previewCount = useCallback(
    (draft: ProductFiltersState) =>
      applyProductListing({
        products: pool,
        query,
        filters: draft,
        sort,
        stockFilterSupported,
        ratingFilterSupported,
        activeShelfId,
      }).length,
    [activeShelfId, pool, query, ratingFilterSupported, sort, stockFilterSupported],
  );

  return {
    products: products as DemoProduct[],
    filters,
    sort,
    filtersOpen,
    sortOpen,
    stockFilterSupported,
    activeFilterCount,
    hasActiveFilters,
    openFilters,
    closeFilters,
    openSort,
    closeSort,
    applyFilters,
    clearFilters,
    selectSort,
    previewCount,
    resultCount: products.length,
  };
}
