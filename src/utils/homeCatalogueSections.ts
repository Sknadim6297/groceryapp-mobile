import type { DemoProduct } from '@/types/catalog';

export type HomeCatalogueSections = {
  recommended: DemoProduct[];
  spotlight: DemoProduct[];
  popular: DemoProduct[];
  topSelling: DemoProduct[];
  dryFruits: DemoProduct[];
};

/**
 * Splits one live catalogue into Home rails without inventing products or history.
 * Recently viewed is device-local (RecentlyViewedContext) — not derived here.
 * Buy Again needs a past-order API and must not invent purchases from this split.
 */
export function buildHomeCatalogueSections(products: readonly DemoProduct[]): HomeCatalogueSections {
  const list = [...products];
  const discounted = list.filter(
    (product) =>
      Boolean(product.discountLabel) ||
      (product.compareAt != null && product.compareAt > product.price),
  );
  const dryFruits = list.filter((product) =>
    /dry|cereal|nut|peanut|fruit/i.test(`${product.category ?? ''} ${product.name}`),
  );

  return {
    recommended: list.slice(0, 4),
    spotlight: (discounted.length > 0 ? discounted : list.slice(4)).slice(0, 4),
    popular: list.slice(0, 6),
    topSelling: list.slice(0, 8),
    dryFruits,
  };
}
