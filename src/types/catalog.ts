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
  image: ImageSource;
};
