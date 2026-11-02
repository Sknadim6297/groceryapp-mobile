import type { ImageSource } from 'expo-image';

import type { DemoProduct } from '@/types/catalog';

/** Gallery photos, always at least the card image. */
export function productPhotos(product: DemoProduct): ImageSource[] {
  const photos = product.images?.length ? product.images : [product.image];
  return photos.length > 0 ? photos : [product.image];
}
