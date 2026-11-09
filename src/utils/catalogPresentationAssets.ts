import type { ImageSource } from 'expo-image';

import type { LiveCategoryParent } from '@/types/category';

/**
 * Local presentation assets from the original frontend catalogue.
 * Used only as a fallback when the ERP record has no usable CategoryImage / SubcategoryImage.
 * Keys are normalized names (see `normalizeCatalogLabel`).
 *
 * This is NOT a second catalogue — products/fields still come from the live API.
 * A future CMS should replace these fallbacks with managed URLs (approval required).
 */

function normalizeCatalogLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Backend Field (Category) → local field artwork. */
const FIELD_ASSET_BY_NAME: Record<string, ImageSource> = {
  [normalizeCatalogLabel('GROCERIES & FOOD')]: require('@/assets/images/home/produce.jpg'),
  [normalizeCatalogLabel('CHOCOLATE')]: require('@/assets/images/home/snacks.jpg'),
  [normalizeCatalogLabel('HOUSEHOLD ESSENTIALS')]: require('@/assets/images/home/household.jpg'),
  [normalizeCatalogLabel('BEAUTY & PERSONAL CARE')]: require('@/assets/images/home/personal.jpg'),
  [normalizeCatalogLabel('Dairy & Eggs')]: require('@/assets/images/home/dairy-eggs.jpg'),
  [normalizeCatalogLabel('Fruits & Vegetables')]: require('@/assets/images/home/produce.jpg'),
  [normalizeCatalogLabel('Snacks & Beverages')]: require('@/assets/images/home/snacks-drinks.jpg'),
  [normalizeCatalogLabel('Baby Care')]: require('@/assets/images/home/baby-care.jpg'),
};

/**
 * Backend Subcategory (frontend “Category”) → local artwork.
 * Scoped optionally as `field||subcategory` then plain subcategory name.
 */
const CATEGORY_ASSET_BY_NAME: Record<string, ImageSource> = {
  [normalizeCatalogLabel('ATTA, RICE & GRAINS')]: require('@/assets/images/home/grains.jpg'),
  [normalizeCatalogLabel('DALS & PULSES')]: require('@/assets/images/home/masala.jpg'),
  [normalizeCatalogLabel('LAUNDRY DETERGENTS')]: require('@/assets/images/home/cleaning.jpg'),
  [normalizeCatalogLabel('HOUSEHOLD & TOILET CLEANERS')]: require('@/assets/images/home/cleaning.jpg'),
  [normalizeCatalogLabel('HOME & KITCHEN')]: require('@/assets/images/home/household.jpg'),
  [normalizeCatalogLabel('BATH & BODY')]: require('@/assets/images/home/personal.jpg'),
  [normalizeCatalogLabel('CHOCOLATE')]: require('@/assets/images/home/snacks.jpg'),
  [normalizeCatalogLabel('Bakery Products')]: require('@/assets/images/home/bakery.jpg'),
  [normalizeCatalogLabel('Bakery & Biscuits')]: require('@/assets/images/home/bakery.jpg'),
  [normalizeCatalogLabel('Tea, Coffee & Drink Mixes')]: require('@/assets/images/home/tea.jpg'),
  [normalizeCatalogLabel('Tea, Coffee & Milk Drinks')]: require('@/assets/images/home/tea.jpg'),
  [normalizeCatalogLabel('Juices & Cold Drinks')]: require('@/assets/images/home/drinks.jpg'),
  [normalizeCatalogLabel('Drinks & Juices')]: require('@/assets/images/home/juices.jpg'),
  [normalizeCatalogLabel('Cereals & Breakfast')]: require('@/assets/images/home/cereal.jpg'),
  [normalizeCatalogLabel('Dry Fruits & Cereals')]: require('@/assets/images/home/grains.jpg'),
  [normalizeCatalogLabel('Chips & Biscuits')]: require('@/assets/images/home/snacks.jpg'),
  [normalizeCatalogLabel('Chips & Namkeen')]: require('@/assets/images/home/snacks-drinks.jpg'),
  [normalizeCatalogLabel('Indian Snacks')]: require('@/assets/images/home/snacks.jpg'),
  [normalizeCatalogLabel('Chocolates & Sweets')]: require('@/assets/images/home/snacks.jpg'),
  [normalizeCatalogLabel('Sweets & Chocolates')]: require('@/assets/images/home/snacks.jpg'),
  [normalizeCatalogLabel('Noodles & Pasta')]: require('@/assets/images/home/instant.jpg'),
  [normalizeCatalogLabel('Instant Food')]: require('@/assets/images/home/instant.jpg'),
  [normalizeCatalogLabel('Sauces & Spreads')]: require('@/assets/images/home/masala.jpg'),
  [normalizeCatalogLabel('Dairy, Bread & Eggs')]: require('@/assets/images/home/dairy-eggs.jpg'),
  [normalizeCatalogLabel('Oil, Ghee & Masala')]: require('@/assets/images/home/masala.jpg'),
  [normalizeCatalogLabel('Cleaners & Repellents')]: require('@/assets/images/home/cleaning.jpg'),
};

export { normalizeCatalogLabel };

export function localFieldImage(fieldName: string): ImageSource | null {
  return FIELD_ASSET_BY_NAME[normalizeCatalogLabel(fieldName)] ?? null;
}

export function localCategoryImage(categoryName: string, fieldName?: string): ImageSource | null {
  if (fieldName) {
    const scoped = CATEGORY_ASSET_BY_NAME[`${normalizeCatalogLabel(fieldName)}||${normalizeCatalogLabel(categoryName)}`];
    if (scoped) {
      return scoped;
    }
  }
  return CATEGORY_ASSET_BY_NAME[normalizeCatalogLabel(categoryName)] ?? null;
}

/**
 * Prefer live ERP image, then a curated local asset, then empty placeholder.
 * Never invents product prices/stock — presentation only.
 */
export function resolvePresentationImage(
  live: ImageSource | undefined,
  fallbackLocal: ImageSource | null,
): ImageSource {
  if (
    typeof live === 'object' &&
    live != null &&
    'uri' in live &&
    typeof live.uri === 'string' &&
    live.uri.trim().length > 0 &&
    (/^https?:\/\//i.test(live.uri) || live.uri.startsWith('data:image/'))
  ) {
    return live;
  }
  return fallbackLocal ?? { uri: '' };
}

/** Apply local Field / Category artwork only where the ERP left images empty. */
export function enrichLiveCategoryTreePresentation(
  tree: readonly LiveCategoryParent[],
): LiveCategoryParent[] {
  return tree.map((parent) => ({
    ...parent,
    image: resolvePresentationImage(parent.image, localFieldImage(parent.name)),
    children: parent.children.map((child) => ({
      ...child,
      image: resolvePresentationImage(child.image, localCategoryImage(child.name, parent.name)),
    })),
  }));
}
