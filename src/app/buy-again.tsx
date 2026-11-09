import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMemo } from 'react';

import { ProductCard } from '@/components/home/ProductCard';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { useCatalog } from '@/context/CatalogContext';
import { listBuyAgainProducts } from '@/data/listCatalogProducts';

export default function BuyAgainScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { liveEnabled, products: catalogProducts } = useCatalog();
  const contentWidth = Math.min(width, homeLayout.maxWidth);
  const gutter = homeLayout.gutter;
  const gap = 10;
  const cardWidth = (contentWidth - gutter * 2 - gap) / 2;
  const products = useMemo(() => {
    if (liveEnabled) {
      // No past-order API yet — surface live catalogue so Buy Again stays usable.
      return catalogProducts.slice(0, 24);
    }
    return listBuyAgainProducts();
  }, [catalogProducts, liveEnabled]);

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Buy Again" fallbackHref="/home" />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20), maxWidth: homeLayout.maxWidth, width: '100%', alignSelf: 'center' },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            {UI_PREVIEW_MODE ? (
              <DemoBanner message="Buy Again uses local catalogue fixtures until past-order APIs exist." />
            ) : liveEnabled ? (
              <Text style={styles.note}>Showing live catalogue products until past-order history is connected.</Text>
            ) : (
              <Text style={styles.note}>Items you’ve purchased before will appear here when order history is connected.</Text>
            )}
          </View>
        }
        ListEmptyComponent={<Text style={styles.note}>No buy-again products available yet.</Text>}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <ProductCard product={item} compact={cardWidth < 140} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.softBackground },
  content: { paddingHorizontal: homeLayout.gutter, paddingTop: 12 },
  header: { marginBottom: 12 },
  row: { gap: 10, marginBottom: 10 },
  note: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
