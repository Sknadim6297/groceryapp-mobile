import { useCallback, useMemo, useState } from 'react';

import type { DemoProduct } from '@/types/catalog';
import type { ProductFiltersState, ProductSortId } from '@/types/productFilters';
import {
  applyProductListing,
  catalogueHasStockSignals,
  cloneFilters,
  countActiveFilters,
  createDefaultFilters,
  DEFAULT_PRODUCT_SORT,
  filtersAreActive,
  type ListedProduct,
} from '@/utils/productFilters';

type UseProductListingControlsArgs = {
  /** Full catalogue pool with shelfId when known. */
  pool: readonly ListedProduct[];
  query: string;
  /** Active Shop sidebar shelf — default scope when not searching / multi-selecting. */
  activeShelfId?: string;
  /** Reset filters when this key changes (e.g. active shelf id). Sort is preserved. */
  scopeKey: string;
};

/**
 * Draft vs applied filter state for product listings.
 * Closing the filter sheet without Apply discards draft edits.
 */
export function useProductListingControls({ pool, query, activeShelfId, scopeKey }: UseProductListingControlsArgs) {
  const [filters, setFilters] = useState<ProductFiltersState>(createDefaultFilters);
  const [sort, setSort] = useState<ProductSortId>(DEFAULT_PRODUCT_SORT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [seenScope, setSeenScope] = useState(scopeKey);

  const stockFilterSupported = useMemo(() => catalogueHasStockSignals(pool), [pool]);

  if (scopeKey !== seenScope) {
    setSeenScope(scopeKey);
    setFilters(createDefaultFilters());
  } else if (!stockFilterSupported && filters.inStockOnly) {
    setFilters({ ...filters, inStockOnly: false });
  }

  const products = useMemo(
    () =>
      applyProductListing({
        products: pool,
        query,
        filters,
        sort,
        stockFilterSupported,
        activeShelfId,
      }),
    [activeShelfId, filters, pool, query, sort, stockFilterSupported],
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

  const applyFilters = useCallback((next: ProductFiltersState) => {
    const sanitized = cloneFilters(next);
    if (!stockFilterSupported) {
      sanitized.inStockOnly = false;
    }
    setFilters(sanitized);
    setFiltersOpen(false);
  }, [stockFilterSupported]);

  const clearFilters = useCallback(() => {
    setFilters(createDefaultFilters());
  }, []);

  const selectSort = useCallback((next: ProductSortId) => {
    setSort(next);
    setSortOpen(false);
  }, []);

  /** Preview count for the filter sheet Apply button (draft filters). */
  const previewCount = useCallback(
    (draft: ProductFiltersState) =>
      applyProductListing({
        products: pool,
        query,
        filters: draft,
        sort,
        stockFilterSupported,
        activeShelfId,
      }).length,
    [activeShelfId, pool, query, sort, stockFilterSupported],
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
