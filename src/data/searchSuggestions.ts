import type { ImageSource } from 'expo-image';

import { listCatalogProducts } from '@/data/listCatalogProducts';
import { mockBrands } from '@/data/mockBrands';
import { productDetailCopy } from '@/data/productDetails';
import { listShopShelves } from '@/data/shopCatalog';

export type SearchSuggestion = {
  key: string;
  kind: 'product' | 'category' | 'brand';
  title: string;
  subtitle: string | null;
  image: ImageSource;
  productId?: string;
  categoryId?: string;
};

const LIMIT = 8;

export function searchSuggestions(raw: string): SearchSuggestion[] {
  const needle = raw.trim().toLowerCase();
  if (needle.length === 0) {
    return [];
  }

  const shelves = listShopShelves();
  const productShelf = new Map<string, { id: string; name: string }>();
  for (const shelf of shelves) {
    for (const product of shelf.products) {
      productShelf.set(product.id, { id: shelf.id, name: shelf.name });
    }
  }

  const products: SearchSuggestion[] = [];
  for (const product of listCatalogProducts()) {
    const brand = productDetailCopy(product).brand;
    const category = productShelf.get(product.id) ?? null;
    const haystack = `${product.name} ${product.unit} ${brand} ${category?.name ?? ''}`.toLowerCase();
    if (!haystack.includes(needle)) {
      continue;
    }
    products.push({
      key: `product:${product.id}`,
      kind: 'product',
      title: product.name,
      subtitle: category ? `in ${category.name}` : null,
      image: product.image,
      productId: product.id,
      categoryId: category?.id,
    });
    if (products.length >= LIMIT) {
      break;
    }
  }

  const categories: SearchSuggestion[] = [];
  for (const shelf of shelves) {
    if (shelf.products.length === 0 || !shelf.name.toLowerCase().includes(needle)) {
      continue;
    }
    categories.push({
      key: `category:${shelf.id}`,
      kind: 'category',
      title: shelf.name,
      subtitle: 'in Categories',
      image: shelf.image,
      categoryId: shelf.id,
    });
  }

  const brands: SearchSuggestion[] = [];
  const seenBrands = new Set<string>();
  for (const product of listCatalogProducts()) {
    const brand = productDetailCopy(product).brand;
    const key = brand.toLowerCase();
    if (key === 'fresh basket' || seenBrands.has(key) || !key.includes(needle)) {
      continue;
    }
    seenBrands.add(key);
    brands.push({
      key: `brand:${key}`,
      kind: 'brand',
      title: brand,
      subtitle: 'in Brands',
      image: product.image,
    });
  }
  for (const brand of mockBrands) {
    const key = brand.name.toLowerCase();
    if (seenBrands.has(key) || !key.includes(needle)) {
      continue;
    }
    seenBrands.add(key);
    brands.push({
      key: `brand:${brand.id}`,
      kind: 'brand',
      title: brand.name,
      subtitle: 'in Brands',
      image: brand.image,
    });
  }

  return [...categories, ...brands, ...products].slice(0, LIMIT);
}
