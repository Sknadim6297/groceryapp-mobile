import { mapProductRecord } from '../src/services/productsApi';

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function run() {
  assertEqual(mapProductRecord(null), null, 'null input');
  assertEqual(
    mapProductRecord({ Status: 'Failed', Message: 'Mobile number does not exist in company database.' }),
    null,
    'failure envelope',
  );

  const jpeg = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgK';
  const live = mapProductRecord({
    ProductId: 7,
    CompanyId: '8787888888',
    ProductName: 'SUPER BASMATI RICE',
    Barcode: '8906007283267',
    Category: 'GROCERIES & FOOD',
    Brand: 'FORTUNE',
    MRP: 199,
    SellingPrice: 100,
    DiscountAmount: 99,
    DiscountPercent: 49.75,
    AvailableStock: 102,
    Image1: jpeg,
    Image2: 'System.Byte[]',
    Image3: '',
    Image4: null,
  });
  if (!live) {
    throw new Error('expected live product mapping');
  }
  assertEqual(live.id, '7', 'id');
  assertEqual(live.name, 'SUPER BASMATI RICE', 'name');
  assertEqual(live.unit, 'FORTUNE', 'unit from brand');
  assertEqual(live.price, 100, 'selling price');
  assertEqual(live.compareAt, 199, 'mrp');
  assertEqual(live.discountLabel, '50% OFF', 'discount label');
  assertEqual(live.available, true, 'stock > 0');
  assertEqual(live.category, 'GROCERIES & FOOD', 'category');
  assertEqual(live.brand, 'FORTUNE', 'brand');
  if (typeof live.image !== 'object' || live.image == null || !('uri' in live.image)) {
    throw new Error('image missing uri');
  }
  if (!String(live.image.uri).startsWith('data:image/jpeg;base64,')) {
    throw new Error('expected jpeg data uri for Image1');
  }

  assertEqual(mapProductRecord({ Name: 'No id', Price: 10 }), null, 'missing id');
  assertEqual(mapProductRecord({ Id: 'x', Name: 'No price' }), null, 'missing price');

  console.log('products-api-map.test.ts: ok');
}

run();
