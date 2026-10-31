import { UI_PREVIEW_MODE } from '@/constants/preview';
import { previewCategoryById } from '@/data/previewImageCatalog';
import type { Category } from '@/types/category';

/** Local demo categories for the home grid. This is not a live catalogue. */
export const mockCategories: Category[] = [
  {
    id: 'fruits',
    name: 'Fruits & Vegetables',
    image: require('@/assets/images/home/produce.jpg'),
  },
  {
    id: 'dairy-eggs',
    name: 'Dairy & Eggs',
    image: require('@/assets/images/home/dairy-eggs.jpg'),
  },
  {
    id: 'grains',
    name: 'Atta, Rice & Grains',
    image: require('@/assets/images/home/grains.jpg'),
  },
  {
    id: 'masala',
    name: 'Masala & Cooking',
    image: require('@/assets/images/home/masala.jpg'),
  },
  {
    id: 'snacks',
    name: 'Snacks & Beverages',
    image: require('@/assets/images/home/snacks-drinks.jpg'),
  },
  {
    id: 'personal',
    name: 'Personal Care',
    image: require('@/assets/images/home/personal.jpg'),
  },
  {
    id: 'household',
    name: 'Household Essentials',
    image: require('@/assets/images/home/household.jpg'),
  },
  {
    id: 'baby',
    name: 'Baby Care',
    image: require('@/assets/images/home/baby-care.jpg'),
  },
];

export function findMockCategory(id: string | undefined): Category | undefined {
  if (!id) {
    return undefined;
  }

  if (UI_PREVIEW_MODE) {
    const preview = previewCategoryById(id);
    if (preview) {
      return preview;
    }
  }

  return mockCategories.find((category) => category.id === id);
}
