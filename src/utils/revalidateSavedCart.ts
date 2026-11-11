import { normalizeCartQuantities } from '@/services/cartStore';
import type { DemoProduct } from '@/types/catalog';
import { isProductInStock } from '@/data/resolveWishlistProducts';

export type RevalidatedSavedCart = {
  /** Quantities still present and in stock in the current catalogue. */
  quantities: Record<string, number>;
  /** Catalogue ids that are missing entirely. */
  missingIds: string[];
  /** Catalogue ids present but out of stock (excluded from restore). */
  outOfStockIds: string[];
};

/**
 * Revalidate a saved cart snapshot against the live/local catalogue.
 * Never trusts previously saved prices or stock — only product presence + available flag.
 */
export function revalidateSavedCartQuantities(
  quantities: Record<string, number>,
  findProduct: (id: string) => DemoProduct | undefined,
): RevalidatedSavedCart {
  const normalized = normalizeCartQuantities(quantities);
  const next: Record<string, number> = {};
  const missingIds: string[] = [];
  const outOfStockIds: string[] = [];

  for (const [id, qty] of Object.entries(normalized)) {
    const product = findProduct(id);
    if (!product) {
      missingIds.push(id);
      continue;
    }
    if (!isProductInStock(product)) {
      outOfStockIds.push(id);
      continue;
    }
    next[id] = qty;
  }

  return { quantities: next, missingIds, outOfStockIds };
}
