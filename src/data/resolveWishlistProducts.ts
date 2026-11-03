import type { DemoProduct } from '@/types/catalog';

export type WishlistEntry =
  | { kind: 'ready'; id: string; product: DemoProduct }
  | { kind: 'unavailable'; id: string };

type ProductLookup = (id: string) => DemoProduct | undefined;

/** Maps saved ids to catalogue products. Deleted ids stay listed as unavailable. */
export function resolveWishlistEntries(ids: readonly string[], lookup: ProductLookup): WishlistEntry[] {
  return ids.map((id) => {
    const product = lookup(id);
    if (!product) {
      return { kind: 'unavailable', id };
    }
    return { kind: 'ready', id, product };
  });
}

export function wishlistAvailableCount(entries: readonly WishlistEntry[]): number {
  return entries.filter((entry) => entry.kind === 'ready').length;
}

/** Missing or true means in stock. Explicit false is out of stock. */
export function isProductInStock(product: DemoProduct): boolean {
  return product.available !== false;
}
