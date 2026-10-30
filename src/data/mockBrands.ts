import type { DemoBrand } from '@/types/catalog';

/** Photos from assets/images/brand_images. These are not grocery suppliers or live inventory. */
export const mockBrands: DemoBrand[] = [
  {
    id: 'apple',
    name: 'Apple',
    image: require('@/assets/images/brand_images/apple.jpg'),
  },
  {
    id: 'nike',
    name: 'Nike',
    image: require('@/assets/images/brand_images/nike.jpg'),
  },
  {
    id: 'starbucks',
    name: 'Starbucks',
    image: require('@/assets/images/brand_images/starbucks.jpg'),
  },
  {
    id: 'mcdonalds',
    name: "McDonald's",
    image: require('@/assets/images/brand_images/mcdonalds.jpg'),
  },
  {
    id: 'burger-king',
    name: 'Burger King',
    image: require('@/assets/images/brand_images/burger-king.jpg'),
  },
  {
    id: 'lamborghini',
    name: 'Lamborghini',
    image: require('@/assets/images/brand_images/lamborghini.jpg'),
  },
];

export function findMockBrand(id: string | undefined): DemoBrand | undefined {
  if (!id) {
    return undefined;
  }

  return mockBrands.find((brand) => brand.id === id);
}
