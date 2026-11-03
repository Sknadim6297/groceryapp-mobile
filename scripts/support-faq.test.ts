/**
 * Support Center FAQ search / category filters / details helpers.
 * Run: npx --yes tsx scripts/support-faq.test.ts
 */

import {
  featuredSupportFaqs,
  relatedSupportFaqs,
  SUPPORT_CATEGORIES,
  SUPPORT_FAQS,
  supportFaqById,
  supportFaqDetailsHref,
} from '../src/data/supportFaq';
import { filterSupportFaqs, normalizeSupportQuery } from '../src/utils/supportFaqSearch';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(SUPPORT_FAQS.length >= 4, 'FAQ catalog must include the featured questions');
assert(SUPPORT_CATEGORIES.length === 4, 'four help categories expected');
assert(featuredSupportFaqs().length === 4, 'support home shows four featured FAQs');
assert(Boolean(supportFaqById('faq-order-not-arrived')), 'stable FAQ ids must resolve');
assert(!supportFaqById('faq-does-not-exist'), 'unknown FAQ id must be undefined');

assert(normalizeSupportQuery('  Refund  ') === 'refund', 'query normalize trims and lowercases');

const refundHits = filterSupportFaqs(SUPPORT_FAQS, { query: 'refund' });
assert(refundHits.some((item) => item.id === 'faq-refund'), 'refund search must find refund FAQ');

const orderOnly = filterSupportFaqs(SUPPORT_FAQS, { category: 'orders' });
assert(orderOnly.every((item) => item.category === 'orders'), 'category filter must keep orders only');
assert(orderOnly.length >= 2, 'orders category should have multiple FAQs');

const empty = filterSupportFaqs(SUPPORT_FAQS, { query: 'zzzz-no-match' });
assert(empty.length === 0, 'unknown query returns empty results');

const combined = filterSupportFaqs(SUPPORT_FAQS, { query: 'cancel', category: 'orders' });
assert(combined.some((item) => item.id === 'faq-cancel-order'), 'combined search + category must work');

const late = supportFaqById('faq-order-not-arrived');
assert(Boolean(late?.steps?.length), 'featured late-order FAQ should expose detail steps');
assert(Boolean(late?.intro), 'featured late-order FAQ should expose detail intro');

const related = relatedSupportFaqs('faq-order-not-arrived', 3);
assert(related.length > 0, 'related FAQs should resolve for late-order topic');
assert(related.every((item) => item.id !== 'faq-order-not-arrived'), 'related list must exclude current FAQ');
assert(related.length <= 3, 'related list respects limit');

const href = supportFaqDetailsHref('faq-refund');
assert(href.pathname === '/support/faq/[id]', 'details href uses stable pathname');
assert(href.params.id === 'faq-refund', 'details href passes FAQ id');

const missingRelated = relatedSupportFaqs('faq-does-not-exist');
assert(missingRelated.length === 0, 'unknown FAQ has no related recommendations');

console.log('support faq fixtures passed');
