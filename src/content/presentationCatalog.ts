import seed from '../../content/seed/presentation-catalog.json';

import type { DemoProduct } from '@/types/catalog';
import { presentationImageForAsset } from '@/content/presentationAssetMap';
import type {
  PresentationBanner,
  PresentationCatalogSeed,
  PresentationCategory,
  PresentationField,
  PresentationTreeParent,
} from '@/content/presentationCatalogTypes';
import { normalizeCatalogLabel } from '@/utils/normalizeCatalogLabel';
import { liveShelfIdForCategory, liveShelfIdForSubcategory } from '@/utils/liveCatalogMeta';

const catalog = seed as PresentationCatalogSeed;

export function getPresentationCatalogSeed(): PresentationCatalogSeed {
  return catalog;
}

export function listActivePresentationFields(): PresentationField[] {
  return catalog.fields
    .filter((field) => field.active)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((field) => ({
      ...field,
      image: presentationImageForAsset(field.imageAsset),
    }));
}

export function listActivePresentationCategories(fieldId?: string): PresentationCategory[] {
  return catalog.categories
    .filter((category) => category.active && (!fieldId || category.fieldId === fieldId))
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((category) => ({
      ...category,
      image: presentationImageForAsset(category.imageAsset),
      productCount: 0,
    }));
}

export function listActivePresentationBanners(): PresentationBanner[] {
  return catalog.banners
    .filter((banner) => banner.active)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((banner) => ({
      ...banner,
      image: presentationImageForAsset(banner.imageAsset),
    }));
}

export function findPresentationField(id: string | undefined): PresentationField | undefined {
  if (!id) {
    return undefined;
  }
  return listActivePresentationFields().find((field) => field.id === id);
}

export function findPresentationCategory(id: string | undefined): PresentationCategory | undefined {
  if (!id) {
    return undefined;
  }
  return listActivePresentationCategories().find((category) => category.id === id);
}

function aliasSet(aliases: readonly string[]): Set<string> {
  return new Set(aliases.map((alias) => normalizeCatalogLabel(alias)));
}

export function productMatchesAliases(
  product: DemoProduct,
  aliases: readonly string[],
  mode: 'field' | 'category',
): boolean {
  const needles = aliasSet(aliases);
  if (needles.size === 0) {
    return false;
  }
  if (mode === 'field') {
    const category = product.category?.trim();
    return Boolean(category && needles.has(normalizeCatalogLabel(category)));
  }
  const subcategory = product.subcategory?.trim();
  const category = product.category?.trim();
  if (subcategory && needles.has(normalizeCatalogLabel(subcategory))) {
    return true;
  }
  // Some ERP rows only populate Category; allow exact alias match there too.
  return Boolean(category && needles.has(normalizeCatalogLabel(category)));
}

export function countProductsForPresentationCategory(
  products: readonly DemoProduct[],
  category: Pick<PresentationCategory, 'erpAliases'>,
): number {
  return products.filter((product) => productMatchesAliases(product, category.erpAliases, 'category')).length;
}

/** Build Home Field → Category tree from CMS seed, with live product counts. */
export function buildPresentationCategoryTree(
  products: readonly DemoProduct[] = [],
): PresentationTreeParent[] {
  const fields = listActivePresentationFields();
  return fields.map((field) => {
    const children = listActivePresentationCategories(field.id).map((category) => ({
      id: category.id,
      parentId: field.id,
      name: category.name,
      image: category.image,
      productCount: countProductsForPresentationCategory(products, category),
      erpAliases: category.erpAliases,
    }));
    return {
      id: field.id,
      name: field.name,
      image: field.image,
      erpAliases: field.erpAliases,
      children,
    };
  });
}

/**
 * Prefer an existing live shelf id when products match aliases,
 * otherwise keep the presentation id (shop shows an empty honest shelf).
 */
export function resolveShopCategoryIdForPresentation(
  categoryId: string,
  products: readonly DemoProduct[],
): string {
  const category = findPresentationCategory(categoryId);
  if (!category) {
    return categoryId;
  }
  for (const product of products) {
    if (!productMatchesAliases(product, category.erpAliases, 'category')) {
      continue;
    }
    const fieldName = product.category?.trim();
    const subcategory = product.subcategory?.trim();
    if (fieldName && subcategory) {
      return liveShelfIdForSubcategory(fieldName, subcategory);
    }
    if (fieldName) {
      return liveShelfIdForCategory(fieldName);
    }
  }
  return category.id;
}

export function productsForPresentationCategory(
  products: readonly DemoProduct[],
  categoryId: string,
): DemoProduct[] {
  const category = findPresentationCategory(categoryId);
  if (!category) {
    return [];
  }
  return products.filter((product) => productMatchesAliases(product, category.erpAliases, 'category'));
}
