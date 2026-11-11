/**
 * Owner-scoped cart persistence helpers.
 * Run: npx --yes tsx scripts/cart-store.test.ts
 */

import {
  GUEST_CART_OWNER,
  cartOwnerKey,
  clearCartQuantities,
  installCartStoreForTests,
  loadCartQuantities,
  normalizeCartQuantities,
  parseCartVault,
  saveCartQuantities,
  serializeCartVault,
} from '../src/services/cartStore';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  installCartStoreForTests(null);

  assert(cartOwnerKey(null) === GUEST_CART_OWNER, 'signed-out cart uses guest owner');
  assert(
    cartOwnerKey({ kind: 'temporary-ui', mobile: '9876543210' }) === 'temporary-ui:9876543210',
    'signed-in cart is owner-scoped',
  );

  const normalized = normalizeCartQuantities({
    ' apples ': 2.9,
    bananas: 0,
    '': 3,
    milk: 120,
    eggs: -2,
    bread: '4' as unknown as number,
  });
  assert(normalized.apples === 2, 'qty floors and trims id');
  assert(normalized.milk === 99, 'qty clamps at 99');
  assert(normalized.bananas === undefined, 'zero qty dropped');
  assert(normalized.eggs === undefined, 'negative qty dropped');
  assert(normalized.bread === 4, 'numeric strings accepted');
  assert(Object.keys(normalized).length === 3, 'invalid keys dropped');

  const guest = GUEST_CART_OWNER;
  const alice = cartOwnerKey({ kind: 'temporary-ui', mobile: '9000000001' })!;
  const bob = cartOwnerKey({ kind: 'temporary-ui', mobile: '9000000002' })!;

  await saveCartQuantities(guest, { rice: 1 });
  await saveCartQuantities(alice, { milk: 2, eggs: 1 });
  await saveCartQuantities(bob, { bread: 3 });

  assert((await loadCartQuantities(guest)).rice === 1, 'guest cart restored');
  assert((await loadCartQuantities(alice)).milk === 2, 'alice cart restored');
  assert((await loadCartQuantities(alice)).eggs === 1, 'alice second line restored');
  assert((await loadCartQuantities(bob)).bread === 3, 'bob cart isolated');
  assert((await loadCartQuantities(alice)).bread === undefined, 'alice must not see bob cart');

  await clearCartQuantities(alice);
  assert(Object.keys(await loadCartQuantities(alice)).length === 0, 'alice cart cleared');
  assert((await loadCartQuantities(bob)).bread === 3, 'clearing alice leaves bob intact');

  const legacy = parseCartVault(JSON.stringify({ tea: 2, coffee: 1 }));
  assert(legacy[GUEST_CART_OWNER]?.tea === 2, 'legacy flat cart migrates to guest');
  assert(serializeCartVault({ [guest]: {} }) === '{}', 'empty vault serializes empty');

  console.log('cart-store.test.ts: all assertions passed');
}

void main();
