import type { ShopShelf } from '@/data/shopCatalog';
import type { DemoProduct } from '@/types/catalog';
import { liveShelfIdForCategory, liveShelfIdForSubcategory } from '@/utils/liveCatalogMeta';

/** Collapse case / punctuation so ERP labels compare safely. */
export function normalizeCatalogLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugPart(value: string): string {
  return normalizeCatalogLabel(value).replace(/\s+/g, '-');
}

export function categoryLabelsEqual(a: string, b: string): boolean {
  const left = a.trim();
  const right = b.trim();
  if (!left || !right) {
    return false;
  }
  return (
    normalizeCatalogLabel(left) === normalizeCatalogLabel(right) ||
    liveShelfIdForCategory(left) === liveShelfIdForCategory(right)
  );
}

/**
 * Subcategory membership: exact label match, or containment when the browse taxonomy
 * name is a meaningful substring of the ERP product SubCategory (or vice versa).
 * Short labels (< 4 chars) require exact equality to avoid "oil" / "foil" collisions.
 */
export function subcategoryLabelsMatch(productSubcategory: string, selectedSubcategory: string): boolean {
  const product = normalizeCatalogLabel(productSubcategory);
  const selected = normalizeCatalogLabel(selectedSubcategory);
  if (!product || !selected) {
    return false;
  }
  if (product === selected) {
    return true;
  }
  const shorter = product.length <= selected.length ? product : selected;
  if (shorter.length < 4) {
    return false;
  }
  return product.includes(selected) || selected.includes(product);
}

export type ResolveShopListingInput = {
  shelfId?: string;
  parentName?: string;
  subcategoryName?: string;
  shelves: readonly ShopShelf[];
  products: readonly DemoProduct[];
};

export type ResolveShopListingResult =
  | {
      status: 'matched';
      shelfId: string;
      shelfName: string;
      products: DemoProduct[];
    }
  | {
      status: 'empty';
      shelfId?: string;
      shelfName: string;
      products: [];
    }
  | { status: 'invalid'; products: [] }
  | { status: 'none'; products: [] };

function dedupeProducts(rows: readonly DemoProduct[]): DemoProduct[] {
  const seen = new Set<string>();
  const out: DemoProduct[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) {
      continue;
    }
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

function filterBySubcategory(
  products: readonly DemoProduct[],
  subcategoryName: string,
  parentName?: string,
): DemoProduct[] {
  return products.filter((product) => {
    const category = product.category?.trim();
    const subcategory = product.subcategory?.trim();
    if (!category || !subcategory) {
      return false;
    }
    if (parentName && !categoryLabelsEqual(category, parentName)) {
      return false;
    }
    return subcategoryLabelsMatch(subcategory, subcategoryName);
  });
}

/**
 * Map a Shop route (`category` id + optional parent/sub names) onto loaded catalogue products.
 *
 * Source of truth = product.Category / product.SubCategory from the catalogue API.
 * Never falls back to an unrelated shelf. Distinguishes empty vs invalid.
 */
export function resolveShopListing(input: ResolveShopListingInput): ResolveShopListingResult {
  const shelfId = input.shelfId?.trim();
  const parentName = input.parentName?.trim();
  const subcategoryName = input.subcategoryName?.trim();

  if (!shelfId && !subcategoryName && !parentName) {
    return { status: 'none', products: [] };
  }

  // 1) Exact shelf id from product-derived shelves.
  if (shelfId) {
    const exact = input.shelves.find((shelf) => shelf.id === shelfId);
    if (exact) {
      if (exact.products.length === 0) {
        return {
          status: 'empty',
          shelfId: exact.id,
          shelfName: subcategoryName || exact.name,
          products: [],
        };
      }
      return {
        status: 'matched',
        shelfId: exact.id,
        shelfName: subcategoryName || exact.name,
        products: [...exact.products],
      };
    }
  }

  // 2) Name-based membership (handles ERP SubCategory richer than browse taxonomy names).
  if (subcategoryName) {
    let matched = filterBySubcategory(input.products, subcategoryName, parentName);

    // No parent param: if matches span multiple parents, prefer the parent encoded in shelfId.
    if (!parentName && matched.length > 0 && shelfId) {
      const preferred = matched.filter((product) => {
        const category = product.category!.trim();
        const parentId = liveShelfIdForCategory(category);
        return shelfId === parentId || shelfId.startsWith(`${parentId}-`);
      });
      if (preferred.length > 0) {
        matched = preferred;
      } else {
        const parents = new Set(matched.map((product) => liveShelfIdForCategory(product.category!.trim())));
        if (parents.size > 1) {
          // Ambiguous across parents without a parent hint — do not guess.
          return { status: 'invalid', products: [] };
        }
      }
    }

    matched = dedupeProducts(matched);
    if (matched.length > 0) {
      const first = matched[0]!;
      const resolvedId =
        first.category && first.subcategory
          ? liveShelfIdForSubcategory(first.category, first.subcategory)
          : shelfId || liveShelfIdForCategory(first.category ?? subcategoryName);
      return {
        status: 'matched',
        shelfId: resolvedId,
        shelfName: subcategoryName,
        products: matched,
      };
    }

    // Browse target was explicit (sub name) but catalogue has no members yet.
    return {
      status: 'empty',
      shelfId,
      shelfName: subcategoryName,
      products: [],
    };
  }

  // 3) Parent-only request with no subcategory.
  if (parentName && !subcategoryName) {
    const parentProducts = dedupeProducts(
      input.products.filter((product) => {
        const category = product.category?.trim();
        return category ? categoryLabelsEqual(category, parentName) : false;
      }),
    );
    const parentId = liveShelfIdForCategory(parentName);
    if (parentProducts.length > 0) {
      return {
        status: 'matched',
        shelfId: parentId,
        shelfName: parentName,
        products: parentProducts,
      };
    }
    return { status: 'empty', shelfId: parentId, shelfName: parentName, products: [] };
  }

  // 4) Legacy id-only remap via unique subcategory slug suffix.
  if (shelfId) {
    const remapped = resolveShopShelfId(shelfId, input.shelves, input.products);
    if (remapped) {
      const shelf = input.shelves.find((row) => row.id === remapped);
      if (shelf) {
        return shelf.products.length > 0
          ? {
              status: 'matched',
              shelfId: shelf.id,
              shelfName: shelf.name,
              products: [...shelf.products],
            }
          : { status: 'empty', shelfId: shelf.id, shelfName: shelf.name, products: [] };
      }
    }
    return { status: 'invalid', products: [] };
  }

  return { status: 'invalid', products: [] };
}

/**
 * Map a Shop `category` route param onto a real product-derived shelf id.
 * Prefer {@link resolveShopListing} when parent/sub names are available.
 */
export function resolveShopShelfId(
  requestedId: string | undefined,
  shelves: readonly ShopShelf[],
  products: readonly DemoProduct[] = [],
): string | undefined {
  const requested = requestedId?.trim();
  if (!requested) {
    return undefined;
  }
  if (shelves.some((shelf) => shelf.id === requested)) {
    return requested;
  }

  const subMatches: { shelfId: string; subSlug: string }[] = [];
  const parentMatches = new Set<string>();

  for (const product of products) {
    const category = product.category?.trim();
    if (!category) {
      continue;
    }
    const parentId = liveShelfIdForCategory(category);
    if (requested === parentId) {
      parentMatches.add(parentId);
    }

    const subcategory = product.subcategory?.trim();
    if (!subcategory) {
      continue;
    }
    const shelfId = liveShelfIdForSubcategory(category, subcategory);
    if (requested === shelfId) {
      return shelfId;
    }
    const subSlug = slugPart(subcategory);
    if (!subSlug) {
      continue;
    }
    if (requested.endsWith(`-${subSlug}`) || requested === `live-${subSlug}`) {
      subMatches.push({ shelfId, subSlug });
    }
  }

  if (subMatches.length > 0) {
    const maxLen = Math.max(...subMatches.map((row) => row.subSlug.length));
    const longest = subMatches.filter((row) => row.subSlug.length === maxLen);
    const unique = new Set(longest.map((row) => row.shelfId));
    if (unique.size === 1) {
      return [...unique][0];
    }
    return undefined;
  }

  if (parentMatches.size === 1) {
    return [...parentMatches][0];
  }

  return undefined;
}
