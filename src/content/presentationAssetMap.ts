import type { ImageSource } from 'expo-image';

/**
 * Stable local asset map for presentation seed `imageAsset` paths.
 * Remote CDN URLs replace these only after approved storage upload.
 */
const ASSET_BY_PATH: Record<string, ImageSource> = {
  'assets/images/home/produce.jpg': require('@/assets/images/home/produce.jpg'),
  'assets/images/home/fresh-fruits.jpg': require('@/assets/images/home/fresh-fruits.jpg'),
  'assets/images/home/dairy-eggs.jpg': require('@/assets/images/home/dairy-eggs.jpg'),
  'assets/images/home/snacks-drinks.jpg': require('@/assets/images/home/snacks-drinks.jpg'),
  'assets/images/home/household.jpg': require('@/assets/images/home/household.jpg'),
  'assets/images/home/personal.jpg': require('@/assets/images/home/personal.jpg'),
  'assets/images/home/baby-care.jpg': require('@/assets/images/home/baby-care.jpg'),
  'assets/images/home/baby.jpg': require('@/assets/images/home/baby.jpg'),
  'assets/images/home/snacks.jpg': require('@/assets/images/home/snacks.jpg'),
  'assets/images/home/grains.jpg': require('@/assets/images/home/grains.jpg'),
  'assets/images/home/masala.jpg': require('@/assets/images/home/masala.jpg'),
  'assets/images/home/cooking-oil.jpg': require('@/assets/images/home/cooking-oil.jpg'),
  'assets/images/home/instant.jpg': require('@/assets/images/home/instant.jpg'),
  'assets/images/home/coriander.jpg': require('@/assets/images/home/coriander.jpg'),
  'assets/images/home/peppers.jpg': require('@/assets/images/home/peppers.jpg'),
  'assets/images/home/product-milk.jpg': require('@/assets/images/home/product-milk.jpg'),
  'assets/images/home/curd.jpg': require('@/assets/images/home/curd.jpg'),
  'assets/images/home/dairy.jpg': require('@/assets/images/home/dairy.jpg'),
  'assets/images/home/bakery.jpg': require('@/assets/images/home/bakery.jpg'),
  'assets/images/home/cereal.jpg': require('@/assets/images/home/cereal.jpg'),
  'assets/images/home/tea.jpg': require('@/assets/images/home/tea.jpg'),
  'assets/images/home/drinks.jpg': require('@/assets/images/home/drinks.jpg'),
  'assets/images/home/cleaning.jpg': require('@/assets/images/home/cleaning.jpg'),
  'assets/images/home/banner-produce.jpg': require('@/assets/images/home/banner-produce.jpg'),
  'assets/images/home/juices.jpg': require('@/assets/images/home/juices.jpg'),
};

const PLACEHOLDER: ImageSource = { uri: '' };

export function presentationImageForAsset(path: string | undefined): ImageSource {
  if (!path) {
    return PLACEHOLDER;
  }
  return ASSET_BY_PATH[path] ?? PLACEHOLDER;
}

export function knownPresentationAssetPaths(): string[] {
  return Object.keys(ASSET_BY_PATH);
}
