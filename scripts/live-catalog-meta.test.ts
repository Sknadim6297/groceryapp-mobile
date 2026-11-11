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

  // ERP inventory size changes — assert a usable catalogue, not a frozen count.
  if (products.length < 1) {
    throw new Error(`Expected mapped products, got ${products.length}`);
  }

  const categories = deriveLiveCategories(products);
  const brands = deriveLiveBrands(products);
  const daily = deriveDailyEssentials(products);
  const sections = buildHomeCatalogueSections(products);

  if (categories.length === 0) {
    throw new Error('Expected derived categories');
  }

  // Assert against categories actually present on loaded products.
  const firstCategory = products.find((p) => p.category?.trim())?.category?.trim();
  if (!firstCategory) {
    throw new Error('Expected at least one product Category');
  }
  if (!categories.some((c) => c.id === liveShelfIdForCategory(firstCategory))) {
    throw new Error(`Missing derived category for "${firstCategory}"`);
  }

  if (daily.length !== categories.length) {
    throw new Error('Daily essentials should match live categories');
  }
  if (sections.popular.length === 0 || sections.recommended.length === 0) {
    throw new Error('Home product rails empty');
  }

  // Do not invent http URLs from non-URL image payloads.
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
    `brands=${brands.map((b) => b.name).join('|') || '(none)'}`,
    `popular=${sections.popular.length}`,
  );
}

void run();
