import type { ImageSource } from 'expo-image';

import type { DemoProduct } from '@/types/catalog';

function isUsableSource(source: ImageSource | null | undefined): source is ImageSource {
  if (source == null) {
    return false;
  }
  if (typeof source === 'number') {
    return true;
  }
  if (typeof source !== 'object') {
    return false;
  }
  if (!('uri' in source) || typeof source.uri !== 'string') {
    return false;
  }
  return source.uri.trim().length > 0;
}

/** Gallery photos with invalid/empty URIs dropped. Falls back to the card image when possible. */
export function productPhotos(product: DemoProduct): ImageSource[] {
  const fromGallery = (product.images ?? []).filter(isUsableSource);
  if (fromGallery.length > 0) {
    return fromGallery;
  }
  return isUsableSource(product.image) ? [product.image] : [];
}
