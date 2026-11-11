/**
 * Recently viewed persistence, ordering, and catalogue resolution.
 * Run: npx --yes tsx scripts/recently-viewed.test.ts
 */

import { resolveRecentlyViewedProducts } from '../src/data/resolveRecentlyViewedProducts';
import {
  GUEST_RECENTLY_VIEWED_OWNER,
  clearRecentlyViewedIds,
  installRecentlyViewedStoreForTests,
  loadRecentlyViewedIds,
  normalizeRecentlyViewedIds,
  parseRecentlyViewedVault,
  recentlyViewedOwnerKey,
  recordRecentlyViewedId,
  saveRecentlyViewedIds,
} from '../src/services/recentlyViewedStore';
import type { DemoProduct } from '../src/types/catalog';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  installRecentlyViewedStoreForTests(null);

  assert(recentlyViewedOwnerKey(null) === GUEST_RECENTLY_VIEWED_OWNER, 'guest owner');
  assert(
    recentlyViewedOwnerKey({ kind: 'temporary-ui', mobile: '9876543210' }) === 'temporary-ui:9876543210',
    'signed-in owner',
  );

  assert(normalizeRecentlyViewedIds([' a ', 'a', '', 'b']).join(',') === 'a,b', 'normalize dedupes');
  assert(recordRecentlyViewedId(['b', 'c'], 'a').join(',') === 'a,b,c', 'new id to front');
  assert(recordRecentlyViewedId(['a', 'b', 'c'], 'b').join(',') === 'b,a,c', 'existing moves to front');
  assert(recordRecentlyViewedId(['1', '2'], '  ').join(',') === '1,2', 'blank ignored');

  const many = recordRecentlyViewedId(
    Array.from({ length: 25 }, (_, i) => `p${i}`),
    'fresh',
  );
  assert(many[0] === 'fresh' && many.length === 20, 'cap at 20 most recent');

  const alice = recentlyViewedOwnerKey({ kind: 'temporary-ui', mobile: '9000000001' })!;
  const bob = recentlyViewedOwnerKey({ kind: 'temporary-ui', mobile: '9000000002' })!;
  await saveRecentlyViewedIds(GUEST_RECENTLY_VIEWED_OWNER, ['g1']);
  await saveRecentlyViewedIds(alice, ['a1', 'a2']);
  await saveRecentlyViewedIds(bob, ['b1']);
  assert((await loadRecentlyViewedIds(alice)).join(',') === 'a1,a2', 'alice restored');
  assert((await loadRecentlyViewedIds(bob)).join(',') === 'b1', 'bob isolated');
  assert((await loadRecentlyViewedIds(alice)).includes('b1') === false, 'no cross-account leak');
  await clearRecentlyViewedIds(alice);
  assert((await loadRecentlyViewedIds(alice)).length === 0, 'alice cleared');
  assert((await loadRecentlyViewedIds(bob)).join(',') === 'b1', 'bob intact');

  const legacy = parseRecentlyViewedVault(JSON.stringify(['legacy-1', 'legacy-2']));
  assert(legacy[GUEST_RECENTLY_VIEWED_OWNER]?.[0] === 'legacy-1', 'legacy array migrates to guest');

  const sample: DemoProduct = {
    id: 'eggs',
    name: 'Eggs',
    unit: '12 pcs',
    price: 70,
    image: { uri: 'https://example.com/eggs.png' },
  };
  const resolved = resolveRecentlyViewedProducts(
    ['missing', 'eggs', 'eggs', 'gone'],
    (id) => (id === sample.id ? sample : undefined),
  );
  assert(resolved.length === 1 && resolved[0]?.id === 'eggs', 'drops unavailable ids from display');

  console.log('recently-viewed.test.ts: all assertions passed');
}

void main();
