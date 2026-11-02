import type { ImageSource } from 'expo-image';

import { listCatalogProducts } from '@/data/listCatalogProducts';
import { mockCategories } from '@/data/mockCategories';
import { previewCategoryById } from '@/data/previewImageCatalog';
import type { DemoProduct } from '@/types/catalog';
import type { Category } from '@/types/category';

/**
 * Groups the on-device catalogue into shop shelves.
 * GET /api/values/products still needs a company id and a published response,
 * so this does not invent prices, stock, or offers.
 */
const productCategory: Record<string, string> = {
  bananas: 'fruits',
  tomatoes: 'fruits',
  potatoes: 'fruits',
  apples: 'fruits',
  'recent-tomatoes': 'fruits',
  'recent-potatoes': 'fruits',
  coriander: 'fruits',
  'bought-onions': 'fruits',
  'top-onions': 'fruits',
  carrots: 'fruits',
  cauliflower: 'fruits',
  capsicum: 'fruits',
  eggs: 'dairy-eggs',
  'toned-milk': 'dairy-eggs',
  curd: 'dairy-eggs',
  basmati: 'grains',
  'cooking-oil': 'masala',
  'sunflower-oil': 'masala',
  toothpaste: 'personal',
  'preview-cashew': 'preview-dry-fruits',
  'preview-almonds': 'preview-dry-fruits',
  'preview-makhana': 'preview-dry-fruits',
};

const shelfOrder = ['fruits', 'grains', 'masala', 'dairy-eggs', 'preview-dry-fruits', 'snacks', 'personal', 'household', 'baby'];

const produce = require('@/assets/images/home/produce.jpg') as ImageSource;
const grainsImage = require('@/assets/images/home/grains.jpg') as ImageSource;

const localShelf: Record<string, Category> = {
  'preview-dry-fruits': {
    id: 'preview-dry-fruits',
    name: 'Dry Fruits & Cereals',
    image: grainsImage,
  },
  more: {
    id: 'more',
    name: 'More',
    image: produce,
  },
};

export type ShopShelf = Category & {
  products: DemoProduct[];
};

export function listShopShelves(requestedId?: string): ShopShelf[] {
  const grouped = new Map<string, DemoProduct[]>();
  const loose: DemoProduct[] = [];

  for (const product of listCatalogProducts()) {
    const categoryId = productCategory[product.id];
    if (!categoryId) {
      loose.push(product);
      continue;
    }
    const bucket = grouped.get(categoryId) ?? [];
    bucket.push(product);
    grouped.set(categoryId, bucket);
  }

  if (loose.length > 0) {
    grouped.set('more', loose);
  }

  const ids = new Set(grouped.keys());
  if (requestedId) {
    ids.add(requestedId);
  }

  return [...ids]
    .sort((left, right) => rank(left) - rank(right))
    .map((id) => ({
      ...resolveShelf(id),
      products: grouped.get(id) ?? [],
    }));
}

export function shopShelfById(id: string | undefined): ShopShelf | undefined {
  if (!id) {
    return undefined;
  }
  return listShopShelves(id).find((shelf) => shelf.id === id);
}

function rank(id: string): number {
  if (id === 'more') {
    return 1000;
  }
  const index = shelfOrder.indexOf(id);
  return index === -1 ? 500 : index;
}

function resolveShelf(id: string): Category {
  return (
    previewCategoryById(id) ??
    mockCategories.find((category) => category.id === id) ??
    localShelf[id] ?? {
      id,
      name: 'Category',
      image: produce,
    }
  );
}
