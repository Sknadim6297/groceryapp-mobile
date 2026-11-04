import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogBreadcrumb } from '@/components/catalog/CatalogBreadcrumb';
import { CatalogSearchField } from '@/components/catalog/CatalogSearchField';
import { ProductFilterSortBar } from '@/components/catalog/ProductFilterSortBar';
import { ProductFiltersSheet } from '@/components/catalog/ProductFiltersSheet';
import { ProductSortSheet } from '@/components/catalog/ProductSortSheet';
import { CatalogImage } from '@/components/home/CatalogImage';
import { ProductCard } from '@/components/home/ProductCard';
import { SearchSuggestions } from '@/components/home/SearchSuggestions';
import type { SearchSuggestion } from '@/data/searchSuggestions';
import { SideMenu } from '@/components/home/SideMenu';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { contentColumnWidth } from '@/utils/contentWidth';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { buildReviewSummary, previewReviewsForProduct } from '@/data/productReviews';
import { listShopShelves, type ShopShelf } from '@/data/shopCatalog';
import { resolveParentIdForCategory } from '@/data/subcategoryCatalog';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import { useProductListingControls } from '@/hooks/useProductListingControls';
import { buildCategoryOptions, matchesSearch, type ListedProduct } from '@/utils/productFilters';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function shelfForQuery(value: string): string | undefined {
  const needle = value.trim().toLowerCase();
  if (needle.length === 0) {
    return undefined;
  }
  return listShopShelves().find((shelf) => shelf.products.some((product) => matchesSearch(product, needle)))?.id;
}

function itemLabel(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

function buildListingPool(shelves: readonly ShopShelf[]): ListedProduct[] {
  const seen = new Set<string>();
  const pool: ListedProduct[] = [];
  for (const shelf of shelves) {
    for (const product of shelf.products) {
      if (seen.has(product.id)) {
        continue;
      }
      seen.add(product.id);
      const ratingAverage = UI_PREVIEW_MODE
        ? buildReviewSummary(previewReviewsForProduct(product)).average
        : undefined;
      pool.push({ ...product, shelfId: shelf.id, ratingAverage });
    }
  }
  return pool;
}

export default function ShopScreen() {
  const params = useLocalSearchParams<{ category?: string | string[]; q?: string | string[] }>();
  const requested = firstParam(params.category);
  const routeQuery = firstParam(params.q) ?? '';
  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap();
  const { width } = useWindowDimensions();
  const contentWidth = contentColumnWidth(width);
  const sidebarWidth = contentWidth < 380 ? 70 : 84;
  const cardGap = 8;
  const cardInset = 8;
  const gridWidth = Math.max(0, contentWidth - sidebarWidth);
  const gridInner = Math.max(0, gridWidth - cardInset * 2);
  const pairedWidth = Math.floor((gridInner - cardGap) / 2);
  const columns = pairedWidth >= 96 ? 2 : 1;
  const cardWidth = columns === 2 ? pairedWidth : gridInner;
  const shelves = useMemo(() => listShopShelves(requested), [requested]);
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [seenRequest, setSeenRequest] = useState(requested);
  const [draftQuery, setDraftQuery] = useState<string | null>(null);
  const [seenQuery, setSeenQuery] = useState(routeQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const listRef = useRef<{ scrollToOffset: (options: { offset: number; animated?: boolean }) => void } | null>(null);

  if (requested !== seenRequest) {
    setSeenRequest(requested);
    setOverrideId(null);
  }

  if (routeQuery !== seenQuery) {
    setSeenQuery(routeQuery);
    setDraftQuery(null);
  }

  const query = draftQuery ?? routeQuery;
  const selectedId = overrideId ?? requested ?? shelfForQuery(routeQuery);
  const active =
    shelves.find((shelf) => shelf.id === selectedId) ??
    shelves.find((shelf) => shelf.products.length > 0) ??
    shelves[0];
  const needle = query.trim().toLowerCase();
  const pool = useMemo(() => buildListingPool(shelves), [shelves]);
  const categoryOptions = useMemo(() => buildCategoryOptions(shelves), [shelves]);
  const listing = useProductListingControls({
    pool,
    query,
    activeShelfId: active?.id,
    scopeKey: active?.id ?? 'shop',
  });
  const products = listing.products;

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [active?.id, needle, listing.filters, listing.sort]);

  function pickSuggestion(item: SearchSuggestion) {
    if (item.kind === 'product' && item.productId) {
      router.push({ pathname: '/product/[id]', params: { id: item.productId } });
      return;
    }
    if (item.kind === 'category' && item.categoryId) {
      setDraftQuery('');
      selectShelf(item.categoryId);
      return;
    }
    setDraftQuery(item.title);
  }

  function selectShelf(id: string) {
    setOverrideId(id);
    router.setParams({ category: id });
  }

  function openParentSubcategories() {
    const parentId = resolveParentIdForCategory(active?.id);
    if (parentId) {
      router.push({ pathname: '/category/[id]', params: { id: parentId } });
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/home');
  }

  const count = products.length;
  const title = active?.name ?? 'Shop';

  return (
    <View style={styles.screen}>
      <View style={[styles.column, { width: contentWidth }]}>
        <AppScreenHeader
          title="Shop"
          fallbackHref="/home"
          titleWeight="semibold"
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Menu"
              accessibilityState={{ expanded: menuOpen }}
              onPress={() => setMenuOpen(true)}
              style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
              testID="shop-menu">
              <AppIcon name="menu" color={colors.text} size={22} />
            </Pressable>
          }
        />

        <View style={styles.chrome}>
          <CatalogBreadcrumb
            crumbs={[
              { label: 'Shop', onPress: () => router.setParams({ category: undefined, q: undefined }) },
              { label: title, onPress: openParentSubcategories },
            ]}
          />
          <CatalogSearchField
            value={query}
            onChange={setDraftQuery}
            placeholder={`Search in ${title}`}
            accessibilityLabel="Search products"
            testID="shop-search-input"
          />
          <ProductFilterSortBar
            sort={listing.sort}
            activeFilterCount={listing.activeFilterCount}
            onOpenFilters={listing.openFilters}
            onOpenSort={listing.openSort}
          />
          {needle.length > 0 ? (
            <SearchSuggestions query={query} onPick={pickSuggestion} style={styles.suggestions} />
          ) : null}
        </View>

        {shelves.length === 0 || !active ? (
          <View style={styles.emptyScreen}>
            <Text style={styles.emptyTitle}>No products to show yet</Text>
            <Text style={styles.emptyCopy}>The product list is empty. Nothing new was added in its place.</Text>
          </View>
        ) : (
          <View style={styles.body}>
            <ScrollView
              style={[styles.sidebar, { width: sidebarWidth }]}
              contentContainerStyle={[styles.sidebarContent, { paddingBottom: 12 + keyboardOverlap }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {shelves.map((shelf) => (
                <ShelfButton key={shelf.id} shelf={shelf} selected={shelf.id === active.id} onPress={() => selectShelf(shelf.id)} />
              ))}
            </ScrollView>
            <FlatList
              ref={(node) => {
                listRef.current = node;
              }}
              key={`${columns}-${cardWidth}`}
              style={[styles.list, { width: gridWidth }]}
              data={products}
              keyExtractor={(product) => product.id}
              numColumns={columns}
              columnWrapperStyle={columns > 1 ? styles.row : undefined}
              renderItem={({ item }) => (
                <View style={{ width: cardWidth }}>
                  <ProductCard product={item} compact={cardWidth < 100} />
                </View>
              )}
              ListHeaderComponent={
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle} testID="shop-item-count">
                    {itemLabel(count)}
                    {listing.hasActiveFilters ? ' match filters' : ` in ${active.name}`}
                  </Text>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyBlock}>
                  <Text style={styles.emptyList}>
                    {needle.length > 0 || listing.hasActiveFilters
                      ? 'No items match that search or filters.'
                      : 'No items in this category yet.'}
                  </Text>
                  {listing.hasActiveFilters ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear filters"
                      onPress={listing.clearFilters}
                      style={({ pressed }) => [styles.clearInline, pressed && styles.pressed]}
                      testID="shop-clear-filters">
                      <Text style={styles.clearInlineLabel}>Clear filters</Text>
                    </Pressable>
                  ) : null}
                </View>
              }
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: Math.max(insets.bottom, 16) + keyboardOverlap },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              initialNumToRender={8}
              windowSize={7}
            />
          </View>
        )}
      </View>
      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
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

function ShelfButton({ shelf, selected, onPress }: { shelf: ShopShelf; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={shelf.name}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.shelf, selected && styles.shelfSelected, pressed && styles.pressed]}
      testID={`shop-shelf-${shelf.id}`}>
      <View style={[styles.shelfPlate, selected && styles.shelfPlateSelected]}>
        <CatalogImage source={shelf.image} style={styles.shelfImage} contentFit="contain" />
      </View>
      <Text numberOfLines={3} maxFontSizeMultiplier={1.15} style={[styles.shelfLabel, selected && styles.shelfLabelSelected]}>
        {shelf.name}
      </Text>
    </Pressable>
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
    backgroundColor: colors.white,
  },
  chrome: {
    paddingHorizontal: homeLayout.gutter,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  suggestions: {
    marginTop: 8,
    marginBottom: 0,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    flexGrow: 0,
    backgroundColor: '#F7F7F8',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E5E7EB',
  },
  sidebarContent: {
    paddingTop: 6,
    paddingBottom: 12,
    gap: 2,
  },
  shelf: {
    alignItems: 'center',
    gap: 4,
    marginHorizontal: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    minHeight: 44,
  },
  shelfSelected: {
    backgroundColor: colors.cream,
  },
  shelfPlate: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shelfPlateSelected: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shelfImage: {
    width: 54,
    height: 54,
  },
  shelfLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    color: colors.text,
  },
  shelfLabelSelected: {
    fontFamily: fonts.bold,
    color: colors.primaryInk,
  },
  list: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#F6F7F9',
  },
  listContent: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  row: {
    gap: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  sectionHead: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  emptyBlock: {
    paddingHorizontal: 16,
    paddingTop: 28,
    gap: 12,
    alignItems: 'flex-start',
  },
  emptyList: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  clearInline: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.cream,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearInlineLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.primaryInk,
  },
  emptyScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
  },
  emptyCopy: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
