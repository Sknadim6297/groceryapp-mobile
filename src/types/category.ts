import type { ImageSource } from 'expo-image';

export type Category = {
  id: string;
  name: string;
  image: ImageSource;
};

/** Parent department derived from live product Category (or future categories API). */
export type LiveCategoryParent = {
  id: string;
  name: string;
  image: ImageSource;
  children: LiveCategoryChild[];
};

/**
 * Shop leaf under a parent.
 * When SubCategory is missing, one child mirrors the parent Category so Shop still works.
 */
export type LiveCategoryChild = {
  id: string;
  parentId: string;
  name: string;
  image: ImageSource;
  productCount: number;
};
