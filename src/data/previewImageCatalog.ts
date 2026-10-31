import type { Category } from '@/types/category';
import type { DemoProduct } from '@/types/catalog';

/**
 * Temporary third-party image URLs for internal UI Preview only.
 * HTTP collection links stay HTTP: the HTTPS copies returned 403 here, so the scheme was not changed.
 * Store, product, and icon links were already HTTPS and returned an image.
 * These figures on products are copied from the supplied list. They are not live prices or stock.
 */

export type PreviewCategoryImage = {
  kind: 'category';
  id: string;
  name: string;
  url: string;
};

export type PreviewStoreImage = {
  kind: 'store';
  id: string;
  name: string;
  url: string;
};

export type PreviewProductImage = {
  kind: 'product';
  id: string;
  name: string;
  unit: string;
  price: number;
  compareAt: number;
  discountLabel: string;
  url: string;
};

export type PreviewIconImage = {
  kind: 'icon';
  id: string;
  name: string;
  url: string;
};

export type PreviewImage =
  | PreviewCategoryImage
  | PreviewStoreImage
  | PreviewProductImage
  | PreviewIconImage;

const categories: PreviewCategoryImage[] = [
  { kind: 'category', id: 'fruits', name: 'Vegetables & Fruits', url: 'https://cdn.grofers.com/app/images/collections/asset_V7_312x360_1776063046796' },
  { kind: 'category', id: 'grains', name: 'Atta, Rice & Dal', url: 'http://cdn.grofers.com/app/images/collections/asset_atta,_rice_&_dal_1697023078302' },
  { kind: 'category', id: 'masala', name: 'Oil, Ghee & Masala', url: 'http://cdn.grofers.com/app/images/collections/asset_Oil,_ghee_&_masala_1697023177309' },
  { kind: 'category', id: 'dairy-eggs', name: 'Dairy, Bread & Eggs', url: 'https://cdn.grofers.com/app/images/collections/asset_Dairy,_bread_&_eggs_1697439479199' },
  { kind: 'category', id: 'preview-bakery', name: 'Bakery & Biscuits', url: 'https://cdn.grofers.com/app/images/collections/asset_Biscuits_&_bakery_1697023878012' },
  { kind: 'category', id: 'preview-dry-fruits', name: 'Dry Fruits & Cereals', url: 'http://cdn.grofers.com/app/images/collections/asset_Dry_Fruits_&_Cereals_(1)_1727547591238' },
  { kind: 'category', id: 'preview-meat', name: 'Chicken, Meat & Fish', url: 'http://cdn.grofers.com/app/images/collections/asset_chicken,_meat_&_fish_1697025365538' },
  { kind: 'category', id: 'preview-kitchen', name: 'Kitchenware & Appliances', url: 'http://cdn.grofers.com/app/images/collections/asset_Kitchen_Utensils_&_1697802997422' },
  { kind: 'category', id: 'snacks', name: 'Chips & Namkeen', url: 'http://cdn.grofers.com/app/images/collections/asset_V1_0_1782816119615' },
  { kind: 'category', id: 'preview-sweets', name: 'Sweets & Chocolates', url: 'http://cdn.grofers.com/app/images/collections/asset_Sweets_&_chocolates_1697025717829' },
  { kind: 'category', id: 'preview-drinks', name: 'Drinks & Juices', url: 'http://cdn.grofers.com/app/images/collections/asset_V7_312x360_(2)_1774455548692' },
  { kind: 'category', id: 'preview-tea', name: 'Tea, Coffee & Milk Drinks', url: 'http://cdn.grofers.com/app/images/collections/asset_L0_v1_0_1746557294148' },
  { kind: 'category', id: 'preview-instant', name: 'Instant Food', url: 'https://cdn.grofers.com/app/images/collections/asset_Instant_Food_(2)_1766127254031' },
  { kind: 'category', id: 'preview-sauces', name: 'Sauces & Spreads', url: 'http://cdn.grofers.com/app/images/collections/asset_sauces_&_spreads_1697025783179' },
  { kind: 'category', id: 'preview-paan', name: 'Paan Corner', url: 'https://cdn.grofers.com/app/images/collections/asset_312x360_(1)_1750440200815' },
  { kind: 'category', id: 'preview-icecream', name: 'Ice Creams & More', url: 'https://cdn.grofers.com/app/images/collections/asset_V7_312x360_(1)_1763118369111' },
  { kind: 'category', id: 'personal', name: 'Bath & Body', url: 'http://cdn.grofers.com/app/images/collections/asset_Bath_&_Body_1697028879274' },
  { kind: 'category', id: 'preview-hair', name: 'Hair', url: 'https://cdn.grofers.com/app/images/collections/asset_Hair_1697025936187' },
  { kind: 'category', id: 'preview-skin', name: 'Skin & Face', url: 'http://cdn.grofers.com/app/images/collections/asset_Skin_&_face_(1)_1710665369044' },
  { kind: 'category', id: 'preview-beauty', name: 'Beauty & Cosmetics', url: 'http://cdn.grofers.com/app/images/collections/asset_Beauty_&_Cosmetics_1714732446632' },
  { kind: 'category', id: 'preview-feminine', name: 'Feminine Hygiene', url: 'https://cdn.grofers.com/app/images/collections/asset_Feminine_hygiene_1697028415717' },
  { kind: 'category', id: 'baby', name: 'Baby Care', url: 'http://cdn.grofers.com/app/images/collections/asset_V7_312x360_1778246752991' },
  { kind: 'category', id: 'preview-health', name: 'Health & Pharma', url: 'https://cdn.grofers.com/app/images/collections/asset_Health_&_pharma_1697028551531' },
  { kind: 'category', id: 'preview-wellness', name: 'Sexual Wellness', url: 'http://cdn.grofers.com/app/images/collections/asset_Sexual_wellness_1697028588156' },
  { kind: 'category', id: 'household', name: 'Home & Lifestyle', url: 'https://cdn.grofers.com/app/images/collections/asset_312x360_(2)_1752670450422' },
  { kind: 'category', id: 'preview-cleaners', name: 'Cleaners & Repellents', url: 'https://cdn.grofers.com/app/images/collections/asset_Cleaning_&_repellants-3_1711101791295' },
  { kind: 'category', id: 'preview-electronics', name: 'Electronics', url: 'http://cdn.grofers.com/app/images/collections/asset_Electronics_1697028762316' },
  { kind: 'category', id: 'preview-stationery', name: 'Stationery & Games', url: 'http://cdn.grofers.com/app/images/collections/asset_Stationery_&_Games_1698999971211' },
];

const stores: PreviewStoreImage[] = [
  { kind: 'store', id: 'preview-toy-store', name: 'Toy Store', url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2023-07/toys-store_1.png' },
  { kind: 'store', id: 'preview-book-store', name: 'Book Store', url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2023-07/book-store.png' },
  { kind: 'store', id: 'preview-pet-store', name: 'Pet Store', url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2024-05/pet-store-new-icon-1.png' },
  { kind: 'store', id: 'preview-pharma-store', name: 'Pharma Store', url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2024-06/Pharma-Store_store-icon-1.png' },
];

const products: PreviewProductImage[] = [
  {
    kind: 'product',
    id: 'preview-cashew',
    name: 'Whole Farm Grocery Cashew',
    unit: '200 g',
    price: 217,
    compareAt: 299,
    discountLabel: '27% OFF',
    url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/da/cms-assets/cms/product/7fa9edba-b515-477b-870f-a59d36950455.png?bg_token=Colour%2Fsurface%2F00FFFFFF',
  },
  {
    kind: 'product',
    id: 'preview-almonds',
    name: 'Whole Farm Grocery Almonds',
    unit: '200 g',
    price: 235,
    compareAt: 395,
    discountLabel: '40% OFF',
    url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/da/cms-assets/cms/product/f5b197a1-1d8b-43aa-9040-b444ed2c7344.png',
  },
  {
    kind: 'product',
    id: 'preview-makhana',
    name: 'Whole Farm Grocery Raw Makhana',
    unit: '100 g',
    price: 107,
    compareAt: 210,
    discountLabel: '49% OFF',
    url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/da/cms-assets/cms/product/19217ea1-db1d-48a3-bb0d-733615c083d2.png?bg_token=Colour%2Fsurface%2F00FFFFFF',
  },
];

const deliveryIcon: PreviewIconImage = {
  kind: 'icon',
  id: 'preview-eta',
  name: '15-mins ETA Icon',
  url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=90/assets/eta-icons/15-mins.png',
};

export const previewImages: readonly PreviewImage[] = [...categories, ...stores, ...products, deliveryIcon];

if (previewImages.length !== 36) {
  throw new Error(`Expected 36 preview images, found ${previewImages.length}.`);
}

const urls = new Set(previewImages.map((entry) => entry.url));
if (urls.size !== previewImages.length) {
  throw new Error('Preview image URLs must be unique.');
}

const categoryGroups: { title: string; ids: string[] }[] = [
  {
    title: 'Grocery & Kitchen',
    ids: ['fruits', 'grains', 'masala', 'dairy-eggs', 'preview-bakery', 'preview-dry-fruits', 'preview-meat', 'preview-kitchen'],
  },
  {
    title: 'Snacks & Drinks',
    ids: ['snacks', 'preview-sweets', 'preview-drinks', 'preview-tea', 'preview-instant', 'preview-sauces', 'preview-paan', 'preview-icecream'],
  },
  {
    title: 'Beauty & Personal Care',
    ids: ['personal', 'preview-hair', 'preview-skin', 'preview-beauty', 'preview-feminine', 'baby', 'preview-health', 'preview-wellness'],
  },
  {
    title: 'Household Essentials',
    ids: ['household', 'preview-cleaners', 'preview-electronics', 'preview-stationery'],
  },
];

const groupedIds = categoryGroups.flatMap((group) => group.ids);
if (groupedIds.length !== categories.length || new Set(groupedIds).size !== categories.length) {
  throw new Error('Every preview category must appear in exactly one group.');
}

/** Preview-only name and photo for a Daily essentials card when a supplied image matches. */
const dailyEssentialPreview: Record<string, { name: string; categoryId: string }> = {
  bread: { name: 'Bakery & Biscuits', categoryId: 'preview-bakery' },
  beverages: { name: 'Drinks & Juices', categoryId: 'preview-drinks' },
  cleaning: { name: 'Cleaners & Repellents', categoryId: 'preview-cleaners' },
};

export function previewCategoryCards(): Category[] {
  return categories.map(toCategory);
}

export function previewCategoryGroups(): { title: string; categories: Category[] }[] {
  return categoryGroups.map((group) => ({
    title: group.title,
    categories: group.ids.map((id) => {
      const entry = categories.find((category) => category.id === id);
      if (!entry) {
        throw new Error(`Missing preview category ${id}.`);
      }
      return toCategory(entry);
    }),
  }));
}

export function previewDailyEssentialOverride(id: string): { name: string; uri: string } | undefined {
  const match = dailyEssentialPreview[id];
  const entry = match ? categories.find((category) => category.id === match.categoryId) : undefined;
  if (!match || !entry) {
    return undefined;
  }
  return { name: match.name, uri: entry.url };
}

function toCategory(entry: PreviewCategoryImage): Category {
  return { id: entry.id, name: entry.name, image: { uri: entry.url } };
}

export function previewCategoryById(id: string): Category | undefined {
  const entry = categories.find((category) => category.id === id);
  if (!entry) {
    return undefined;
  }
  return { id: entry.id, name: entry.name, image: { uri: entry.url } };
}

export function previewStoreCards(): PreviewStoreImage[] {
  return stores;
}

export function previewDryFruitProducts(): DemoProduct[] {
  return products.map((entry) => ({
    id: entry.id,
    name: entry.name,
    unit: entry.unit,
    price: entry.price,
    compareAt: entry.compareAt,
    discountLabel: entry.discountLabel,
    image: { uri: entry.url },
  }));
}

export function previewDeliveryIconUrl(): string {
  return deliveryIcon.url;
}
