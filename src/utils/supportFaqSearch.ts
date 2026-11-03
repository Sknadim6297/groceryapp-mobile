import type { SupportCategory, SupportFaqItem } from '@/data/supportFaq';

export function normalizeSupportQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function filterSupportFaqs(
  items: readonly SupportFaqItem[],
  options: { query?: string; category?: SupportCategory | 'all' },
): SupportFaqItem[] {
  const category = options.category ?? 'all';
  const needle = normalizeSupportQuery(options.query ?? '');

  return items.filter((item) => {
    if (category !== 'all' && item.category !== category) {
      return false;
    }
    if (needle.length === 0) {
      return true;
    }
    const haystack = `${item.question} ${item.answer} ${item.keywords.join(' ')} ${item.category}`.toLowerCase();
    return haystack.includes(needle);
  });
}
