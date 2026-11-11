/**
 * Live ERP subcategory membership QA (company from env / default).
 * Logs Category/SubCategory anomalies; does not invent mappings.
 *
 * Run via: npm test (picked up by run-unit-tests) or:
 *   npx --yes tsx scripts/live-subcategory-qa.test.ts
 */
import { mapProductRecord } from '../src/services/productsApi';
import {
  liveShelfIdForSubcategory,
} from '../src/utils/liveCatalogMeta';
import {
  applyProductListing,
  createDefaultFilters,
} from '../src/utils/productFilters';
import { resolveShopListing } from '../src/utils/resolveShopShelf';
import type { DemoProduct } from '../src/types/catalog';
import type { ShopShelf } from '../src/data/shopCatalog';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const COMPANY = process.env.EXPO_PUBLIC_PRODUCTS_COMPANY?.trim() || '8787888888';
const BASE = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://api.supertrading.online';

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(`${BASE}${path}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${path}`);
  }
  return response.json();
}

function shelvesFrom(products: readonly DemoProduct[]): ShopShelf[] {
  const map = new Map<string, ShopShelf>();
  for (const row of products) {
    const category = row.category?.trim();
    const subcategory = row.subcategory?.trim();
    if (!category || !subcategory) {
      continue;
    }
    const id = liveShelfIdForSubcategory(category, subcategory);
    const existing = map.get(id);
    if (existing) {
      existing.products.push(row);
    } else {
      map.set(id, {
        id,
        name: subcategory,
        image: row.image,
        products: [row],
      });
    }
  }
  return [...map.values()];
}

async function main() {
  const body = await fetchJson(`/api/values/products?company=${encodeURIComponent(COMPANY)}`);
  assert(Array.isArray(body), 'products response must be an array');

  const products = (body as unknown[])
    .map((row) => mapProductRecord(row, { primaryImageOnly: true }))
    .filter((row): row is DemoProduct => row != null);

  assert(products.length > 0, 'expected at least one mapped product');

  const anomalies: string[] = [];
  for (const product of products) {
    if (!product.category?.trim()) {
      anomalies.push(`product ${product.id}: missing Category`);
    }
    if (!product.subcategory?.trim()) {
      anomalies.push(`product ${product.id}: missing SubCategory`);
    }
  }

  const shelves = shelvesFrom(products);
  const fruits = 'Fruits & Vegetables';

  const apples = resolveShopListing({
    shelfId: liveShelfIdForSubcategory(fruits, 'Apples'),
    parentName: fruits,
    subcategoryName: 'Apples',
    shelves,
    products,
  });
  assert(apples.status === 'matched', 'Apples must match a loaded product');
  assert(apples.status === 'matched' && apples.products.length >= 1, 'Apples product count');
  assert(
    apples.status === 'matched' &&
      apples.products.every((p) => p.category === fruits),
    'Apples results stay under Fruits parent',
  );

  const bananas = resolveShopListing({
    shelfId: liveShelfIdForSubcategory(fruits, 'Bananas'),
    parentName: fruits,
    subcategoryName: 'Bananas',
    shelves,
    products,
  });
  assert(bananas.status === 'empty', 'Bananas with no products → empty (not invalid)');
  assert(bananas.status === 'empty' && bananas.products.length === 0, 'Bananas has zero products');

  const atta = resolveShopListing({
    shelfId: liveShelfIdForSubcategory(fruits, 'ATTA, RICE & GRAINS'),
    parentName: fruits,
    subcategoryName: 'ATTA, RICE & GRAINS',
    shelves,
    products,
  });
  const dals = resolveShopListing({
    shelfId: liveShelfIdForSubcategory(fruits, 'DALS & PULSES'),
    parentName: fruits,
    subcategoryName: 'DALS & PULSES',
    shelves,
    products,
  });
  assert(atta.status === 'matched' && dals.status === 'matched', 'atta and dals matched');
  if (atta.status === 'matched' && dals.status === 'matched') {
    const attaIds = new Set(atta.products.map((p) => p.id));
    assert(
      dals.products.every((p) => !attaIds.has(p.id)),
      'atta and dals must not leak into each other',
    );
  }

  // Parent-scoped shampoo-style leakage check using any duplicated subcategory labels.
  const bySub = new Map<string, Map<string, DemoProduct[]>>();
  for (const product of products) {
    const sub = product.subcategory?.trim();
    const cat = product.category?.trim();
    if (!sub || !cat) {
      continue;
    }
    const key = sub.toLowerCase();
    if (!bySub.has(key)) {
      bySub.set(key, new Map());
    }
    const parents = bySub.get(key)!;
    if (!parents.has(cat)) {
      parents.set(cat, []);
    }
    parents.get(cat)!.push(product);
  }
  for (const [subKey, parents] of bySub) {
    if (parents.size < 2) {
      continue;
    }
    const parentNames = [...parents.keys()];
    const left = parentNames[0]!;
    const right = parentNames[1]!;
    const subName = parents.get(left)![0]!.subcategory!;
    const leftResult = resolveShopListing({
      shelfId: liveShelfIdForSubcategory(left, subName),
      parentName: left,
      subcategoryName: subName,
      shelves,
      products,
    });
    const rightResult = resolveShopListing({
      shelfId: liveShelfIdForSubcategory(right, subName),
      parentName: right,
      subcategoryName: subName,
      shelves,
      products,
    });
    assert(leftResult.status === 'matched' && rightResult.status === 'matched', `dup sub ${subKey} both match`);
    if (leftResult.status === 'matched' && rightResult.status === 'matched') {
      const leftIds = new Set(leftResult.products.map((p) => p.id));
      assert(
        rightResult.products.every((p) => !leftIds.has(p.id)),
        `parent scope must not leak for subcategory "${subName}"`,
      );
    }
  }

  // Search stays inside selected subcategory.
  if (atta.status === 'matched') {
    const pool = atta.products.map((row) => ({ ...row, shelfId: atta.shelfId }));
    const needle = atta.products[0]!.name.slice(0, Math.min(4, atta.products[0]!.name.length));
    const scoped = applyProductListing({
      products: [
        ...pool,
        ...products
          .filter((p) => p.id !== atta.products[0]!.id)
          .slice(0, 3)
          .map((p) => ({
            ...p,
            shelfId: liveShelfIdForSubcategory(p.category ?? 'x', p.subcategory ?? 'y'),
          })),
      ],
      query: needle,
      filters: createDefaultFilters(),
      sort: 'name-asc',
      stockFilterSupported: false,
      activeShelfId: atta.shelfId,
    });
    assert(
      scoped.every((row) => row.shelfId === atta.shelfId),
      'search+sort remain inside selected subcategory',
    );
  }

  // Never fall back to full catalogue for empty bananas.
  assert(bananas.status !== 'matched', 'bananas must not fall back to all products');

  // Flag ERP mis-filings (e.g. atta under Fruits) as anomalies — do not remap away.
  for (const product of products) {
    const cat = product.category?.trim() ?? '';
    const sub = product.subcategory?.trim() ?? '';
    if (/atta|rice|dal|pulse/i.test(sub) && /fruit/i.test(cat)) {
      anomalies.push(
        `anomaly: product ${product.id} SubCategory="${sub}" under Category="${cat}" (likely ERP mis-file)`,
      );
    }
  }

  console.log(
    'live-subcategory-qa.test.ts: ok',
    `products=${products.length}`,
    `apples=${apples.status === 'matched' ? apples.products.length : 0}`,
    `atta=${atta.status === 'matched' ? atta.products.length : 0}`,
    `dals=${dals.status === 'matched' ? dals.products.length : 0}`,
    `bananas=${bananas.status}`,
    `anomalies=${anomalies.length}`,
  );
  for (const line of anomalies.slice(0, 20)) {
    console.log(`ANOMALY\t${line}`);
  }
}

void main();
