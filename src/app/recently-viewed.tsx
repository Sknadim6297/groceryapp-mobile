import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandCatalogBanner } from '@/components/catalog/BrandCatalogBanner';
import { CatalogBreadcrumb } from '@/components/catalog/CatalogBreadcrumb';
import { ProductCard } from '@/components/home/ProductCard';
import { productCardWidth, productColumns } from '@/components/home/productLayout';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { useCatalog } from '@/context/CatalogContext';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import { resolveRecentlyViewedProducts } from '@/data/resolveRecentlyViewedProducts';
import { contentColumnWidth } from '@/utils/contentWidth';

const PAGE_PAD = 32;
const CARD_GAP = 8;
const HISTORY_LIMIT = 20;

export default function RecentlyViewedScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { findProduct } = useCatalog();
  const { hydrated, ids } = useRecentlyViewed();
  const columns = productColumns(width, 2, PAGE_PAD, CARD_GAP);
  const cardWidth = productCardWidth(width, columns, PAGE_PAD, CARD_GAP);
  const contentWidth = contentColumnWidth(width);
  const products = useMemo(
    () => resolveRecentlyViewedProducts(ids, findProduct, HISTORY_LIMIT),
    [findProduct, ids],
  );

  if (!hydrated) {
    return (
      <View style={[styles.screen, styles.centered]} accessibilityLabel="Loading recently viewed">
        <ActivityIndicator color={colors.primaryInk} />
      </View>
    );
  }

  const countLabel =
    products.length === 1 ? '1 recently viewed item' : `${products.length} recently viewed items`;

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Recently viewed" />
      <View style={styles.chrome}>
        <BrandCatalogBanner />
        <CatalogBreadcrumb
          crumbs={[
            { label: 'Home', onPress: () => router.push('/home') },
            { label: 'Recently viewed' },
          ]}
        />
        <Text style={styles.count}>{countLabel}</Text>
      </View>

      {products.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <EmptyState
            title="No recently viewed products"
            body="Open a product to add it here. History stays on this device for your current account."
            art={
              <View style={styles.emptyIcon}>
                <AppIcon name="bag" color={colors.textSecondary} size={36} />
              </View>
            }
            action={
              <View style={styles.emptyAction}>
                <PrimaryButton
                  label="Explore Products"
                  accessibilityLabel="Explore Products"
                  onPress={() => router.push('/shop')}
                />
              </View>
            }
          />
        </View>
      ) : (
        <FlatList
          data={products}
          key={columns}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            {
              width: contentWidth,
              alignSelf: 'center',
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
          columnWrapperStyle={columns > 1 ? styles.row : undefined}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
          renderItem={({ item }) => (
            <View style={{ width: cardWidth }}>
              <ProductCard product={item} compact={cardWidth < 100} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.softBackground,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chrome: {
    paddingHorizontal: homeLayout.gutter,
    paddingBottom: 8,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  count: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emptyAction: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
});
