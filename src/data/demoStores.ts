import type { ImageSource } from 'expo-image';

export type DemoStore = {
  id: string;
  name: string;
  area: string;
  distanceLabel: string;
  openLabel: string;
  ratingLabel: string;
  image: ImageSource;
  detail: string;
};

const produce = require('@/assets/images/home/produce.jpg') as ImageSource;
const market = require('@/assets/images/home/banner-produce.jpg') as ImageSource;

/** Fictional nearby stores for UI listing only. */
export const DEMO_STORES: readonly DemoStore[] = [
  {
    id: 'store-mayapur-central',
    name: 'Mayapur Central Mart',
    area: 'Mayapur Main Road',
    distanceLabel: '0.8 km',
    openLabel: 'Open · Demo hours 7 AM–10 PM',
    ratingLabel: '4.6',
    image: produce,
    detail: 'Preview store. Inventory and hours are fictional for UI development.',
  },
  {
    id: 'store-goshala',
    name: 'Goshala Fresh Hub',
    area: 'Near Goshala Gate',
    distanceLabel: '1.4 km',
    openLabel: 'Open · Demo hours 6 AM–9 PM',
    ratingLabel: '4.4',
    image: market,
    detail: 'Preview store. No live catalogue sync.',
  },
];

export function findDemoStore(id: string): DemoStore | undefined {
  return DEMO_STORES.find((store) => store.id === id);
}
