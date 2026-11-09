import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogSearchField } from '@/components/catalog/CatalogSearchField';
import { ProductFilterSortBar } from '@/components/catalog/ProductFilterSortBar';
import { ProductFiltersSheet } from '@/components/catalog/ProductFiltersSheet';
import { ProductSortSheet } from '@/components/catalog/ProductSortSheet';
import { CategoryHero } from '@/components/collection/CategoryHero';
import { CollectionFilterChips } from '@/components/collection/CollectionFilterChips';
import { ProductCard } from '@/components/home/ProductCard';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { CatalogStatusPanel } from '@/components/ui/CatalogStatusPanel';
import { ProductGridSkeleton } from '@/components/ui/LoadingSkeleton';
import { useCatalog } from '@/context/CatalogContext';
import { useMockCart } from '@/context/MockCartContext';
import {
  filterCollectionByChip,
  getShoppingCollection,
  listCollectionChips,
  listCollectionProducts,
} from '@/data/shoppingCollections';
import { useProductListingControls } from '@/hooks/useProductListingControls';
import type { ShoppingCollectionId } from '@/types/shoppingCollection';
import { buildCategoryOptions, type ListedProduct } from '@/utils/productFilters';
import { contentColumnWidth } from '@/utils/contentWidth';

type CategoryShoppingScreenProps = {
  collectionId: ShoppingCollectionId;
};

export function CategoryShoppingScreen({ collectionId }: CategoryShoppingScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = contentColumnWidth(width);
  const { totalCount } = useMockCart();
  const { products, listShelves, liveEnabled, initialLoading, state, message, refresh, refreshing } = useCatalog();
  const [retrying, setRetrying] = useState(false);
  const definition = getShoppingCollection(collectionId);

  async function handleRetry() {
    if (retrying) {
      return;
    }
    setRetrying(true);
    try {
      await refresh();
    } finally {
      setRetrying(false);
    }
  }
  const [query, setQuery] = useState('');
  const [chipId, setChipId] = useState('all');
  const listRef = useRef<{ scrollToOffset: (options: { offset: number; animated?: boolean }) => void } | null>(
    null,
  );

  const shelves = useMemo(() => listShelves(), [listShelves]);
  const baseProducts = useMemo(
    () => listCollectionProducts(collectionId, products, shelves),
    [collectionId, products, shelves],
  );
  const chips = useMemo(() => listCollectionChips(collectionId, baseProducts), [baseProducts, collectionId]);

  useEffect(() => {
    setChipId('all');
    setQuery('');
  }, [collectionId]);

  useEffect(() => {
    if (!chips.some((chip) => chip.id === chipId)) {
      setChipId('all');
    }
  }, [chipId, chips]);

  const chipProducts = useMemo(() => filterCollectionByChip(baseProducts, chipId), [baseProducts, chipId]);
  const pool = useMemo<ListedProduct[]>(
    () =>
      chipProducts.map((product) => ({
        ...product,
        shelfId: product.shelfId,
      })),
    [chipProducts],
  );
  const categoryOptions = useMemo(() => buildCategoryOptionsFromPool(pool), [pool]);

  const listing = useProductListingControls({
    pool,
    query,
    scopeKey: `${collectionId}:${chipId}`,
  });

  const gap = 10;
  const gutter = homeLayout.gutter;
  const gridInner = Math.max(0, contentWidth - gutter * 2);
  const pairedWidth = Math.floor((gridInner - gap) / 2);
  const columns = pairedWidth >= 140 ? 2 : 1;
  const cardWidth = columns === 2 ? pairedWidth : gridInner;

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [chipId, query, listing.filters, listing.sort]);

  if (!definition) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title="Collection" fallbackHref="/home" />
        <View style={styles.fallback}>
          <Text style={styles.emptyTitle}>Collection unavailable</Text>
          <Text style={styles.emptyBody}>This shopping shortcut could not be opened.</Text>
          <PrimaryButton label="Back to Home" onPress={() => router.replace('/home')} />
        </View>
      </View>
    );
  }

  if (liveEnabled && initialLoading) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title={definition.title} fallbackHref="/home" />
        <ProductGridSkeleton columns={columns} count={6} cardWidth={cardWidth} />
      </View>
    );
  }

  if (liveEnabled && state.status === 'error' && products.length === 0) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title={definition.title} fallbackHref="/home" />
        <CatalogStatusPanel
          kind="error"
          message={message}
          onRetry={() => void handleRetry()}
          retrying={retrying || refreshing}
        />
      </View>
    );
  }

  const needle = query.trim();
  const seasonalClosed = collectionId === 'diwali' && definition.seasonActive === false;
  const emptyCatalogue = baseProducts.length === 0;

  return (
    <View style={styles.screen}>
      <View style={[styles.column, { width: contentWidth }]}>
        <AppScreenHeader
          title={definition.title}
          fallbackHref="/home"
          titleWeight="semibold"
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={totalCount > 0 ? `Cart, ${totalCount} items` : 'Cart'}
              onPress={() => router.push('/cart')}
              style={({ pressed }) => [styles.cartButton, pressed && styles.pressed]}
              testID="collection-cart">
              <AppIcon name="cart" color={colors.text} size={22} />
              {totalCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeLabel}>{totalCount > 99 ? '99+' : String(totalCount)}</Text>
                </View>
              ) : null}
            </Pressable>
          }
        />

        <FlatList
          ref={(node) => {
            listRef.current = node;
          }}
          key={`${columns}-${cardWidth}`}
          data={seasonalClosed || emptyCatalogue ? [] : listing.products}
          keyExtractor={(product) => product.id}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? styles.row : undefined}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 12 },
            listing.products.length === 0 || emptyCatalogue || seasonalClosed ? styles.listGrow : null,
          ]}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <CategoryHero
                title={definition.title}
                subtitle={definition.subtitle}
                icon={definition.icon}
                tone={definition.heroTone}
                badgeLabel={definition.badgeLabel}
                itemCount={baseProducts.length}
              />

              <CatalogSearchField
                value={query}
                onChange={setQuery}
                placeholder={`Search in ${definition.title}`}
                accessibilityLabel={`Search in ${definition.title}`}
                testID="collection-search"
              />

              <CollectionFilterChips chips={chips} value={chipId} onChange={setChipId} />

              {!emptyCatalogue && !seasonalClosed ? (
                <View style={styles.tools}>
                  <ProductFilterSortBar
                    sort={listing.sort}
                    activeFilterCount={listing.activeFilterCount}
                    onOpenFilters={listing.openFilters}
                    onOpenSort={listing.openSort}
                  />
                  <Text style={styles.resultCount} testID="collection-item-count">
                    {listing.resultCount} {listing.resultCount === 1 ? 'item' : 'items'}
                    {needle || listing.hasActiveFilters ? ' match' : ''}
                  </Text>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <CollectionEmptyState
              seasonalClosed={seasonalClosed}
              emptyCatalogue={emptyCatalogue}
              hasQuery={needle.length > 0}
              hasFilters={listing.hasActiveFilters}
              title={definition.emptyTitle}
              body={definition.emptyBody}
              onClearSearch={() => setQuery('')}
              onClearFilters={listing.clearFilters}
            />
          }
          renderItem={({ item }) => (
            <View style={{ width: cardWidth }}>
              <ProductCard product={item} compact={cardWidth < 150} />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={8}
          windowSize={7}
          testID="collection-product-list"
        />
      </View>

      <ProductFiltersSheet
        visible={listing.filtersOpen}
        applied={listing.filters}
        categories={categoryOptions}
        pricePool={pool}
        stockFilterSupported={listing.stockFilterSupported}
        previewCount={listing.previewCount}
        onApply={listing.applyFilters}
        onClose={listing.closeFilters}
      />
      <ProductSortSheet
        visible={listing.sortOpen}
        selected={listing.sort}
        onSelect={listing.selectSort}
        onClose={listing.closeSort}
      />
    </View>
  );
}

function CollectionEmptyState({
  seasonalClosed,
  emptyCatalogue,
  hasQuery,
  hasFilters,
  title,
  body,
  onClearSearch,
  onClearFilters,
}: {
  seasonalClosed: boolean;
  emptyCatalogue: boolean;
  hasQuery: boolean;
  hasFilters: boolean;
  title: string;
  body: string;
  onClearSearch: () => void;
  onClearFilters: () => void;
}) {
  if (seasonalClosed || emptyCatalogue) {
    return (
      <View style={styles.empty} testID="collection-empty">
        <View style={styles.emptyIcon}>
          <AppIcon name="box" color={colors.primaryInk} size={28} />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyBody}>{body}</Text>
        <PrimaryButton
          label="Browse All Products"
          onPress={() => router.replace({ pathname: '/collection/[id]', params: { id: 'all' } })}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          onPress={() => router.replace('/home')}
          style={({ pressed }) => [styles.secondaryLink, pressed && styles.pressed]}>
          <Text style={styles.secondaryLinkLabel}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.empty} testID="collection-empty-results">
      <View style={styles.emptyIcon}>
        <AppIcon name="search" color={colors.primaryInk} size={26} />
      </View>
      <Text style={styles.emptyTitle}>
        {hasQuery || hasFilters ? 'No matching products' : 'No products here'}
      </Text>
      <Text style={styles.emptyBody}>
        {hasQuery || hasFilters
          ? 'Try a different search term or clear filters to see more items.'
          : 'Nothing is listed in this filter yet.'}
      </Text>
      {hasQuery ? (
        <PrimaryButton label="Clear search" onPress={onClearSearch} />
      ) : null}
      {hasFilters ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear filters"
          onPress={onClearFilters}
          style={({ pressed }) => [styles.clearFilters, pressed && styles.pressed]}
          testID="collection-clear-filters">
          <Text style={styles.clearFiltersLabel}>Clear filters</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function buildCategoryOptionsFromPool(pool: readonly ListedProduct[]) {
  const byShelf = new Map<string, ListedProduct[]>();
  for (const product of pool) {
    if (!product.shelfId) {
      continue;
    }
    const bucket = byShelf.get(product.shelfId) ?? [];
    bucket.push(product);
    byShelf.set(product.shelfId, bucket);
  }
  return buildCategoryOptions(
    [...byShelf.entries()].map(([id, products]) => ({
      id,
      name: id,
      products,
    })),
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.warmBackground,
  },
  column: {
    flex: 1,
    width: '100%',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: homeLayout.gutter,
    flexGrow: 1,
  },
  listGrow: {
    flexGrow: 1,
  },
  headerBlock: {
    gap: space.md,
    marginBottom: space.md,
    paddingTop: space.sm,
  },
  tools: {
    gap: space.sm,
  },
  resultCount: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  row: {
    gap: 10,
    marginBottom: 10,
  },
  cartButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.white,
    includeFontPadding: false,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...shadow.soft,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  clearFilters: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFiltersLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  secondaryLink: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryLinkLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  pressed: {
    opacity: 0.78,
  },
});
