import { listCatalogProducts } from '@/data/listCatalogProducts';
import { productDetailCopy } from '@/data/productDetails';
import { listShopShelves, type ShopShelf } from '@/data/shopCatalog';
import type { DemoProduct } from '@/types/catalog';
import type {
  CollectionProduct,
  ShoppingCollectionChip,
  ShoppingCollectionDefinition,
  ShoppingCollectionId,
} from '@/types/shoppingCollection';
import {
  chipIdsForCollectionProduct,
  productBelongsToCollection,
} from '@/utils/shoppingCollectionMatch';

/**
 * Home quick-shop collections.
 * Products are resolved only from the on-device catalogue — never invented here.
 * Diwali is a seasonal collection flag (`DIWALI_SEASON_ACTIVE`).
 */

/** Flip to false to hide Diwali from Home tabs and show the seasonal empty state. */
export const DIWALI_SEASON_ACTIVE = true;

const DEFINITIONS: Record<ShoppingCollectionId, ShoppingCollectionDefinition> = {
  all: {
    id: 'all',
    title: 'All Products',
    subtitle: 'Everything you need, in one place.',
    icon: 'grid',
    heroTone: 'warm',
    emptyTitle: 'No products yet',
    emptyBody: 'The catalogue is empty right now. Browse again once products are available.',
  },
  fresh: {
    id: 'fresh',
    title: 'Fresh Essentials',
    subtitle: 'Fresh picks for everyday living.',
    icon: 'leaf',
    heroTone: 'fresh',
    emptyTitle: 'No fresh picks yet',
    emptyBody: 'Fresh vegetables, fruits, dairy and eggs will appear here when they are in the catalogue.',
  },
  diwali: {
    id: 'diwali',
    title: 'Diwali Special',
    subtitle: 'Celebrate with festive essentials.',
    icon: 'flame',
    heroTone: 'festive',
    seasonActive: DIWALI_SEASON_ACTIVE,
    badgeLabel: 'Shop now',
    emptyTitle: 'Festive collection is resting',
    emptyBody:
      'Diwali Special is a seasonal shelf. When festive dry fruits, snacks and sweets are listed, they will show up here.',
  },
  electronics: {
    id: 'electronics',
    title: 'Electronics',
    subtitle: 'Everyday tech and home essentials.',
    icon: 'plug',
    heroTone: 'cool',
    emptyTitle: 'No electronics listed yet',
    emptyBody:
      'Chargers, kitchen electronics and home appliances will appear here when they are published in the catalogue.',
  },
  organic: {
    id: 'organic',
    title: 'Organic Essentials',
    subtitle: 'Thoughtfully sourced everyday choices.',
    icon: 'plant',
    heroTone: 'organic',
    emptyTitle: 'No organic items yet',
    emptyBody: 'Only products marked organic in the catalogue appear here — nothing is labelled organic without that signal.',
  },
};

export const HOME_SHOPPING_SHORTCUTS: readonly ShoppingCollectionId[] = [
  'all',
  'fresh',
  'diwali',
  'electronics',
  'organic',
];

export function isShoppingCollectionId(value: string | undefined): value is ShoppingCollectionId {
  return value === 'all' || value === 'fresh' || value === 'diwali' || value === 'electronics' || value === 'organic';
}

export function getShoppingCollection(id: string | undefined): ShoppingCollectionDefinition | null {
  if (!isShoppingCollectionId(id)) {
    return null;
  }
  return DEFINITIONS[id];
}

/** Shortcuts shown on Home — seasonal Diwali hides when inactive. */
export function listVisibleHomeShoppingShortcuts(): ShoppingCollectionDefinition[] {
  return HOME_SHOPPING_SHORTCUTS.map((id) => DEFINITIONS[id]).filter((definition) => {
    if (definition.id === 'diwali' && definition.seasonActive === false) {
      return false;
    }
    return true;
  });
}

function shelfIdForProduct(productId: string, shelves: readonly ShopShelf[]): string | undefined {
  for (const shelf of shelves) {
    if (shelf.products.some((product) => product.id === productId)) {
      return shelf.id;
    }
  }
  return undefined;
}

/**
 * Resolves catalogue products for a collection.
 * Pass live `products`/`shelves` from CatalogContext when the API catalogue is connected.
 * Electronics / inactive Diwali may correctly return an empty list.
 */
export function listCollectionProducts(
  collectionId: ShoppingCollectionId,
  catalogue: readonly DemoProduct[] = listCatalogProducts(),
  shelves: readonly ShopShelf[] = listShopShelves(),
): CollectionProduct[] {
  const definition = DEFINITIONS[collectionId];
  const diwaliSeasonActive = definition.seasonActive !== false;

  const seen = new Set<string>();
  const out: CollectionProduct[] = [];

  for (const product of catalogue) {
    if (seen.has(product.id)) {
      continue;
    }
    const shelfId = shelfIdForProduct(product.id, shelves);
    const brand = product.brand?.trim() || productDetailCopy(product).brand;
    const include = productBelongsToCollection({
      collectionId,
      shelfId,
      productName: product.name,
      brand,
      diwaliSeasonActive,
      category: product.category,
    });
    if (!include) {
      continue;
    }
    seen.add(product.id);
    out.push({
      ...product,
      shelfId,
      chipIds: chipIdsForCollectionProduct({
        collectionId,
        shelfId,
        productName: product.name,
      }),
    });
  }

  return out;
}

export function listCollectionChips(
  collectionId: ShoppingCollectionId,
  products: readonly CollectionProduct[],
): ShoppingCollectionChip[] {
  const chips: ShoppingCollectionChip[] = [{ id: 'all', label: 'All' }];
  const counts = new Map<string, number>();

  for (const product of products) {
    for (const chipId of product.chipIds) {
      counts.set(chipId, (counts.get(chipId) ?? 0) + 1);
    }
  }

  const labelFor = (id: string): string => {
    switch (id) {
      case 'fruits':
        return 'Fruits & Veg';
      case 'dairy-eggs':
        return 'Dairy & Eggs';
      case 'dry-fruits':
        return 'Dry Fruits';
      case 'snacks':
        return 'Snacks';
      case 'sweets':
        return 'Sweets';
      case 'festive':
        return 'Festive';
      case 'preview-electronics':
        return 'Gadgets';
      case 'preview-kitchen':
        return 'Kitchen';
      case 'more':
        return 'More';
      default: {
        const shelf = listShopShelves().find((item) => item.id === id);
        return shelf?.name ?? id;
      }
    }
  };

  const preferredOrder =
    collectionId === 'fresh'
      ? ['fruits', 'dairy-eggs']
      : collectionId === 'diwali'
        ? ['dry-fruits', 'snacks', 'sweets', 'festive']
        : collectionId === 'electronics'
          ? ['preview-electronics', 'preview-kitchen']
          : [...counts.keys()].sort();

  for (const id of preferredOrder) {
    const count = counts.get(id) ?? 0;
    if (count === 0) {
      continue;
    }
    chips.push({ id, label: labelFor(id) });
  }

  for (const id of counts.keys()) {
    if (chips.some((chip) => chip.id === id)) {
      continue;
    }
    chips.push({ id, label: labelFor(id) });
  }

  return chips;
}

export function filterCollectionByChip(
  products: readonly CollectionProduct[],
  chipId: string,
): CollectionProduct[] {
  if (chipId === 'all') {
    return [...products];
  }
  return products.filter((product) => product.chipIds.includes(chipId));
}
