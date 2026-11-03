import type { ImageSource } from 'expo-image';

/** Parent department shown in the Subcategories breadcrumb. */
export type CatalogParentCategory = {
  id: string;
  name: string;
  image: ImageSource;
};

/**
 * Leaf shelf under a parent. `id` matches the existing shop shelf / Category id
 * so product listing can reuse `/shop?category=`.
 */
export type CatalogSubcategory = {
  id: string;
  parentId: string;
  name: string;
  image: ImageSource;
  /** Honest count from the on-device catalogue shelf (may be 0). */
  productCount: number;
  order: number;
  visible: boolean;
};
