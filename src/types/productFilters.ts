/**
 * Local product listing filter & sort contracts.
 * Ready for a future C# catalogue API — do not invent stock, discounts, or popularity.
 */

export type PriceRangeId = 'all' | 'under-50' | '50-100' | '100-250' | 'above-250';

/**
 * Catalogue order is the honest default until the API publishes ranking scores.
 * Do not label this as Popular unless popularity data exists.
 */
export type ProductSortId = 'catalogue' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

export type ProductFiltersState = {
  /** Empty = no extra category constraint (use the active shelf / search pool). */
  categoryIds: string[];
  priceRange: PriceRangeId;
  /** Only meaningful when catalogue records expose an explicit `available` flag. */
  inStockOnly: boolean;
  /** Products with compareAt strictly greater than price. */
  discountedOnly: boolean;
};

export type CategoryFilterOption = {
  id: string;
  name: string;
  /** Real product count for this shelf in the current pool; never invented. */
  count: number;
};

export type PriceRangeOption = {
  id: PriceRangeId;
  label: string;
  min: number | null;
  max: number | null;
};

export type ProductSortOption = {
  id: ProductSortId;
  label: string;
};
