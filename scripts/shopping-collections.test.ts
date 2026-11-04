/**
 * Pure shopping-collection matching fixtures (no image / catalogue imports).
 */

import {
  chipIdsForCollectionProduct,
  isDiwaliCatalogCandidate,
  isElectronicsCatalogCandidate,
  isFreshCatalogCandidate,
  isOrganicCatalogSignal,
  productBelongsToCollection,
} from '../src/utils/shoppingCollectionMatch';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(isFreshCatalogCandidate('fruits'), 'fruits shelf is fresh');
assert(isFreshCatalogCandidate('dairy-eggs'), 'dairy shelf is fresh');
assert(!isFreshCatalogCandidate('personal'), 'personal care is not fresh');

assert(isOrganicCatalogSignal('Organic Tomatoes', 'Farm'), 'organic in name');
assert(isOrganicCatalogSignal('Tomatoes', 'Organic'), 'organic in brand');
assert(!isOrganicCatalogSignal('Fresh Apples', 'Fresh'), 'must not invent organic');

assert(isDiwaliCatalogCandidate('preview-dry-fruits', 'Cashews'), 'dry fruits shelf is festive');
assert(isDiwaliCatalogCandidate(undefined, 'Whole Farm Grocery Almonds'), 'almond name is festive');
assert(!isDiwaliCatalogCandidate('personal', 'Toothpaste'), 'toothpaste is not Diwali');

assert(isElectronicsCatalogCandidate('preview-electronics'), 'electronics shelf');
assert(isElectronicsCatalogCandidate('preview-kitchen'), 'kitchen appliances shelf');
assert(!isElectronicsCatalogCandidate('fruits'), 'produce is not electronics');

assert(
  productBelongsToCollection({
    collectionId: 'all',
    productName: 'Anything',
    brand: 'X',
    diwaliSeasonActive: true,
  }),
  'all includes every catalogue row',
);

assert(
  productBelongsToCollection({
    collectionId: 'fresh',
    shelfId: 'fruits',
    productName: 'Apples',
    brand: 'Fresh',
    diwaliSeasonActive: true,
  }),
  'fresh includes fruits shelf',
);

assert(
  !productBelongsToCollection({
    collectionId: 'diwali',
    shelfId: 'preview-dry-fruits',
    productName: 'Cashew',
    brand: 'Whole Farm',
    diwaliSeasonActive: false,
  }),
  'inactive Diwali season excludes festive products',
);

assert(
  productBelongsToCollection({
    collectionId: 'diwali',
    shelfId: 'preview-dry-fruits',
    productName: 'Cashew',
    brand: 'Whole Farm',
    diwaliSeasonActive: true,
  }),
  'active Diwali season includes dry fruits',
);

assert(
  !productBelongsToCollection({
    collectionId: 'electronics',
    shelfId: 'fruits',
    productName: 'Apples',
    brand: 'Fresh',
    diwaliSeasonActive: true,
  }),
  'electronics stays empty without electronics shelves',
);

assert(
  chipIdsForCollectionProduct({
    collectionId: 'diwali',
    shelfId: 'preview-dry-fruits',
    productName: 'Cashew',
  })[0] === 'dry-fruits',
  'diwali dry-fruit chip',
);

assert(
  chipIdsForCollectionProduct({
    collectionId: 'fresh',
    shelfId: 'dairy-eggs',
    productName: 'Eggs',
  })[0] === 'dairy-eggs',
  'fresh dairy chip',
);

console.log('shopping collections fixtures passed');
