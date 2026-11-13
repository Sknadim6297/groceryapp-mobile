import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogBreadcrumb } from '@/components/catalog/CatalogBreadcrumb';
import { CatalogSearchField } from '@/components/catalog/CatalogSearchField';
import { ProductFilterSortBar } from '@/components/catalog/ProductFilterSortBar';
import { ProductFiltersSheet } from '@/components/catalog/ProductFiltersSheet';
import { ProductSortSheet } from '@/components/catalog/ProductSortSheet';
import { RecentSearchChips } from '@/components/catalog/RecentSearchChips';
import { CatalogImage } from '@/components/home/CatalogImage';
import { ProductCard } from '@/components/home/ProductCard';
import { SearchSuggestions } from '@/components/home/SearchSuggestions';
import type { SearchSuggestion } from '@/data/searchSuggestions';
import { SideMenu } from '@/components/home/SideMenu';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { CatalogSoftErrorBanner } from '@/components/ui/CatalogSoftErrorBanner';
import { CatalogStatusPanel } from '@/components/ui/CatalogStatusPanel';
import { ShopCatalogSkeleton } from '@/components/ui/LoadingSkeleton';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { contentColumnWidth } from '@/utils/contentWidth';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { useCatalog } from '@/context/CatalogContext';
import { useRecentSearches } from '@/context/RecentSearchesContext';
import { buildReviewSummary, previewReviewsForProduct } from '@/data/productReviews';
import type { ShopShelf } from '@/data/shopCatalog';
import { resolveParentIdForCategory } from '@/data/subcategoryCatalog';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import { useProductListingControls } from '@/hooks/useProductListingControls';
import type { ProductFiltersState, ProductSortId } from '@/types/productFilters';
import { buildCategoryOptions, matchesSearch, type ListedProduct } from '@/utils/productFilters';
import {
  findCatalogueBrand,
  isValidBrandName,
  normalizeBrandKey,
  productMatchesBrand,
} from '@/utils/brandIdentity';
import { resolveShopListing } from '@/utils/resolveShopShelf';
import {
  decodeShopFilters,
  decodeShopSort,
  encodeShopFilters,
  encodeShopSort,
} from '@/utils/shopListingParams';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function shelfForQuery(shelves: readonly ShopShelf[], value: string): string | undefined {
  const needle = value.trim().toLowerCase();
  if (needle.length === 0) {
    return undefined;
  }
  return shelves.find((shelf) => shelf.products.some((product) => matchesSearch(product, needle)))?.id;
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
  const params = useLocalSearchParams<{
    category?: string | string[];
    parent?: string | string[];
    sub?: string | string[];
    q?: string | string[];
    brand?: string | string[];
    sort?: string | string[];
    filters?: string | string[];
  }>();
  const requested = firstParam(params.category);
  const routeParentName = (firstParam(params.parent) ?? '').trim();
  const routeSubName = (firstParam(params.sub) ?? '').trim();
  const routeBrandRaw = (firstParam(params.brand) ?? '').trim();
  const brandFilterActive = isValidBrandName(routeBrandRaw);
  const brandFilterKey = brandFilterActive ? normalizeBrandKey(routeBrandRaw) : '';
  const routeQuery = firstParam(params.q) ?? '';
  const routeSort = decodeShopSort(firstParam(params.sort));
  const routeFilters = useMemo(
    () => decodeShopFilters(firstParam(params.filters)),
    [params.filters],
  );
  const listingSeedKey = [
    requested ?? '',
    routeParentName,
    routeSubName,
    brandFilterKey,
    routeQuery,
    firstParam(params.sort) ?? '',
    firstParam(params.filters) ?? '',
  ].join('|');
  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap();
  const { width } = useWindowDimensions();
  const contentWidth = contentColumnWidth(width);
  const sidebarWidth = contentWidth < 380 ? 70 : 84;
  const cardGap = 8;
  const cardInset = 8;
  /** Brand listings use the full content width (no category sidebar). */
  const gridWidth = Math.max(0, brandFilterActive ? contentWidth : contentWidth - sidebarWidth);
  const gridInner = Math.max(0, gridWidth - cardInset * 2);
  const pairedWidth = Math.floor((gridInner - cardGap) / 2);
  /** Need ~140px so price + ADD fit; below that use a single column on small phones. */
  const columns = pairedWidth >= 140 ? 2 : 1;
  const cardWidth = columns === 2 ? pairedWidth : gridInner;
  const { listShelves, initialLoading, liveEnabled, state, products: catalogProducts, message, refresh, refreshing } =
    useCatalog();
  const { queries: recentQueries, remember, removeQuery, clearHistory } = useRecentSearches();
  const shelves = useMemo(() => listShelves(requested), [listShelves, requested]);
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [seenRequest, setSeenRequest] = useState(requested);
  const [draftQuery, setDraftQuery] = useState<string | null>(null);
  const [seenQuery, setSeenQuery] = useState(routeQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const listRef = useRef<{ scrollToOffset: (options: { offset: number; animated?: boolean }) => void } | null>(null);

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

  if (requested !== seenRequest) {
    setSeenRequest(requested);
    setOverrideId(null);
  }

  if (routeQuery !== seenQuery) {
    setSeenQuery(routeQuery);
    setDraftQuery(null);
  }

  const query = draftQuery ?? routeQuery;
  const needle = query.trim().toLowerCase();
  /**
   * Explicit category/subcategory from the route or sidebar — never invent a substitute shelf.
   * Membership uses product.Category / product.SubCategory (with parent+sub route names).
   */
  const requestedKey = overrideId ?? requested;
  const catalogueBrand = useMemo(
    () => (brandFilterActive ? findCatalogueBrand(catalogProducts, routeBrandRaw) : undefined),
    [brandFilterActive, catalogProducts, routeBrandRaw],
  );
  const brandDisplayName = catalogueBrand?.name ?? (brandFilterActive ? routeBrandRaw : '');
  /** Brand mode ignores category shelf resolution — listing is brand-scoped only. */
  const hasExplicitBrowse = !brandFilterActive && Boolean(requestedKey || routeParentName || routeSubName);
  const resolution = useMemo(
    () =>
      brandFilterActive
        ? { status: 'none' as const, products: [] as const }
        : resolveShopListing({
            shelfId: requestedKey,
            parentName: overrideId ? undefined : routeParentName || undefined,
            subcategoryName: overrideId ? undefined : routeSubName || undefined,
            shelves,
            products: catalogProducts,
          }),
    [
      brandFilterActive,
      catalogProducts,
      overrideId,
      requestedKey,
      routeParentName,
      routeSubName,
      shelves,
    ],
  );

  const matchedShelf: ShopShelf | undefined = useMemo(() => {
    if (resolution.status !== 'matched' && resolution.status !== 'empty') {
      return undefined;
    }
    if (resolution.status === 'empty') {
      return {
        id: resolution.shelfId ?? requestedKey ?? 'empty-shelf',
        name: resolution.shelfName,
        image: { uri: '' },
        products: [],
      };
    }
    const existing = shelves.find((shelf) => shelf.id === resolution.shelfId);
    return {
      id: resolution.shelfId,
      name: resolution.shelfName,
      image: existing?.image ?? resolution.products[0]?.image ?? { uri: '' },
      products: resolution.products,
    };
  }, [requestedKey, resolution, shelves]);

  const categoryInvalid = hasExplicitBrowse && resolution.status === 'invalid';
  const categoryEmpty = hasExplicitBrowse && resolution.status === 'empty';
  const defaultShelf =
    shelves.find((shelf) => shelf.products.length > 0) ?? shelves[0];
  const queryHintId = !hasExplicitBrowse ? shelfForQuery(shelves, routeQuery) : undefined;
  const active =
    matchedShelf ??
    (!hasExplicitBrowse
      ? shelves.find((shelf) => shelf.id === queryHintId) ?? defaultShelf
      : undefined);

  // Align route category id after successful remap; keep parent/sub for back-stack honesty.
  useEffect(() => {
    if (overrideId || resolution.status !== 'matched') {
      return;
    }
    if (!requested || resolution.shelfId === requested) {
      return;
    }
    router.setParams({ category: resolution.shelfId });
  }, [overrideId, requested, resolution]);

  const pool = useMemo(() => {
    // Brand listing: exact brand match on catalogue products only — never fall back to unit/name.
    if (brandFilterActive) {
      const seen = new Set<string>();
      const brandPool: ListedProduct[] = [];
      for (const product of catalogProducts) {
        if (!productMatchesBrand(product, routeBrandRaw) || seen.has(product.id)) {
          continue;
        }
        seen.add(product.id);
        const ratingAverage = UI_PREVIEW_MODE
          ? buildReviewSummary(previewReviewsForProduct(product)).average
          : undefined;
        brandPool.push({ ...product, shelfId: `brand:${brandFilterKey}`, ratingAverage });
      }
      return brandPool;
    }

    const all = buildListingPool(shelves);
    // Tag resolved members with the active shelf id so search/filter stay scoped.
    if (matchedShelf && resolution.status === 'matched') {
      const memberIds = new Set(matchedShelf.products.map((product) => product.id));
      const tagged = all.map((product) =>
        memberIds.has(product.id) ? { ...product, shelfId: matchedShelf.id } : product,
      );
      for (const product of matchedShelf.products) {
        if (tagged.some((row) => row.id === product.id)) {
          continue;
        }
        const ratingAverage = UI_PREVIEW_MODE
          ? buildReviewSummary(previewReviewsForProduct(product)).average
          : undefined;
        tagged.push({ ...product, shelfId: matchedShelf.id, ratingAverage });
      }
      return tagged;
    }
    return all;
  }, [
    brandFilterActive,
    brandFilterKey,
    catalogProducts,
    matchedShelf,
    resolution.status,
    routeBrandRaw,
    shelves,
  ]);
  const brandEmpty = brandFilterActive && pool.length === 0;
  const categoryOptions = useMemo(
    () => (brandFilterActive ? [] : buildCategoryOptions(shelves)),
    [brandFilterActive, shelves],
  );

  const syncListingParams = useCallback(
    (next: { filters: ProductFiltersState; sort: ProductSortId; q?: string }) => {
      router.setParams({
        filters: encodeShopFilters(next.filters),
        sort: encodeShopSort(next.sort),
        ...(next.q !== undefined ? { q: next.q.trim() ? next.q.trim() : undefined } : {}),
      });
    },
    [],
  );

  const commitSearch = useCallback(
    (next: string) => {
      const trimmed = next.trim();
      setDraftQuery(null);
      router.setParams({ q: trimmed.length > 0 ? trimmed : undefined });
      if (trimmed) {
        remember(trimmed);
      }
    },
    [remember],
  );

  /**
   * Shelf lock: keep search inside an explicitly selected category/subcategory.
   * Home/global search (`/shop?q=`) stays unscoped. Default Shop browse scopes to the sidebar shelf.
   */
  const listingShelfId = brandFilterActive
    ? `brand:${brandFilterKey}`
    : matchedShelf
      ? matchedShelf.id
      : needle
        ? undefined
        : active?.id;

  const listing = useProductListingControls({
    pool,
    query,
    activeShelfId: listingShelfId,
    scopeKey: brandFilterActive
      ? `brand:${brandFilterKey}`
      : (matchedShelf?.id ?? (needle ? 'search' : active?.id ?? 'shop')),
    seedFilters: routeFilters,
    seedSort: routeSort,
    seedKey: listingSeedKey,
    onListingChange: syncListingParams,
  });
  const products = listing.products;

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [active?.id, needle, listing.filters, listing.sort]);

  if (liveEnabled && initialLoading) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title="Shop" showBack={false} />
        <ShopCatalogSkeleton cardWidth={cardWidth} />
      </View>
    );
  }

  if (liveEnabled && state.status === 'error' && catalogProducts.length === 0) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title="Shop" showBack={false} />
        <CatalogStatusPanel
          kind="error"
          message={message}
          onRetry={() => void handleRetry()}
          retrying={retrying || refreshing}
        />
      </View>
    );
  }

  // Ready + empty only — error/loading keep their own panels so failures are not shown as "no products".
  if (
    liveEnabled &&
    state.status === 'ready' &&
    shelves.every((shelf) => shelf.products.length === 0)
  ) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title="Shop" showBack={false} />
        <CatalogStatusPanel
          kind="empty"
          title="No products yet"
          message="No products are available for this store yet."
          onRetry={() => void handleRetry()}
          retrying={retrying || refreshing}
        />
      </View>
    );
  }

  function pickSuggestion(item: SearchSuggestion) {
    if (item.kind === 'product' && item.productId) {
      router.push({ pathname: '/product/[id]', params: { id: item.productId } });
      return;
    }
    if (item.kind === 'brand' && item.title) {
      setDraftQuery('');
      router.setParams({
        brand: item.title,
        category: undefined,
        parent: undefined,
        sub: undefined,
        q: undefined,
        filters: undefined,
      });
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
    const shelf = shelves.find((row) => row.id === id);
    // Shelf change resets brand scope + filters while keeping search/sort.
    router.setParams({
      category: id,
      brand: undefined,
      filters: undefined,
      parent: undefined,
      sub: shelf?.name,
    });
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
  const title = brandFilterActive
    ? `${brandDisplayName} Products`
    : matchedShelf?.name ??
      active?.name ??
      (categoryInvalid ? 'Category unavailable' : categoryEmpty ? routeSubName || 'Category' : 'Shop');

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
              {
                label: 'Shop',
                onPress: () =>
                  router.setParams({
                    category: undefined,
                    parent: undefined,
                    sub: undefined,
                    brand: undefined,
                    q: undefined,
                    sort: undefined,
                    filters: undefined,
                  }),
              },
              {
                label: title,
                onPress: brandFilterActive
                  ? () =>
                      router.setParams({
                        brand: undefined,
                        category: undefined,
                        parent: undefined,
                        sub: undefined,
                      })
                  : openParentSubcategories,
              },
            ]}
          />
          {liveEnabled && message && catalogProducts.length > 0 ? (
            <CatalogSoftErrorBanner
              message={message}
              onRetry={() => void handleRetry()}
              retrying={retrying || refreshing}
            />
          ) : null}
          <CatalogSearchField
            value={query}
            onChange={setDraftQuery}
            onSubmit={commitSearch}
            placeholder={`Search in ${title}`}
            accessibilityLabel="Search products"
            testID="shop-search-input"
          />
          {needle.length === 0 ? (
            <RecentSearchChips
              queries={recentQueries}
              onSelect={(q) => commitSearch(q)}
              onRemove={removeQuery}
              onClearAll={clearHistory}
            />
          ) : null}
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

        {brandEmpty ? (
          <View style={styles.emptyScreen} testID="shop-brand-empty">
            <Text style={styles.emptyTitle}>No products available</Text>
            <Text style={styles.emptyCopy}>
              {brandDisplayName
                ? `No loaded catalogue products match ${brandDisplayName}.`
                : 'This brand could not be matched in the loaded catalogue.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Browse all of Shop"
              onPress={() =>
                router.setParams({
                  brand: undefined,
                  category: undefined,
                  parent: undefined,
                  sub: undefined,
                  q: undefined,
                  sort: undefined,
                  filters: undefined,
                })
              }
              style={({ pressed }) => [styles.clearInline, pressed && styles.pressed]}
              testID="shop-browse-all-brand">
              <Text style={styles.clearInlineLabel}>Browse Shop</Text>
            </Pressable>
          </View>
        ) : categoryInvalid ? (
          <View style={styles.emptyScreen} testID="shop-category-unavailable">
            <Text style={styles.emptyTitle}>Category unavailable</Text>
            <Text style={styles.emptyCopy}>
              This category or subcategory could not be matched in the catalogue.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Browse all of Shop"
              onPress={() =>
                router.setParams({
                  category: undefined,
                  parent: undefined,
                  sub: undefined,
                  brand: undefined,
                  q: undefined,
                  sort: undefined,
                  filters: undefined,
                })
              }
              style={({ pressed }) => [styles.clearInline, pressed && styles.pressed]}
              testID="shop-browse-all">
              <Text style={styles.clearInlineLabel}>Browse Shop</Text>
            </Pressable>
          </View>
        ) : categoryEmpty ? (
          <View style={styles.emptyScreen} testID="shop-category-empty">
            <Text style={styles.emptyTitle}>No products available</Text>
            <Text style={styles.emptyCopy}>
              {title} has no matching products in the loaded catalogue.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Browse all of Shop"
              onPress={() =>
                router.setParams({
                  category: undefined,
                  parent: undefined,
                  sub: undefined,
                  q: undefined,
                  sort: undefined,
                  filters: undefined,
                })
              }
              style={({ pressed }) => [styles.clearInline, pressed && styles.pressed]}
              testID="shop-browse-all-empty">
              <Text style={styles.clearInlineLabel}>Browse Shop</Text>
            </Pressable>
          </View>
        ) : !brandFilterActive && (shelves.length === 0 || !active) ? (
          <View style={styles.emptyScreen}>
            <Text style={styles.emptyTitle}>No products to show yet</Text>
            <Text style={styles.emptyCopy}>The product list is empty. Nothing new was added in its place.</Text>
          </View>
        ) : (
          <View style={styles.body}>
            {!brandFilterActive && active ? (
              <ScrollView
                style={[styles.sidebar, { width: sidebarWidth }]}
                contentContainerStyle={[styles.sidebarContent, { paddingBottom: 12 + keyboardOverlap }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                {shelves.map((shelf) => (
                  <ShelfButton
                    key={shelf.id}
                    shelf={shelf}
                    selected={shelf.id === active.id}
                    onPress={() => selectShelf(shelf.id)}
                  />
                ))}
              </ScrollView>
            ) : null}
            <FlatList
              ref={(node) => {
                listRef.current = node;
              }}
              key={`${columns}-${cardWidth}-${brandFilterKey || 'shelf'}`}
              style={[styles.list, { width: gridWidth }]}
              data={products}
              keyExtractor={(product) => product.id}
              numColumns={columns}
              columnWrapperStyle={columns > 1 ? styles.row : undefined}
              renderItem={({ item }) => (
                <View style={{ width: cardWidth }}>
                  <ProductCard product={item} compact={cardWidth < 140} />
                </View>
              )}
              ListHeaderComponent={
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle} testID="shop-item-count">
                    {itemLabel(count)}
                    {listing.hasActiveFilters
                      ? ' match filters'
                      : brandFilterActive
                        ? ` from ${brandDisplayName}`
                        : ` in ${active?.name ?? 'Shop'}`}
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
              refreshControl={
                liveEnabled ? (
                  <RefreshControl
                    refreshing={refreshing || retrying}
                    onRefresh={() => void handleRetry()}
                    tintColor={colors.primaryInk}
                  />
                ) : undefined
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              initialNumToRender={8}
              maxToRenderPerBatch={6}
              windowSize={7}
              extraData={`${listingShelfId ?? ''}|${needle}|${listing.sort}|${listing.activeFilterCount}`}
              // Android + expo-image: clipping recycled cells can stick blank/wrong product images.
              removeClippedSubviews={Platform.OS === 'android' ? false : true}
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
  statusCopy: {
    marginHorizontal: 16,
    marginTop: 20,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  retry: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginTop: 12,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.cream,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
});
