import type { CatalogSubcategory } from '@/types/subcategory';

export function filterSubcategories(items: CatalogSubcategory[], query: string): CatalogSubcategory[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return items;
  }
  return items.filter((item) => item.name.toLowerCase().includes(needle));
}

export function formatItemCount(count: number): string {
  if (count <= 0) {
    return 'Browse items';
  }
  return count === 1 ? '1 item' : `${count} items`;
}
