import { boughtAgain, recentProducts, recommendedProducts, spotlightProducts, topSelling } from '@/data/homeFeed';
import { mockProducts } from '@/data/mockProducts';
import { previewDryFruitProducts } from '@/data/previewImageCatalog';
import type { DemoProduct } from '@/types/catalog';

export function listCatalogProducts(): DemoProduct[] {
  const merged = [
    ...mockProducts,
    ...recommendedProducts,
    ...spotlightProducts,
    ...recentProducts,
    ...boughtAgain,
    ...topSelling,
    ...previewDryFruitProducts(),
  ];
  const seen = new Set<string>();
  return merged.filter((product) => {
    if (seen.has(product.id)) {
      return false;
    }
    seen.add(product.id);
    return true;
  });
}

export function listBuyAgainProducts(): DemoProduct[] {
  return boughtAgain;
}
