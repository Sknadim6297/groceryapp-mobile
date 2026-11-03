import type { DemoProduct } from '../src/types/catalog';
import { isProductInStock, resolveWishlistEntries, wishlistAvailableCount } from '../src/data/resolveWishlistProducts';
import {
  addWishlistId,
  installWishlistStoreForTests,
  loadWishlistIds,
  normalizeWishlistIds,
  parseWishlistIds,
  removeWishlistId,
  saveWishlistIds,
  serializeWishlistIds,
  toggleWishlistId,
} from '../src/services/wishlistStore';

async function main() {
  installWishlistStoreForTests(null);

  const sample: DemoProduct = {
    id: 'eggs',
    name: 'Farm Eggs',
    unit: '12 pcs',
    price: 72,
    compareAt: 90,
    discountLabel: '20% OFF',
    image: { uri: 'https://example.com/eggs.png' },
    images: [{ uri: 'https://example.com/eggs.png' }, { uri: 'https://example.com/eggs-2.png' }],
  };

  const lookup = (id: string) => (id === sample.id ? sample : undefined);

  if (normalizeWishlistIds([' a ', 'a', '', 'b', 'b']).join(',') !== 'a,b') {
    throw new Error('normalizeWishlistIds must trim and dedupe');
  }

  if (toggleWishlistId([], sample.id).join(',') !== sample.id) {
    throw new Error('toggle should add a missing id');
  }
  if (toggleWishlistId([sample.id], sample.id).length !== 0) {
    throw new Error('toggle should remove a saved id');
  }
  if (addWishlistId([sample.id], sample.id).join(',') !== sample.id) {
    throw new Error('add must not duplicate');
  }
  if (removeWishlistId([sample.id, 'missing-item'], sample.id).join(',') !== 'missing-item') {
    throw new Error('remove should drop only the requested id');
  }

  const roundTrip = parseWishlistIds(serializeWishlistIds(['x', 'y', 'x']));
  if (roundTrip.join(',') !== 'x,y') {
    throw new Error('serialize/parse must keep unique order');
  }

  const memory = new Map<string, string>();
  installWishlistStoreForTests({
    async read() {
      return memory.get('groceryapp.wishlist') ?? null;
    },
    async write(value) {
      memory.set('groceryapp.wishlist', value);
    },
    async remove() {
      memory.delete('groceryapp.wishlist');
    },
  });

  await saveWishlistIds([sample.id, sample.id, 'gone-product']);
  const restored = await loadWishlistIds();
  if (restored.join(',') !== `${sample.id},gone-product`) {
    throw new Error(`persistence failed: ${restored.join(',')}`);
  }

  const entries = resolveWishlistEntries(restored, lookup);
  if (entries.length !== 2) {
    throw new Error('resolve should keep every saved id');
  }
  const ready = entries.find((entry) => entry.kind === 'ready');
  const missing = entries.find((entry) => entry.kind === 'unavailable');
  if (!ready || ready.id !== sample.id) {
    throw new Error('known catalogue id should resolve');
  }
  if (!missing || missing.id !== 'gone-product') {
    throw new Error('deleted catalogue ids must stay as unavailable');
  }
  if (wishlistAvailableCount(entries) !== 1) {
    throw new Error('available count should ignore unavailable ids');
  }

  if (!isProductInStock(sample)) {
    throw new Error('default products are in stock');
  }
  if (isProductInStock({ ...sample, available: false })) {
    throw new Error('available:false must count as out of stock');
  }

  console.log('wishlist fixtures passed');
}

void main();
