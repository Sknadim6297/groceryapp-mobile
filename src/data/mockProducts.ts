import type { DemoProduct } from '@/types/catalog';

/** Display prices only. These are not live offers or confirmed stock. */
export const mockProducts: DemoProduct[] = [
  {
    id: 'bananas',
    name: 'Fresh Bananas',
    unit: '1 kg',
    price: 54,
    compareAt: 68,
    discountLabel: '20% OFF',
    image: require('@/assets/images/home/product-bananas.jpg'),
  },
  {
    id: 'toned-milk',
    name: 'DairyCo Toned Milk',
    unit: '1 L',
    price: 56,
    compareAt: 62,
    discountLabel: '10% OFF',
    image: require('@/assets/images/home/product-milk.jpg'),
  },
];
