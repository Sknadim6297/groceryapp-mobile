import type { DemoProduct } from '@/types/catalog';

/**
 * Match a free-text shopping-list name to the catalogue.
 * Only exact name equality (trimmed, case-insensitive) is accepted —
 * never substitutes an unrelated or partial near-match automatically.
 */
export function matchShoppingListItem(
  name: string,
  products: readonly DemoProduct[],
): DemoProduct | null {
  const needle = name.trim().toLowerCase();
  if (!needle) {
    return null;
  }
  const exact = products.filter((product) => product.name.trim().toLowerCase() === needle);
  if (exact.length === 1) {
    return exact[0] ?? null;
  }
  // Ambiguous exact duplicates — refuse to guess.
  return null;
}
