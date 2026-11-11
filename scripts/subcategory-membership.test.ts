/**
 * Subcategory membership / Category unavailable regression.
 * Fixtures mirror live ERP shape: product.Category + product.SubCategory.
 */
import {
  applyProductListing,
  createDefaultFilters,
} from '../src/utils/productFilters';
import {
  categoryLabelsEqual,
  normalizeCatalogLabel,
  resolveShopListing,
  subcategoryLabelsMatch,
} from '../src/utils/resolveShopShelf';
import {
  liveShelfIdForCategory,
  liveShelfIdForSubcategory,
} from '../src/utils/liveCatalogMeta';
import type { DemoProduct } from '../src/types/catalog';
import type { ShopShelf } from '../src/data/shopCatalog';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function product(
  partial: Partial<DemoProduct> &
    Pick<DemoProduct, 'id' | 'name' | 'price' | 'category' | 'subcategory'>,
): DemoProduct {
  return {
    unit: '1 pc',
    image: { uri: `https://cdn.example/${partial.id}.jpg` },
    images: [{ uri: `https://cdn.example/${partial.id}.jpg` }],
    ...partial,
  };
}

// Representative live catalogue rows (company 8787888888 sample shape).
const catalogue: DemoProduct[] = [
  product({
    id: 'p1',
    name: 'Atta 1',
    price: 50,
    category: 'Fruits & Vegetables',
    subcategory: 'ATTA, RICE & GRAINS',
  }),
  product({
    id: 'p2',
    name: 'Atta 2',
    price: 55,
    category: 'Fruits & Vegetables',
    subcategory: 'ATTA, RICE & GRAINS',
  }),
  product({
    id: 'p3',
    name: 'Dal 1',
    price: 80,
    category: 'Fruits & Vegetables',
    subcategory: 'DALS & PULSES',
  }),
  product({
    id: 'p4',
    name: 'Dal 2',
    price: 85,
    category: 'Fruits & Vegetables',
    subcategory: 'DALS & PULSES',
  }),
  product({
    id: 'p5',
    name: 'Apple Bag',
    price: 120,
    category: 'Fruits & Vegetables',
    subcategory: 'Organic Red Delicious Apples Bag,',
  }),
  product({
    id: 'p6',
    name: 'Incense',
    price: 30,
    category: 'Pooja Essentials',
    subcategory: 'Agarbatti & Incense Sticks',
  }),
  product({
    id: 'p7',
    name: 'Shampoo A',
    price: 99,
    category: 'Beauty & Personal Care',
    subcategory: 'Shampoo',
  }),
  product({
    id: 'p8',
    name: 'Shampoo B',
    price: 110,
    category: 'Grocery',
    subcategory: 'Shampoo',
  }),
];

function shelvesFrom(products: readonly DemoProduct[]): ShopShelf[] {
  const map = new Map<string, ShopShelf>();
  for (const row of products) {
    const id = liveShelfIdForSubcategory(row.category!, row.subcategory!);
    const existing = map.get(id);
    if (existing) {
      existing.products.push(row);
    } else {
      map.set(id, {
        id,
        name: row.subcategory!,
        image: row.image,
        products: [row],
      });
    }
  }
  return [...map.values()];
}

const shelves = shelvesFrom(catalogue);
const fruits = 'Fruits & Vegetables';
const applesBrowseId = liveShelfIdForSubcategory(fruits, 'Apples');
const attaId = liveShelfIdForSubcategory(fruits, 'ATTA, RICE & GRAINS');
const dalsId = liveShelfIdForSubcategory(fruits, 'DALS & PULSES');
const bananasId = liveShelfIdForSubcategory(fruits, 'Bananas');
const beautyShampooId = liveShelfIdForSubcategory('Beauty & Personal Care', 'Shampoo');
const groceryShampooId = liveShelfIdForSubcategory('Grocery', 'Shampoo');

assert(normalizeCatalogLabel('ATTA, RICE & GRAINS') === 'atta rice grains', 'normalize labels');
assert(categoryLabelsEqual('Fruits & Vegetables', 'fruits & vegetables'), 'category case');
assert(
  subcategoryLabelsMatch('Organic Red Delicious Apples Bag,', 'Apples'),
  'browse Apples matches ERP apple bag SubCategory',
);
assert(!subcategoryLabelsMatch('Oil', 'Foil'), 'short / unrelated labels do not match');

// 1. Category A → Subcategory A → correct products (exact ERP SubCategory)
const atta = resolveShopListing({
  shelfId: attaId,
  parentName: fruits,
  subcategoryName: 'ATTA, RICE & GRAINS',
  shelves,
  products: catalogue,
});
assert(atta.status === 'matched', 'atta matched');
assert(atta.status === 'matched' && atta.products.map((p) => p.id).sort().join(',') === 'p1,p2', 'atta count 2');

// 2. Category A → Subcategory B → different products
const dals = resolveShopListing({
  shelfId: dalsId,
  parentName: fruits,
  subcategoryName: 'DALS & PULSES',
  shelves,
  products: catalogue,
});
assert(dals.status === 'matched' && dals.products.map((p) => p.id).sort().join(',') === 'p3,p4', 'dals only');

// Browse taxonomy "Apples" → ERP "Organic Red Delicious Apples Bag,"
const apples = resolveShopListing({
  shelfId: applesBrowseId,
  parentName: fruits,
  subcategoryName: 'Apples',
  shelves,
  products: catalogue,
});
assert(apples.status === 'matched', 'apples browse matched via containment');
assert(apples.status === 'matched' && apples.products.map((p) => p.id).join(',') === 'p5', 'one apple product');
assert(apples.status === 'matched' && apples.shelfName === 'Apples', 'heading keeps browse name');

// 3. Same subcategory name under different parents stays distinct
const beautyShampoo = resolveShopListing({
  shelfId: beautyShampooId,
  parentName: 'Beauty & Personal Care',
  subcategoryName: 'Shampoo',
  shelves,
  products: catalogue,
});
const groceryShampoo = resolveShopListing({
  shelfId: groceryShampooId,
  parentName: 'Grocery',
  subcategoryName: 'Shampoo',
  shelves,
  products: catalogue,
});
assert(
  beautyShampoo.status === 'matched' && beautyShampoo.products.map((p) => p.id).join(',') === 'p7',
  'beauty shampoo only',
);
assert(
  groceryShampoo.status === 'matched' && groceryShampoo.products.map((p) => p.id).join(',') === 'p8',
  'grocery shampoo only',
);

// 4. Valid subcategory with zero products → empty (not invalid / not unrelated)
const bananas = resolveShopListing({
  shelfId: bananasId,
  parentName: fruits,
  subcategoryName: 'Bananas',
  shelves,
  products: catalogue,
});
assert(bananas.status === 'empty', 'bananas empty');
assert(bananas.status === 'empty' && bananas.shelfName === 'Bananas', 'bananas keeps name');

// 5. Invalid subcategory id without names → invalid
const invalid = resolveShopListing({
  shelfId: 'live-not-a-real-shelf-zzzz',
  shelves,
  products: catalogue,
});
assert(invalid.status === 'invalid', 'unknown id invalid');

// 6. Search inside selected subcategory
const attaPool = atta.status === 'matched'
  ? atta.products.map((row) => ({ ...row, shelfId: atta.shelfId }))
  : [];
const searchAtta = applyProductListing({
  products: [
    ...attaPool,
    { ...catalogue[4]!, shelfId: liveShelfIdForSubcategory(fruits, catalogue[4]!.subcategory!) },
  ],
  query: 'Atta 1',
  filters: createDefaultFilters(),
  sort: 'catalogue',
  stockFilterSupported: false,
  activeShelfId: atta.status === 'matched' ? atta.shelfId : undefined,
});
assert(searchAtta.map((p) => p.id).join(',') === 'p1', 'search stays in atta shelf');

// 7. Parent category id alone
const parentOnly = resolveShopListing({
  shelfId: liveShelfIdForCategory(fruits),
  parentName: fruits,
  shelves,
  products: catalogue,
});
assert(
  parentOnly.status === 'matched' && parentOnly.products.length === 5,
  'parent fruits lists 5 fruit products',
);

// 8. No silent fallback to all products on empty
assert(bananas.status === 'empty' && bananas.products.length === 0, 'empty has zero products');

console.log(
  'subcategory membership passed',
  `atta=${atta.status === 'matched' ? atta.products.length : 0}`,
  `dals=${dals.status === 'matched' ? dals.products.length : 0}`,
  `apples=${apples.status === 'matched' ? apples.products.length : 0}`,
  `bananas=${bananas.status}`,
);
