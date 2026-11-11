/**
 * Frontend-only completion regression guards.
 * Run: npx --yes tsx scripts/frontend-completion-guards.test.ts
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isDiscountedProduct } from '../src/utils/productFilters';
import { isProductInStock } from '../src/data/resolveWishlistProducts';
import type { DemoProduct } from '../src/types/catalog';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel: string): string {
  return readFileSync(path.join(root, rel), 'utf8');
}

function main() {
  // Discount honesty: badge only when MRP > price
  const discounted: DemoProduct = {
    id: 'a',
    name: 'A',
    unit: '1 pc',
    price: 80,
    compareAt: 100,
    discountLabel: '20% OFF',
    image: { uri: '' },
    images: [{ uri: '' }],
  };
  const fakeDiscount: DemoProduct = {
    ...discounted,
    compareAt: undefined,
    discountLabel: '50% OFF',
  };
  assert(isDiscountedProduct(discounted), 'MRP>price is discounted');
  assert(!isDiscountedProduct(fakeDiscount), 'label alone is not discounted');

  // Stock helper
  assert(isProductInStock({ ...discounted, available: undefined }), 'missing available = in stock');
  assert(!isProductInStock({ ...discounted, available: false }), 'explicit false is OOS');

  // Clear cart exposed on cart context
  const cartCtx = read('src/context/MockCartContext.tsx');
  assert(cartCtx.includes('clearCart:'), 'clearCart on cart context');
  assert(cartCtx.includes('clearCartQuantities'), 'clearCart persists empty vault');

  // Guest wishlist no forced login
  const wishlist = read('src/app/wishlist.tsx');
  assert(!wishlist.includes('Redirect'), 'wishlist allows guest without login redirect');

  // Recently viewed dedicated route
  const rv = read('src/app/recently-viewed.tsx');
  assert(rv.includes('HISTORY_LIMIT = 20'), 'recently viewed shows up to 20');
  const home = read('src/app/(tabs)/home.tsx');
  assert(home.includes("/recently-viewed"), 'home View all opens recently-viewed');

  // SideMenu logout uses full cleanup
  const sideMenu = read('src/components/home/SideMenu.tsx');
  assert(sideMenu.includes('clearSignedInSession'), 'SideMenu logout clears signed-in session');
  assert(sideMenu.includes('clearPreviewAccountState'), 'SideMenu logout clears preview account state');

  // Address edit preserves id on map return
  const addressForm = read('src/app/address-form.tsx');
  assert(addressForm.includes('returnParams.id = editId'), 'edit address returnTo keeps id');

  // Track screen does not substitute another order
  const track = read('src/components/track/OrderTrackingScreen.tsx');
  assert(
    !track.includes("orders.find((order) => isActiveOrder(order))"),
    'track must not fall back to an unrelated active order',
  );

  // Reviews fixtures gated to preview
  const reviews = read('src/context/ProductReviewsContext.tsx');
  assert(reviews.includes('UI_PREVIEW_MODE && product'), 'preview reviews gated');

  // Collection URL listing state
  const collectionRoute = read('src/app/collection/[id].tsx');
  assert(collectionRoute.includes('seedFilters'), 'collection seeds filters from URL');
  assert(collectionRoute.includes('decodeShopFilters'), 'collection decodes filters');

  console.log('frontend-completion-guards: ok');
}

main();
