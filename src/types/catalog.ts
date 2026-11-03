import type { ImageSource } from 'expo-image';

export type DemoBrand = {
  id: string;
  name: string;
  image: ImageSource;
};

export type DemoProduct = {
  id: string;
  name: string;
  unit: string;
  price: number;
  compareAt?: number;
  discountLabel?: string;
  /** When false, ADD is blocked. Missing means in stock. */
  available?: boolean;
  /** Card photo. Also the first gallery image. */
  image: ImageSource;
  /** Two or more photos for the product page. */
  images: ImageSource[];
};
