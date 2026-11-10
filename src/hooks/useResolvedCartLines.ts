import { useMemo } from 'react';

import { useCatalog } from '@/context/CatalogContext';
import { useMockCart } from '@/context/MockCartContext';
import type { DemoProduct } from '@/types/catalog';

export type ResolvedCartLine =
  | { id: string; quantity: number; product: DemoProduct }
  | { id: string; quantity: number; product: null };

function resolveLines(
  quantities: Record<string, number>,
  findProduct: (id: string) => DemoProduct | undefined,
  catalogReady: boolean,
): {
  lines: ResolvedCartLine[];
  known: { id: string; quantity: number; product: DemoProduct }[];
  missing: { id: string; quantity: number; product: null }[];
  catalogReady: boolean;
} {
  const lines: ResolvedCartLine[] = Object.entries(quantities).map(([id, quantity]) => {
    const product = findProduct(id) ?? null;
    return product ? { id, quantity, product } : { id, quantity, product: null };
  });
  const known = lines.filter(
    (line): line is { id: string; quantity: number; product: DemoProduct } => line.product !== null,
  );
  const missing = catalogReady
    ? lines.filter(
        (line): line is { id: string; quantity: number; product: null } => line.product === null,
      )
    : [];
  return { lines, known, missing, catalogReady };
}

/**
 * Persistent shopping cart lines only — never Buy Now session items.
 * Use on the Cart tab / Review Cart screen.
 */
export function useResolvedCartLines(): {
  lines: ResolvedCartLine[];
  known: { id: string; quantity: number; product: DemoProduct }[];
  missing: { id: string; quantity: number; product: null }[];
  catalogReady: boolean;
} {
  const { quantities } = useMockCart();
  const { findProduct, hydrated, liveEnabled, initialLoading, products } = useCatalog();

  return useMemo(() => {
    const catalogReady = !liveEnabled || (hydrated && !initialLoading) || products.length > 0;
    return resolveLines(quantities, findProduct, catalogReady);
  }, [findProduct, hydrated, initialLoading, liveEnabled, products.length, quantities]);
}

/**
 * Active checkout session lines:
 * - BUY_NOW_CHECKOUT → only the Buy Now product/qty
 * - CART_CHECKOUT → persistent cart
 */
export function useCheckoutLines(): {
  lines: ResolvedCartLine[];
  known: { id: string; quantity: number; product: DemoProduct }[];
  missing: { id: string; quantity: number; product: null }[];
  catalogReady: boolean;
  checkoutMode: 'CART_CHECKOUT' | 'BUY_NOW_CHECKOUT';
  isBuyNow: boolean;
} {
  const { checkoutQuantities, checkoutMode, isBuyNow } = useMockCart();
  const { findProduct, hydrated, liveEnabled, initialLoading, products } = useCatalog();

  return useMemo(() => {
    const catalogReady = !liveEnabled || (hydrated && !initialLoading) || products.length > 0;
    return {
      ...resolveLines(checkoutQuantities, findProduct, catalogReady),
      checkoutMode,
      isBuyNow,
    };
  }, [
    checkoutMode,
    checkoutQuantities,
    findProduct,
    hydrated,
    initialLoading,
    isBuyNow,
    liveEnabled,
    products.length,
  ]);
}
