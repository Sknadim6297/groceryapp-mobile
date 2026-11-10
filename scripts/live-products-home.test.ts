import { mapProductRecord } from '../src/services/productsApi';
import { buildHomeCatalogueSections } from '../src/utils/homeCatalogueSections';

async function run() {
  const response = await fetch('https://api.supertrading.online/api/values/products?company=8787888888');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const body: unknown = await response.json();
  if (!Array.isArray(body)) {
    throw new Error('Expected product array');
  }
  const products = body.map((item) => mapProductRecord(item)).filter((item): item is NonNullable<typeof item> => item != null);
  if (products.length === 0) {
    throw new Error('Expected at least one mapped product');
  }
  if (products.length !== body.length) {
    throw new Error(`Mapped ${products.length} of ${body.length} raw products — check id/name/price fields`);
  }
  const first = products[0]!;
  if (!first.id || !first.name || first.price < 0) {
    throw new Error('Mapped product missing id/name/price');
  }
  const sections = buildHomeCatalogueSections(products);
  if (sections.recommended.length === 0 || sections.popular.length === 0) {
    throw new Error('Home sections empty');
  }
  console.log(
    'live-products-home.test.ts: ok',
    `mapped=${products.length}`,
    `recommended=${sections.recommended.length}`,
    `popular=${sections.popular.length}`,
    `ids=${products.map((p) => p.id).join(',')}`,
  );
}

void run();
