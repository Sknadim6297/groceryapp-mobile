import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
import { contentColumnWidth } from '@/utils/contentWidth';
import { useCatalog } from '@/context/CatalogContext';
import { useWishlist } from '@/context/WishlistContext';
import { resolveWishlistEntries, type WishlistEntry } from '@/data/resolveWishlistProducts';

const PAGE_PAD = 32;
const CARD_GAP = 8;

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { findProduct } = useCatalog();
  const { hydrated, ids, count, remove } = useWishlist();
  const columns = productColumns(width, 2, PAGE_PAD, CARD_GAP);
  const cardWidth = productCardWidth(width, columns, PAGE_PAD, CARD_GAP);
  const contentWidth = contentColumnWidth(width);
  const entries = useMemo(() => resolveWishlistEntries(ids, findProduct), [findProduct, ids]);

  if (!hydrated) {
    return (
      <View style={[styles.screen, styles.centered]} accessibilityLabel="Loading wishlist">
        <ActivityIndicator color={colors.primaryInk} />
      </View>
    );
  }

  const savedLabel = count === 1 ? '1 saved item' : `${count} saved items`;

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Favorites List" />
      <View style={styles.chrome}>
        <BrandCatalogBanner />
        <CatalogBreadcrumb
          crumbs={[
            { label: 'Shop', onPress: () => router.push('/shop') },
            { label: 'Favorites' },
          ]}
        />
        <Text style={styles.count}>{savedLabel}</Text>
      </View>

      {entries.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <EmptyState
            title="Your wishlist is empty"
            body="Save your favorite products here and find them anytime."
            art={
              <View style={styles.emptyIcon}>
                <AppIcon name="heart" color={colors.danger} size={36} />
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
          data={entries}
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
              {item.kind === 'ready' ? (
                <ProductCard product={item.product} compact={cardWidth < 100} />
              ) : (
                <UnavailableCard entry={item} onRemove={() => remove(item.id)} />
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

function UnavailableCard({ entry, onRemove }: { entry: Extract<WishlistEntry, { kind: 'unavailable' }>; onRemove: () => void }) {
  return (
    <View style={styles.unavailable}>
      <View style={styles.unavailableTop}>
        <View style={styles.unavailablePhoto}>
          <AppIcon name="bag" color={colors.textSecondary} size={28} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove unavailable item ${entry.id} from wishlist`}
          hitSlop={8}
          onPress={onRemove}
          style={styles.heart}>
          <AppIcon name="heartFill" color={colors.danger} size={16} />
        </Pressable>
      </View>
      <Text numberOfLines={2} style={styles.unavailableName}>
        Item unavailable
      </Text>
      <Text numberOfLines={1} style={styles.unavailableMeta}>
        No longer in the catalogue
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Remove from wishlist"
        onPress={onRemove}
        style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
        <Text style={styles.removeLabel}>REMOVE</Text>
      </Pressable>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAction: {
    width: '100%',
    maxWidth: 320,
  },
  unavailable: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 6,
  },
  unavailableTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unavailablePhoto: {
    flex: 1,
    aspectRatio: 1.22,
    borderRadius: 10,
    backgroundColor: '#F6F7F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  unavailableName: {
    marginTop: 6,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 15,
    color: colors.text,
  },
  unavailableMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  remove: {
    marginTop: 8,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 15,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.75,
  },
});
