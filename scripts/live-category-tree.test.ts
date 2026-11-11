import { mapProductRecord } from '../src/services/productsApi';
import { deriveLiveCategoryTree } from '../src/utils/liveCatalogMeta';

async function run() {
  const response = await fetch('https://api.supertrading.online/api/values/products?company=8787888888');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const body: unknown = await response.json();
  if (!Array.isArray(body)) {
    throw new Error('Expected products array');
  }

  const products = body
    .map((row) => mapProductRecord(row))
    .filter((row): row is NonNullable<typeof row> => row != null);
  if (products.length === 0) {
    throw new Error('No products mapped');
  }

  const withSub = products.filter((product) => Boolean(product.subcategory?.trim()));
  if (withSub.length === 0) {
    throw new Error('Expected Subcategory on live products');
  }

  const tree = deriveLiveCategoryTree(products);
  if (tree.length === 0) {
    throw new Error('Expected live category parents');
  }

  const hasRealSubs = tree.some((parent) => parent.children.some((child) => child.id !== parent.id));
  if (!hasRealSubs) {
    throw new Error('Expected subcategory children distinct from parents');
  }

  // Prefer Fruits & Vegetables when present (current ERP sample); otherwise any multi-child parent.
  const fruits = tree.find((parent) => /fruits/i.test(parent.name));
  const multi = tree.find((parent) => parent.children.length >= 2);
  const anchor = fruits && fruits.children.length >= 1 ? fruits : multi;
  if (!anchor || anchor.children.length < 1) {
    throw new Error('Expected a parent category with subcategory children');
  }

  console.log(
    'live-category-tree.test.ts: ok',
    `parents=${tree.length}`,
    `withSubcategory=${withSub.length}`,
    `anchor=${anchor.name}`,
    `children=${anchor.children.map((child) => child.name).join('|')}`,
  );
}

void run();
