/**
 * Buy Again must not invent past purchases from catalogue fixtures.
 * Run: npx --yes tsx scripts/buy-again-honesty.test.ts
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(path.join(root, 'src/app/buy-again.tsx'), 'utf8');

assert(!source.includes('listBuyAgainProducts'), 'must not load buy-again fixture catalogue as purchases');
assert(!source.includes('catalogProducts.slice'), 'must not present live catalogue as past orders');
assert(source.includes('No purchase history yet'), 'honest empty title present');
assert(source.includes('never invent past purchases') || source.includes('Never invent'), 'honest copy present');
assert(source.includes("router.push('/shop')") || source.includes('Browse shop'), 'shop CTA present');

console.log('buy-again-honesty.test.ts: all assertions passed');
