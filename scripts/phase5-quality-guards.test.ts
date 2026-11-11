/**
 * Phase 5 regression: offline honesty, wishlist isolation, deep-link safety, cart owners.
 * Run: npx --yes tsx scripts/phase5-quality-guards.test.ts
 */

import { cartOwnerKey, installCartStoreForTests, loadCartQuantities, saveCartQuantities } from '../src/services/cartStore';
import {
  installWishlistStoreForTests,
  loadWishlistIds,
  parseWishlistVault,
  saveWishlistIds,
  serializeWishlistVault,
  wishlistOwnerKey,
} from '../src/services/wishlistStore';
import { resolveIncomingAppHref } from '../src/utils/incomingAppLink';
import {
  CATALOGUE_NETWORK_ERROR_HINT,
  OFFLINE_BANNER_COPY,
  shouldShowOfflineBanner,
} from '../src/utils/networkConnectivity';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  // --- Offline banner honesty ---
  assert(!shouldShowOfflineBanner({ isConnected: null, isInternetReachable: null }), 'unknown stays quiet');
  assert(!shouldShowOfflineBanner({ isConnected: true, isInternetReachable: true }), 'online quiet');
  assert(!shouldShowOfflineBanner({ isConnected: true, isInternetReachable: null }), 'unknown reachability quiet');
  assert(shouldShowOfflineBanner({ isConnected: false, isInternetReachable: null }), 'disconnected shows');
  assert(shouldShowOfflineBanner({ isConnected: true, isInternetReachable: false }), 'unreachable shows');
  assert(OFFLINE_BANNER_COPY.toLowerCase().includes('does not guarantee'), 'offline copy must not overclaim');
  assert(
    CATALOGUE_NETWORK_ERROR_HINT.toLowerCase().includes('does not always mean'),
    'catalogue error must not equate internet with API',
  );

  // --- Wishlist owner isolation + legacy vault migration ---
  installWishlistStoreForTests(null);
  const ownerA = wishlistOwnerKey({ kind: 'temporary-ui', mobile: '9000000001' });
  const ownerB = wishlistOwnerKey({ kind: 'temporary-ui', mobile: '9000000002' });
  assert(ownerA === 'temporary-ui:9000000001', 'wishlist owner A');
  assert(wishlistOwnerKey(null) === 'guest', 'guest wishlist owner');

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

  // Legacy flat array becomes guest book.
  memory.set('groceryapp.wishlist', JSON.stringify(['legacy-a', 'legacy-b']));
  const legacy = parseWishlistVault(memory.get('groceryapp.wishlist') ?? null);
  assert(legacy.guest?.join(',') === 'legacy-a,legacy-b', 'legacy array migrates to guest');

  await saveWishlistIds(ownerA!, ['p1', 'p2']);
  await saveWishlistIds(ownerB!, ['p9']);
  assert((await loadWishlistIds(ownerA!)).join(',') === 'p1,p2', 'owner A wishlist');
  assert((await loadWishlistIds(ownerB!)).join(',') === 'p9', 'owner B isolated');
  assert(
    serializeWishlistVault({ [ownerA!]: ['p1'], [ownerB!]: [] }).includes(ownerA!),
    'empty owner pruned from vault serialize',
  );

  // --- Cart owner isolation still intact ---
  installCartStoreForTests(null);
  const cartMemory = new Map<string, string>();
  installCartStoreForTests({
    async read() {
      return cartMemory.get('groceryapp.cart-quantities') ?? null;
    },
    async write(value) {
      cartMemory.set('groceryapp.cart-quantities', value);
    },
    async remove() {
      cartMemory.delete('groceryapp.cart-quantities');
    },
  });
  const cartA = cartOwnerKey({ kind: 'temporary-ui', mobile: '9000000001' })!;
  const cartB = cartOwnerKey({ kind: 'temporary-ui', mobile: '9000000002' })!;
  await saveCartQuantities(cartA, { milk: 2 });
  await saveCartQuantities(cartB, { rice: 1 });
  assert((await loadCartQuantities(cartA)).milk === 2, 'cart A');
  assert((await loadCartQuantities(cartB)).rice === 1, 'cart B isolated');

  // --- Deep link splash blockers ---
  assert(resolveIncomingAppHref('groceryapp://') == null, 'bare launch blocked');
  assert(resolveIncomingAppHref('groceryapp://login') == null, 'login splash blocked');
  assert(resolveIncomingAppHref('groceryapp://otp') == null, 'otp splash blocked');

  // eslint-disable-next-line no-console
  console.log('phase5-quality-guards fixtures passed');
}

void main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
