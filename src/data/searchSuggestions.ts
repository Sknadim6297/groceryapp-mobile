import type { ImageSource } from 'expo-image';

import { listCatalogProducts } from '@/data/listCatalogProducts';
import { productDetailCopy } from '@/data/productDetails';
import { listShopShelves, type ShopShelf } from '@/data/shopCatalog';
import type { DemoProduct } from '@/types/catalog';

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

type SearchCatalog = {
  products?: readonly DemoProduct[];
  shelves?: readonly ShopShelf[];
};

export function searchSuggestions(raw: string, catalog?: SearchCatalog): SearchSuggestion[] {
  const needle = raw.trim().toLowerCase();
  if (needle.length === 0) {
    return [];
  }

  const shelves = catalog?.shelves ?? listShopShelves();
  const catalogue = catalog?.products ?? listCatalogProducts();
  const productShelf = new Map<string, { id: string; name: string }>();
  for (const shelf of shelves) {
    for (const product of shelf.products) {
      productShelf.set(product.id, { id: shelf.id, name: shelf.name });
    }
  }

  const products: SearchSuggestion[] = [];
  for (const product of catalogue) {
    const brand = product.brand?.trim() || productDetailCopy(product).brand;
    const category = productShelf.get(product.id) ?? null;
    const categoryName = category?.name ?? product.category ?? '';
    const subcategoryName = product.subcategory?.trim() ?? '';
    const haystack = `${product.name} ${product.unit} ${brand} ${categoryName} ${subcategoryName}`
      .toLowerCase()
      .replace(/\s+/g, ' ');
    if (!haystack.includes(needle.replace(/\s+/g, ' '))) {
      continue;
    }
    products.push({
      key: `product:${product.id}`,
      kind: 'product',
      title: product.name,
      subtitle: categoryName ? `in ${categoryName}` : null,
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
  for (const product of catalogue) {
    // Catalogue Brand field only — never invent brands from demo copy.
    const brand = product.brand?.trim();
    if (!brand) {
      continue;
    }
    const key = brand.toLowerCase().replace(/\s+/g, ' ');
    if (seenBrands.has(key) || !key.includes(needle.replace(/\s+/g, ' '))) {
      continue;
    }
    seenBrands.add(key);
    brands.push({
      key: `brand:${key}`,
      kind: 'brand',
      title: brand,
      subtitle: 'in Brands',
      image: { uri: '' },
    });
  }

  return [...categories, ...brands, ...products].slice(0, LIMIT);
}
