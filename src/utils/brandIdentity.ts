import type { DemoBrand, DemoProduct } from '@/types/catalog';

/**
 * Confirmed placeholder / non-brand ERP literals (normalized keys).
 * Not a whitelist of real brands — only explicit junk/placeholder labels.
 */
const PLACEHOLDER_BRAND_KEYS = new Set([
  'n/a',
  'na',
  'n a',
  'null',
  'undefined',
  'unknown',
  'no brand',
  'nobrand',
  'none',
  'nil',
  '-',
  '--',
  'tbd',
  'test',
  'other',
  'misc',
  'miscellaneous',
]);

/**
 * Stable brand key for exact matching / dedupe.
 * Collapses case and internal whitespace — does not use substring matching.
 */
export function normalizeBrandKey(value: string | null | undefined): string {
  if (value == null) {
    return '';
  }
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Deterministic brand id from a display name (matches liveBrandId slug rules). */
export function brandIdFromName(brand: string): string {
  const slug = normalizeBrandKey(brand).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `brand-${slug || 'unknown'}`;
}

/**
 * True when the ERP Brand string is usable for browse/filter.
 * Rejects blank, placeholders (N/A, Unknown, …), and confirmed junk like "ee"
 * (identical letter repeated, letters-only, length 2–3) — does NOT reject short
 * legitimate names such as "3M", "HP", or "LG".
 */
export function isValidBrandName(value: string | null | undefined): boolean {
  const key = normalizeBrandKey(value);
  if (!key) {
    return false;
  }
  if (PLACEHOLDER_BRAND_KEYS.has(key)) {
    return false;
  }
  // Punctuation-only / symbol-only
  if (!/[a-z0-9]/i.test(key)) {
    return false;
  }
  // Repeated identical letter only (ee, xxx) — keep digit brands like "3M" / short "LG".
  const compact = key.replace(/[^a-z0-9]/gi, '');
  if (
    compact.length >= 2 &&
    compact.length <= 3 &&
    /^([a-z])\1+$/i.test(compact) &&
    !/[0-9]/.test(compact)
  ) {
    return false;
  }
  return true;
}

export function brandsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeBrandKey(a);
  const right = normalizeBrandKey(b);
  return left.length > 0 && left === right && isValidBrandName(a) && isValidBrandName(b);
}

/** Exact brand membership — never matches against unit/name or substrings. */
export function productMatchesBrand(
  product: Pick<DemoProduct, 'brand'>,
  brandNeedle: string | null | undefined,
): boolean {
  if (!isValidBrandName(brandNeedle) || !isValidBrandName(product.brand)) {
    return false;
  }
  return normalizeBrandKey(product.brand) === normalizeBrandKey(brandNeedle);
}

export function brandInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

/**
 * When ERP sends "FORTUNE" and "Fortune", keep the more natural display form.
 */
export function preferBrandDisplayName(current: string, incoming: string): string {
  const cur = current.trim();
  const next = incoming.trim();
  if (!cur) {
    return next;
  }
  if (!next) {
    return cur;
  }
  const curAllCaps = cur === cur.toUpperCase() && /[A-Za-z]/.test(cur);
  const nextAllCaps = next === next.toUpperCase() && /[A-Za-z]/.test(next);
  if (curAllCaps && !nextAllCaps) {
    return next;
  }
  if (!curAllCaps && nextAllCaps) {
    return cur;
  }
  return cur.length >= next.length ? cur : next;
}

const EMPTY_MARK = { uri: '' } as const;

/**
 * Unique brands from loaded catalogue products only.
 * No logo API — image is empty; UI must use initials fallback (never product photos).
 */
export function deriveCatalogueBrands(products: readonly DemoProduct[]): DemoBrand[] {
  const seen = new Map<string, DemoBrand>();
  for (const product of products) {
    const raw = product.brand?.trim();
    if (!isValidBrandName(raw)) {
      continue;
    }
    const id = brandIdFromName(raw!);
    const existing = seen.get(id);
    if (existing) {
      existing.name = preferBrandDisplayName(existing.name, raw!);
      continue;
    }
    seen.set(id, { id, name: raw!, image: EMPTY_MARK });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Resolve a brand needle to a catalogue brand without rebuilding the full sorted list
 * when only one lookup is needed.
 */
export function findCatalogueBrand(
  products: readonly DemoProduct[],
  brandNeedle: string | null | undefined,
): DemoBrand | undefined {
  if (!isValidBrandName(brandNeedle)) {
    return undefined;
  }
  const needleKey = normalizeBrandKey(brandNeedle);
  let match: DemoBrand | undefined;
  for (const product of products) {
    const raw = product.brand?.trim();
    if (!isValidBrandName(raw)) {
      continue;
    }
    if (normalizeBrandKey(raw) !== needleKey) {
      continue;
    }
    if (!match) {
      match = { id: brandIdFromName(raw!), name: raw!, image: EMPTY_MARK };
    } else {
      match.name = preferBrandDisplayName(match.name, raw!);
    }
  }
  return match;
}

export function filterProductsByBrand<T extends DemoProduct>(
  products: readonly T[],
  brandNeedle: string | null | undefined,
): T[] {
  if (!isValidBrandName(brandNeedle)) {
    return [];
  }
  return products.filter((product) => productMatchesBrand(product, brandNeedle));
}

/** Sanitize ERP Brand before attaching to a product record. */
export function sanitizeProductBrand(value: string | null | undefined): string | undefined {
  if (!isValidBrandName(value)) {
    return undefined;
  }
  return value!.trim();
}
