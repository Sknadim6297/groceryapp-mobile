import { boughtAgain, recentProducts, recommendedProducts, spotlightProducts, topSelling } from '@/data/homeFeed';
import { mockProducts } from '@/data/mockProducts';
import { previewDryFruitProducts } from '@/data/previewImageCatalog';
import type { DemoProduct } from '@/types/catalog';

const catalog: readonly DemoProduct[] = [
  ...mockProducts,
  ...recommendedProducts,
  ...spotlightProducts,
  ...recentProducts,
  ...boughtAgain,
  ...topSelling,
];

export function findDemoProduct(id: string): DemoProduct | undefined {
  return catalog.find((product) => product.id === id) ?? previewDryFruitProducts().find((product) => product.id === id);
}
