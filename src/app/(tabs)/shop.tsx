import { useLocalSearchParams } from 'expo-router';

import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { findMockBrand } from '@/data/mockBrands';
import { findMockCategory } from '@/data/mockCategories';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ShopScreen() {
  const params = useLocalSearchParams<{ category?: string | string[]; brand?: string | string[] }>();
  const category = findMockCategory(firstParam(params.category));
  const brand = findMockBrand(firstParam(params.brand));
  const detail = brand
    ? `Demo brand: ${brand.name}. This is not a live supplier.`
    : category
      ? `Selected category: ${category.name}`
      : undefined;

  return (
    <PlaceholderScreen
      title="Shop"
      message="This is a placeholder. Product browsing is not connected yet."
      detail={detail}
    />
  );
}
