import { buildHomeCatalogueSections } from '../src/utils/homeCatalogueSections';
import type { DemoProduct } from '../src/types/catalog';

function product(id: string, extras: Partial<DemoProduct> = {}): DemoProduct {
  return {
    id,
    name: extras.name ?? `Product ${id}`,
    unit: extras.unit ?? 'Brand',
    price: extras.price ?? 10,
    image: { uri: '' },
    images: [{ uri: '' }, { uri: '' }],
    ...extras,
  };
}

function run() {
  const sections = buildHomeCatalogueSections([
    product('1', { name: 'Rice', price: 100, compareAt: 199, discountLabel: '50% OFF' }),
    product('2', { name: 'Dal' }),
    product('3', { name: 'Soap' }),
    product('4', { name: 'Oil' }),
    product('5', { name: 'Organic Peanut', category: 'GROCERIES & FOOD' }),
    product('6'),
    product('7'),
    product('8'),
    product('9'),
  ]);

  if (sections.recommended.length !== 4) {
    throw new Error(`recommended expected 4, got ${sections.recommended.length}`);
  }
  if (sections.spotlight[0]?.id !== '1') {
    throw new Error('spotlight should prefer discounted items');
  }
  if (sections.popular.length !== 6) {
    throw new Error(`popular expected 6, got ${sections.popular.length}`);
  }
  if (!sections.dryFruits.some((item) => item.id === '5')) {
    throw new Error('dryFruits should include peanut');
  }
  console.log('home-catalogue-sections.test.ts: ok');
}

run();
