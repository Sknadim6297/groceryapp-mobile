import type { DemoProduct } from '@/types/catalog';

type ProductLookup = (id: string) => DemoProduct | undefined;

/**
 * Resolve stored view history against the current catalogue.
 * Drops missing / unavailable ids from the displayed rail (history ids stay in storage until overwritten).
 */
export function resolveRecentlyViewedProducts(
  ids: readonly string[],
  lookup: ProductLookup,
  limit = 8,
): DemoProduct[] {
  const out: DemoProduct[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = raw.trim();
    if (!id || seen.has(id)) {
      continue;
    }
    const product = lookup(id);
    if (!product) {
      continue;
    }
    seen.add(id);
    out.push(product);
    if (out.length >= limit) {
      break;
    }
  }
  return out;
}
