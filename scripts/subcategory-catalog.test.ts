import { filterSubcategories, formatItemCount } from '../src/utils/subcategorySearch';
import type { CatalogSubcategory } from '../src/types/subcategory';

const sample: CatalogSubcategory[] = [
  {
    id: 'fruits',
    parentId: 'groceries',
    name: 'Fruits & Vegetables',
    image: 1 as never,
    productCount: 2,
    order: 0,
    visible: true,
  },
  {
    id: 'dairy-eggs',
    parentId: 'groceries',
    name: 'Dairy & Eggs',
    image: 1 as never,
    productCount: 0,
    order: 1,
    visible: true,
  },
];

const filtered = filterSubcategories(sample, 'FRUIT');
if (filtered.length !== 1 || filtered[0]?.id !== 'fruits') {
  throw new Error('search must be case-insensitive and match subcategory names');
}
if (filterSubcategories(sample, 'zzzz-missing').length !== 0) {
  throw new Error('unknown search must be empty');
}
if (filterSubcategories(sample, '  ').length !== 2) {
  throw new Error('blank search must return all items');
}

if (formatItemCount(0) !== 'Browse items' || formatItemCount(1) !== '1 item' || formatItemCount(3) !== '3 items') {
  throw new Error('item count labels must stay honest');
}

console.log('subcategory catalog rules passed');
