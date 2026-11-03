import type { ImageSource } from 'expo-image';

import { mockCategories } from '@/data/mockCategories';
import { shopShelfById } from '@/data/shopCatalog';
import type { Category } from '@/types/category';
import type { CatalogParentCategory, CatalogSubcategory } from '@/types/subcategory';
import { filterSubcategories, formatItemCount } from '@/utils/subcategorySearch';

export { filterSubcategories, formatItemCount };

/**
 * Temporary local parent → subcategory adapter.
 * The published C# help page has no subcategory endpoints yet, so this derives
 * hierarchy from preview groups when Metro can load them, otherwise from mockCategories.
 * Product counts come from existing shop shelves — never invented.
 */

type ParentSeed = {
  id: string;
  name: string;
  image: ImageSource;
  childIds: string[];
};

const produce = require('@/assets/images/home/produce.jpg') as ImageSource;
const snacksImage = require('@/assets/images/home/snacks-drinks.jpg') as ImageSource;
const personalImage = require('@/assets/images/home/personal.jpg') as ImageSource;
const householdImage = require('@/assets/images/home/household.jpg') as ImageSource;

const LOCAL_PARENTS: ParentSeed[] = [
  {
    id: 'groceries',
    name: 'Groceries',
    image: produce,
    childIds: ['fruits', 'dairy-eggs', 'grains', 'masala'],
  },
  {
    id: 'snacks-drinks',
    name: 'Snacks & Drinks',
    image: snacksImage,
    childIds: ['snacks'],
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    image: personalImage,
    childIds: ['personal', 'baby'],
  },
  {
    id: 'home-care',
    name: 'Home Care',
    image: householdImage,
    childIds: ['household'],
  },
];

function slugParentId(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function categoryMap(): Map<string, Category> {
  const map = new Map<string, Category>();
  for (const category of mockCategories) {
    map.set(category.id, category);
  }
  return map;
}

function readPreviewGroups(): { title: string; categories: Category[] }[] {
  try {
    // Metro may resolve the stub; Node scripts can fail on CDN/image modules — fall back locally.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const catalog = require('./previewImageCatalog') as {
      previewCategoryGroups?: () => { title: string; categories: Category[] }[];
    };
    return catalog.previewCategoryGroups?.() ?? [];
  } catch {
    return [];
  }
}

function stableParentId(title: string): string {
  const normalized = title.trim().toLowerCase();
  if (normalized.includes('grocery') || normalized.includes('kitchen')) {
    return 'groceries';
  }
  if (normalized.includes('snack') || normalized.includes('drink')) {
    return 'snacks-drinks';
  }
  if (normalized.includes('beauty') || normalized.includes('personal')) {
    return 'personal-care';
  }
  if (normalized.includes('household') || normalized.includes('home')) {
    return 'home-care';
  }
  return slugParentId(title) || 'catalogue';
}

function parentSeeds(): ParentSeed[] {
  const groups = readPreviewGroups();
  if (groups.length === 0) {
    return LOCAL_PARENTS;
  }

  // Keep stable ids (groceries, …) so Home deep-links and mock navigation stay consistent
  // when preview groups expand the child shelves.
  return groups.map((group) => {
    const id = stableParentId(group.title);
    const local = LOCAL_PARENTS.find((entry) => entry.id === id);
    return {
      id,
      name: group.title,
      image: group.categories[0]?.image ?? local?.image ?? produce,
      childIds: group.categories.map((category) => category.id),
    };
  });
}

function resolveChild(categoryId: string, lookup: Map<string, Category>): Category | undefined {
  const fromPreview = readPreviewGroups()
    .flatMap((group) => group.categories)
    .find((category) => category.id === categoryId);
  if (fromPreview) {
    return fromPreview;
  }
  return lookup.get(categoryId);
}

function buildSubcategory(child: Category, parentId: string, order: number): CatalogSubcategory {
  const shelf = shopShelfById(child.id);
  return {
    id: child.id,
    parentId,
    name: child.name,
    image: child.image,
    productCount: shelf?.products.length ?? 0,
    order,
    visible: true,
  };
}

/** All visible parent departments. */
export function listCatalogParents(): CatalogParentCategory[] {
  return parentSeeds().map((seed) => ({
    id: seed.id,
    name: seed.name,
    image: seed.image,
  }));
}

export function findCatalogParent(parentId: string | undefined): CatalogParentCategory | undefined {
  if (!parentId) {
    return undefined;
  }
  return listCatalogParents().find((parent) => parent.id === parentId);
}

/** Subcategories for a parent. Empty when the parent id is unknown. */
export function listSubcategoriesForParent(parentId: string | undefined): CatalogSubcategory[] {
  if (!parentId) {
    return [];
  }
  const seed = parentSeeds().find((entry) => entry.id === parentId);
  if (!seed) {
    return [];
  }
  const lookup = categoryMap();
  return seed.childIds
    .map((childId, index) => {
      const child = resolveChild(childId, lookup);
      if (!child) {
        return null;
      }
      return buildSubcategory(child, seed.id, index);
    })
    .filter((entry): entry is CatalogSubcategory => entry !== null && entry.visible);
}

/**
 * Resolves which parent screen to open for a leaf category id (or a parent id).
 * Used by Home category cards.
 */
export function resolveParentIdForCategory(categoryId: string | undefined): string | null {
  if (!categoryId) {
    return null;
  }
  const seeds = parentSeeds();
  if (seeds.some((seed) => seed.id === categoryId)) {
    return categoryId;
  }
  const owning = seeds.find((seed) => seed.childIds.includes(categoryId));
  return owning?.id ?? null;
}
