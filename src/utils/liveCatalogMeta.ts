import type { DemoBrand, DemoProduct } from '@/types/catalog';
import type { Category, LiveCategoryChild, LiveCategoryParent } from '@/types/category';

const PLACEHOLDER = { uri: '' } as const;

/** Stable shelf / category id from a live product Category string. */
export function liveShelfIdForCategory(category: string): string {
  return `live-${category.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/** Stable shelf id for a subcategory under a parent category. */
export function liveShelfIdForSubcategory(category: string, subcategory: string): string {
  return `live-${category.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${subcategory
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`;
}

export function liveBrandId(brand: string): string {
  return `brand-${brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function usableImage(source: DemoProduct['image'] | DemoProduct['categoryImage'] | undefined) {
  if (
    typeof source === 'object' &&
    source != null &&
    'uri' in source &&
    typeof source.uri === 'string' &&
    (/^https?:\/\//i.test(source.uri) || source.uri.startsWith('data:image/'))
  ) {
    return source;
  }
  return null;
}

/** Prefer lighter payloads for small category chips when both sources are inline Base64. */
function preferLighterImage(
  primary: DemoProduct['image'] | null,
  fallback: DemoProduct['image'] | null,
): DemoProduct['image'] | null {
  if (!primary) {
    return fallback;
  }
  if (!fallback) {
    return primary;
  }
  const primaryUri = typeof primary === 'object' && primary && 'uri' in primary ? primary.uri : '';
  const fallbackUri = typeof fallback === 'object' && fallback && 'uri' in fallback ? fallback.uri : '';
  if (
    typeof primaryUri === 'string' &&
    primaryUri.startsWith('data:image/') &&
    typeof fallbackUri === 'string' &&
    fallbackUri.startsWith('data:image/') &&
    primaryUri.length > 300_000 &&
    fallbackUri.length < primaryUri.length
  ) {
    return fallback;
  }
  return primary;
}

function pickCategoryImage(product: DemoProduct) {
  return (
    preferLighterImage(usableImage(product.categoryImage), usableImage(product.image)) ?? PLACEHOLDER
  );
}

function pickSubcategoryImage(product: DemoProduct, fallback: DemoProduct['image']) {
  const dedicated = usableImage(product.subcategoryImage);
  const productImage = usableImage(product.image);
  const parentFallback = usableImage(fallback);
  return preferLighterImage(dedicated, productImage) ?? parentFallback ?? PLACEHOLDER;
}

/**
 * Unique parent categories present on live products.
 * Prefers CategoryImage from the API when present.
 */
export function deriveLiveCategories(products: readonly DemoProduct[]): Category[] {
  return deriveLiveCategoryTree(products).map((parent) => ({
    id: parent.id,
    name: parent.name,
    image: parent.image,
  }));
}

/**
 * Category → subcategory tree from live products.
 * Dedicated categories API is not published yet — derived only from product fields.
 * When SubCategory is missing, each Category gets one shoppable child (same id) so Shop works.
 */
export function deriveLiveCategoryTree(products: readonly DemoProduct[]): LiveCategoryParent[] {
  const parents = new Map<
    string,
    {
      parent: LiveCategoryParent;
      children: Map<string, LiveCategoryChild>;
    }
  >();

  for (const product of products) {
    const categoryName = product.category?.trim();
    if (!categoryName) {
      continue;
    }
    const parentId = liveShelfIdForCategory(categoryName);
    let entry = parents.get(parentId);
    if (!entry) {
      entry = {
        parent: {
          id: parentId,
          name: titleCaseCategory(categoryName),
          image: pickCategoryImage(product),
          children: [],
        },
        children: new Map(),
      };
      parents.set(parentId, entry);
    } else if (entry.parent.image === PLACEHOLDER) {
      const nextImage = pickCategoryImage(product);
      if (nextImage !== PLACEHOLDER) {
        entry.parent.image = nextImage;
      }
    }

    const subcategoryName = product.subcategory?.trim();
    const childId = subcategoryName
      ? liveShelfIdForSubcategory(categoryName, subcategoryName)
      : parentId;
    const childName = subcategoryName ? titleCaseCategory(subcategoryName) : entry.parent.name;
    const childImage = pickSubcategoryImage(product, entry.parent.image);
    const existing = entry.children.get(childId);
    if (existing) {
      existing.productCount += 1;
      if (existing.image === PLACEHOLDER && childImage !== PLACEHOLDER) {
        existing.image = childImage;
      }
    } else {
      entry.children.set(childId, {
        id: childId,
        parentId,
        name: childName,
        image: childImage,
        productCount: 1,
      });
    }
  }

  return [...parents.values()]
    .map(({ parent, children }) => ({
      ...parent,
      children: [...children.values()].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Flat subcategory leaves for the “Shop by category” grid. */
export function deriveLiveSubcategories(products: readonly DemoProduct[]): LiveCategoryChild[] {
  return deriveLiveCategoryTree(products).flatMap((parent) => parent.children);
}

export function findLiveCategoryParent(
  products: readonly DemoProduct[],
  parentId: string | undefined,
): LiveCategoryParent | undefined {
  if (!parentId) {
    return undefined;
  }
  return deriveLiveCategoryTree(products).find((parent) => parent.id === parentId);
}

/**
 * Unique brands present on live products.
 * No brand logo API exists — mark image is a placeholder only.
 */
export function deriveLiveBrands(products: readonly DemoProduct[]): DemoBrand[] {
  const seen = new Map<string, DemoBrand>();
  for (const product of products) {
    const name = product.brand?.trim();
    if (!name) {
      continue;
    }
    const id = liveBrandId(name);
    if (seen.has(id)) {
      continue;
    }
    seen.set(id, { id, name, image: PLACEHOLDER });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type DailyEssentialTile = {
  id: string;
  name: string;
  image: Category['image'];
  /** Shop category param — live shelf id when derived from products. */
  categoryId: string;
};

/**
 * Daily Essentials tiles only for categories that actually appear on products.
 * Title-case label from the API Category string; no invented categories.
 */
export function deriveDailyEssentials(products: readonly DemoProduct[]): DailyEssentialTile[] {
  return deriveLiveCategories(products).map((category) => ({
    id: category.id,
    name: titleCaseCategory(category.name),
    image: category.image,
    categoryId: category.id,
  }));
}

export function titleCaseCategory(value: string): string {
  return value
    .toLowerCase()
    .split(/(&|\s+)/)
    .map((part) => {
      if (part === '&' || /^\s+$/.test(part)) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}
