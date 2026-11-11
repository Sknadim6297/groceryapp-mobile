/**
 * Phases A–E regression guards (shopping lists, unit price, recent searches, share, saved carts).
 * Run: npx --yes tsx scripts/smart-features-guards.test.ts
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { matchShoppingListItem } from '../src/utils/matchShoppingListItem';
import { parseProductUnit } from '../src/utils/parseProductUnit';
import { buildProductShareMessage, productShareDeepLink } from '../src/utils/productShareMessage';
import { revalidateSavedCartQuantities } from '../src/utils/revalidateSavedCart';
import { computeUnitPrice } from '../src/utils/unitPrice';
import {
  MAX_RECENT_SEARCHES,
  normalizeRecentSearches,
  recordRecentSearch,
} from '../src/services/recentSearchStore';
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

function product(partial: Partial<DemoProduct> & Pick<DemoProduct, 'id' | 'name' | 'price'>): DemoProduct {
  return {
    unit: '1 kg',
    image: { uri: '' },
    images: [{ uri: '' }],
    ...partial,
  };
}

function main() {
  // --- Phase A: catalogue match is exact only ---
  const milk = product({ id: 'milk', name: 'Toned Milk', price: 60, unit: '1 L', available: true });
  const bread = product({ id: 'bread', name: 'Bread', price: 40, unit: '400 g', available: false });
  assert(matchShoppingListItem('toned milk', [milk, bread])?.id === 'milk', 'exact match');
  assert(matchShoppingListItem('milk', [milk, bread]) == null, 'partial match refused');
  assert(matchShoppingListItem('Bread', [milk, bread])?.id === 'bread', 'exact bread');

  const layout = read('src/app/_layout.tsx');
  assert(layout.includes('ShoppingListsProvider'), 'shopping lists provider mounted');
  assert(layout.includes('RecentSearchesProvider'), 'recent searches provider mounted');
  assert(layout.includes('SavedCartsProvider'), 'saved carts provider mounted');
  assert(read('src/navigation/profileRoutes.ts').includes("shoppingLists: '/shopping-lists'"), 'shopping lists route');
  assert(read('src/navigation/sideMenuItems.ts').includes('Shopping Lists'), 'shopping lists nav');

  // --- Phase B: unit price ---
  assert(parseProductUnit('500 g')?.kind === 'mass', 'parse grams');
  assert(parseProductUnit('1 kg')?.kind === 'mass', 'parse kg');
  assert(parseProductUnit('250 ml')?.kind === 'volume', 'parse ml');
  assert(parseProductUnit('1 L')?.kind === 'volume', 'parse litre');
  assert(parseProductUnit('12 pcs')?.kind === 'each', 'parse pcs');
  assert(parseProductUnit('pack') == null, 'refuse unknown unit');
  assert(parseProductUnit('approx 1 kg') == null, 'refuse unreliable unit');
  const perKg = computeUnitPrice(80, '500 g');
  assert(perKg?.base === 'kg' && Math.round(perKg.perBase) === 160, '500g → ₹/kg');
  const perL = computeUnitPrice(50, '250 ml');
  assert(perL?.base === 'L' && Math.round(perL.perBase) === 200, '250ml → ₹/L');
  assert(computeUnitPrice(10, 'unknown') == null, 'no unit price without parse');
  assert(read('src/components/home/ProductCard.tsx').includes('computeUnitPrice'), 'card shows unit price');

  // --- Phase C: recent searches ---
  let history = recordRecentSearch([], 'Milk');
  history = recordRecentSearch(history, 'Bread');
  history = recordRecentSearch(history, 'milk');
  assert(history[0] === 'milk', 'newest first / case-insensitive dedupe');
  assert(history.filter((q) => q.toLowerCase() === 'milk').length === 1, 'no duplicates');
  const many = normalizeRecentSearches(Array.from({ length: 30 }, (_, i) => `q${i}`));
  assert(many.length === MAX_RECENT_SEARCHES, 'caps recent searches');
  assert(read('src/context/RecentSearchesContext.tsx').includes('removeQuery'), 'clear one query');
  assert(read('src/app/(tabs)/shop.tsx').includes('RecentSearchChips'), 'shop wires recent searches');

  // --- Phase D: product share ---
  const msg = buildProductShareMessage({ productId: 'milk', productName: 'Toned Milk' });
  assert(msg.includes('groceryapp://product/milk'), 'share uses app deep link');
  assert(!msg.toLowerCase().includes('https://'), 'no invented public https url');
  assert(productShareDeepLink('a b') === 'groceryapp://product/a%20b', 'encodes id');
  assert(read('src/app/product/[id].tsx').includes('Share.share'), 'PDP share sheet');

  // --- Phase E: saved carts revalidation ---
  const lookup = (id: string) =>
    id === 'milk' ? milk : id === 'bread' ? bread : id === 'gone' ? undefined : undefined;
  const revalidated = revalidateSavedCartQuantities(
    { milk: 2, bread: 1, gone: 3, '': 1 },
    lookup,
  );
  assert(revalidated.quantities.milk === 2, 'in-stock restored');
  assert(revalidated.quantities.bread == null, 'oos excluded');
  assert(revalidated.outOfStockIds.includes('bread'), 'oos reported');
  assert(revalidated.missingIds.includes('gone'), 'missing reported');
  assert(read('src/context/SavedCartsContext.tsx').includes('renameSavedCart'), 'rename API');
  assert(read('src/app/saved-carts/index.tsx').includes('Replace current cart'), 'restore confirm');
  assert(read('src/components/cart/ReviewCartScreen.tsx').includes('saveCurrentCart'), 'cart can save');

  console.log('smart-features-guards: ok');
}

main();
