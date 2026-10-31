import type { Category } from '@/types/category';
import type { DemoProduct } from '@/types/catalog';

/** Production stand-in. No third-party image URLs. */
export function previewCategoryCards(): Category[] {
  return [];
}

export function previewCategoryGroups(): { title: string; categories: Category[] }[] {
  return [];
}

export function previewDailyEssentialOverride(_id: string): { name: string; uri: string } | undefined {
  return undefined;
}

export function previewCategoryById(_id: string): Category | undefined {
  return undefined;
}

export function previewStoreCards(): { id: string; name: string; url: string }[] {
  return [];
}

export function previewDryFruitProducts(): DemoProduct[] {
  return [];
}

export function previewDeliveryIconUrl(): string {
  return '';
}
