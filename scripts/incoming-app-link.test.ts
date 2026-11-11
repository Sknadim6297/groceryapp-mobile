/**
 * Cold-start deep link resolution for splash routing.
 * Run: npx --yes tsx scripts/incoming-app-link.test.ts
 */

import { isColdStartDeepLink, resolveIncomingAppHref } from '../src/utils/incomingAppLink';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(resolveIncomingAppHref(null) == null, 'null url');
assert(resolveIncomingAppHref('') == null, 'empty url');
assert(resolveIncomingAppHref('groceryapp://') == null, 'bare scheme');
assert(resolveIncomingAppHref('groceryapp://intro') == null, 'splash must not loop to intro');
assert(resolveIncomingAppHref('mayapurbazaar://login') == null, 'auth screens left to default flow');

const product = resolveIncomingAppHref('groceryapp://product/apples');
assert(product != null && typeof product === 'object', 'groceryapp product deep link');

const brand = resolveIncomingAppHref('mayapurbazaar://shop');
assert(brand === '/shop', 'brand scheme shop');

const preview = resolveIncomingAppHref('groceryapp-preview://coupons');
assert(preview === '/coupons', 'preview scheme coupons');

const httpsHost = resolveIncomingAppHref('https://mayapurbazaar.app/category/dairy');
assert(httpsHost != null && typeof httpsHost === 'object', 'trusted https host');

assert(isColdStartDeepLink('groceryapp://product/apples'), 'cold start flag true');
assert(!isColdStartDeepLink('groceryapp://'), 'cold start flag false for bare launch');

console.log('incoming-app-link.test.ts: all assertions passed');
