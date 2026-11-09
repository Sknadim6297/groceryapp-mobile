import { mapProductRecord } from '../src/services/productsApi';
import {
  deriveDailyEssentials,
  deriveLiveBrands,
  deriveLiveCategories,
  liveShelfIdForCategory,
} from '../src/utils/liveCatalogMeta';
import { buildHomeCatalogueSections } from '../src/utils/homeCatalogueSections';

async function run() {
  const response = await fetch('https://api.supertrading.online/api/values/products?company=8787888888');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const body: unknown = await response.json();
  if (!Array.isArray(body)) {
    throw new Error('Expected array');
  }

  const products = body
    .map((item) => mapProductRecord(item))
    .filter((item): item is NonNullable<typeof item> => item != null);

  if (products.length !== 9) {
    throw new Error(`Expected 9 products, got ${products.length}`);
  }

  const categories = deriveLiveCategories(products);
  const brands = deriveLiveBrands(products);
  const daily = deriveDailyEssentials(products);
  const sections = buildHomeCatalogueSections(products);

  if (categories.length === 0) {
    throw new Error('Expected derived categories');
  }
  if (!categories.some((c) => c.id === liveShelfIdForCategory('GROCERIES & FOOD'))) {
    throw new Error('Missing GROCERIES & FOOD category');
  }
  if (brands.length === 0) {
    throw new Error('Expected derived brands');
  }
  if (!brands.some((b) => b.name === 'FORTUNE')) {
    throw new Error('Missing FORTUNE brand');
  }
  if (daily.length !== categories.length) {
    throw new Error('Daily essentials should match live categories');
  }
  if (sections.popular.length === 0 || sections.recommended.length === 0) {
    throw new Error('Home product rails empty');
  }

  // Images are filenames only — mapped products must not invent http URLs.
  const invented = products.some((p) => {
    const image = p.image;
    return (
      typeof image === 'object' &&
      image != null &&
      'uri' in image &&
      typeof image.uri === 'string' &&
      /^https?:\/\//i.test(image.uri) &&
      !image.uri.includes('://')
    );
  });
  if (invented) {
    throw new Error('Invented image URL detected');
  }

  console.log(
    'live-catalog-meta.test.ts: ok',
    `products=${products.length}`,
    `categories=${categories.map((c) => c.name).join('|')}`,
    `brands=${brands.map((b) => b.name).join('|')}`,
    `popular=${sections.popular.length}`,
  );
}

void run();
