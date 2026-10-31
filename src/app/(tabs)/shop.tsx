import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ProductCard } from '@/components/home/ProductCard';
import { PreviewScaffold } from '@/components/preview/PreviewScaffold';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { listCatalogProducts } from '@/data/listCatalogProducts';
import { findMockBrand } from '@/data/mockBrands';
import { findMockCategory } from '@/data/mockCategories';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ShopScreen() {
  const params = useLocalSearchParams<{ category?: string | string[]; brand?: string | string[]; q?: string | string[] }>();
  const category = findMockCategory(firstParam(params.category));
  const brand = findMockBrand(firstParam(params.brand));
  const initialQuery = firstParam(params.q) ?? '';
  const [query, setQuery] = useState(initialQuery);
  const products = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return listCatalogProducts().filter((product) =>
      needle.length === 0 ? true : product.name.toLowerCase().includes(needle),
    );
  }, [query]);

  if (!UI_PREVIEW_MODE) {
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

  const title = category?.name ?? (brand ? brand.name : 'Shop');

  return (
    <PreviewScaffold title={title} subtitle="Preview catalogue. Not a live inventory.">
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search this preview list"
        placeholderTextColor="#94A3B8"
        style={styles.search}
        accessibilityLabel="Search preview products"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.note}>
        {category
          ? `${category.name} opens this preview list. Items are not filtered by a live category feed.`
          : 'Prices are the demo catalogue figures, not a live offer.'}
      </Text>
      <View style={styles.grid}>
        {products.map((product) => (
          <Pressable
            key={product.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${product.name}`}
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
            style={styles.cell}>
            <ProductCard product={product} compact tile />
          </Pressable>
        ))}
      </View>
      {products.length === 0 ? <Text style={styles.empty}>No preview items match that search.</Text> : null}
    </PreviewScaffold>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '48%',
  },
  empty: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
});
