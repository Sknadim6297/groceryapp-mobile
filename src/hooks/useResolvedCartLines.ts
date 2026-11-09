import { useMemo } from 'react';

import { useCatalog } from '@/context/CatalogContext';
import { useMockCart } from '@/context/MockCartContext';
import type { DemoProduct } from '@/types/catalog';

export type ResolvedCartLine =
  | { id: string; quantity: number; product: DemoProduct }
  | { id: string; quantity: number; product: null };

/**
 * Resolves cart quantity ids against the live catalogue (or local demo catalogue)
 * via CatalogContext — never only against outdated findDemoProduct fixtures.
 */
export function useResolvedCartLines(): {
  lines: ResolvedCartLine[];
  known: { id: string; quantity: number; product: DemoProduct }[];
  missing: { id: string; quantity: number; product: null }[];
  /** False while the live catalogue is still loading — avoid treating lines as missing yet. */
  catalogReady: boolean;
} {
  const { quantities } = useMockCart();
  const { findProduct, hydrated, liveEnabled, initialLoading, products } = useCatalog();

  return useMemo(() => {
    const catalogReady = !liveEnabled || (hydrated && !initialLoading) || products.length > 0;
    const lines: ResolvedCartLine[] = Object.entries(quantities).map(([id, quantity]) => {
      const product = findProduct(id) ?? null;
      return product ? { id, quantity, product } : { id, quantity, product: null };
    });
    const known = lines.filter(
      (line): line is { id: string; quantity: number; product: DemoProduct } => line.product !== null,
    );
    // Until the catalogue is ready, unresolved ids are pending — not confirmed missing.
    const missing = catalogReady
      ? lines.filter(
          (line): line is { id: string; quantity: number; product: null } => line.product === null,
        )
      : [];
    return { lines, known, missing, catalogReady };
  }, [findProduct, hydrated, initialLoading, liveEnabled, products.length, quantities]);
}
