/**
 * Local product listing filter & sort contracts.
 * Ready for a future C# catalogue API — do not invent stock, discounts, or popularity.
 */

/**
 * Catalogue order is the honest default until the API publishes ranking scores.
 * Do not label this as Popular unless popularity data exists.
 */
export type ProductSortId = 'catalogue' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

/** Star buckets shown in the Filters sheet (multi-select). */
export type FilterStarRating = 3 | 4 | 5;

export type ProductFiltersState = {
  /** Empty = no extra category constraint (use the active shelf / search pool). */
  categoryIds: string[];
  /**
   * Inclusive price bounds in INR.
   * `null` means unbound on that side (full catalogue span).
   */
  priceMin: number | null;
  priceMax: number | null;
  /** Only meaningful when catalogue records expose an explicit `available` flag. */
  inStockOnly: boolean;
  /** Products with compareAt strictly greater than price ("On Sale"). */
  discountedOnly: boolean;
  /**
   * Empty = no rating filter.
   * When set, products must expose `ratingAverage` whose rounded value is in this list.
   */
  ratingStars: FilterStarRating[];
};

export type CategoryFilterOption = {
  id: string;
  name: string;
  /** Real product count for this shelf in the current pool; never invented. */
  count: number;
};

export type ProductSortOption = {
  id: ProductSortId;
  label: string;
};

/** @deprecated Kept for older call sites during migration — prefer priceMin/priceMax. */
export type PriceRangeId = 'all' | 'under-50' | '50-100' | '100-250' | 'above-250';

export type PriceRangeOption = {
  id: PriceRangeId;
  label: string;
  min: number | null;
  max: number | null;
};
