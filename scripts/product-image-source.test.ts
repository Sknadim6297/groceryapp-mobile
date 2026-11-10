import {
  collectProductImageSources,
  MAX_INLINE_CATEGORY_IMAGE_CHARS,
  normalizeBoundedCategoryImageSource,
  normalizeProductImageSource,
  normalizeProductImageUri,
  recyclingKeyForImageUri,
} from '../src/utils/productImageSource';
import { mapProductRecord } from '../src/services/productsApi';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  // Valid Base64 JPEG (/9j/ magic)
  const jpeg = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgK';
  const jpegUri = normalizeProductImageUri(jpeg);
  assert(jpegUri != null && jpegUri.startsWith('data:image/jpeg;base64,'), 'jpeg data uri');
  assert(!jpegUri!.includes('data:image/jpeg;base64,data:'), 'no duplicate prefix');

  // Valid Base64 PNG
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  assert(normalizeProductImageUri(png)?.startsWith('data:image/png;base64,') === true, 'png');

  // Complete data URI — do not duplicate
  const full = 'data:image/jpeg;base64,/9j/4AAQ';
  assert(normalizeProductImageUri(full) === 'data:image/jpeg;base64,/9j/4AAQ', 'keep data uri');

  // HTTP URL
  assert(normalizeProductImageUri('https://cdn.example.com/a.jpg') === 'https://cdn.example.com/a.jpg', 'http');

  // Invalid cases
  assert(normalizeProductImageUri(null) === null, 'null');
  assert(normalizeProductImageUri('') === null, 'empty');
  assert(normalizeProductImageUri('System.Byte[]') === null, 'byte[]');
  assert(normalizeProductImageUri('202602271911231.jpg') === null, 'filename');
  assert(normalizeProductImageUri('not-valid!!!') === null, 'invalid');

  // Multiple images — Image1 primary
  const sources = collectProductImageSources({
    Image1: jpeg,
    Image2: png,
    Image3: '',
    Image4: 'System.Byte[]',
  });
  assert(sources.length === 2, `expected 2 sources, got ${sources.length}`);
  assert(
    typeof sources[0] === 'object' && sources[0] != null && 'uri' in sources[0] && String(sources[0].uri).includes('jpeg'),
    'Image1 primary jpeg',
  );

  const mapped = mapProductRecord({
    ProductId: 6,
    ProductName: 'Rice',
    SellingPrice: 210,
    MRP: 210,
    AvailableStock: 1,
    Image1: jpeg,
    Image2: png,
  });
  assert(mapped != null, 'mapped');
  assert(
    typeof mapped!.image === 'object' &&
      mapped!.image != null &&
      'uri' in mapped!.image &&
      String(mapped!.image.uri).startsWith('data:image/jpeg'),
    'card image is jpeg',
  );
  assert(mapped!.images.length >= 2, 'gallery has multiple without primaryOnly');

  const listMapped = mapProductRecord(
    {
      ProductId: 6,
      ProductName: 'Rice',
      SellingPrice: 210,
      Image1: jpeg,
      Image2: png,
    },
    { primaryImageOnly: true },
  );
  assert(listMapped != null, 'list mapped');
  assert(listMapped!.images.length === 1, 'list mode keeps Image1 only');

  const key = recyclingKeyForImageUri(jpegUri!);
  assert(!key.includes(jpeg.slice(0, 40)) || key.length < 120, 'recycling key stays short');
  assert(!key.startsWith('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD'), 'no full base64 in key');

  const source = normalizeProductImageSource(jpeg);
  assert(source != null && typeof source.cacheKey === 'string' && source.cacheKey.length > 0, 'cacheKey set');

  const replaced = normalizeProductImageUri(`${jpeg}AAAA`);
  assert(replaced != null, 'replaced uri');
  assert(
    recyclingKeyForImageUri(jpegUri!) !== recyclingKeyForImageUri(replaced!),
    'content change must change cache key',
  );

  const huge = 'A'.repeat(MAX_INLINE_CATEGORY_IMAGE_CHARS + 10);
  assert(normalizeBoundedCategoryImageSource(huge) === null, 'oversized inline category image dropped');
  assert(
    normalizeBoundedCategoryImageSource('https://cdn.example.com/category.png') != null,
    'category URL kept',
  );

  console.log('product-image-source.test.ts: ok');
}

run();
