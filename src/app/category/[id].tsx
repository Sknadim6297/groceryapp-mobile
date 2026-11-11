import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandCatalogBanner } from '@/components/catalog/BrandCatalogBanner';
import { CatalogBreadcrumb } from '@/components/catalog/CatalogBreadcrumb';
import { CatalogSearchField } from '@/components/catalog/CatalogSearchField';
import { SubcategoryCard } from '@/components/category/SubcategoryCard';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { CatalogSoftErrorBanner } from '@/components/ui/CatalogSoftErrorBanner';
import { CatalogStatusPanel } from '@/components/ui/CatalogStatusPanel';
import { ProductGridSkeleton } from '@/components/ui/LoadingSkeleton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { useCatalog } from '@/context/CatalogContext';
import type { LiveSubcategoryRecord } from '@/services/catalogMetaApi';
import { findCatalogParent, listSubcategoriesForParent } from '@/data/subcategoryCatalog';
import type { CatalogSubcategory } from '@/types/subcategory';
import { enrichLiveCategoryTreePresentation } from '@/utils/catalogPresentationAssets';
import { findLiveCategoryParent } from '@/utils/liveCatalogMeta';
import { resolveShopShelfId } from '@/utils/resolveShopShelf';
import { filterSubcategories } from '@/utils/subcategorySearch';

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function SubcategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const parentId = paramValue(id);
  const {
    liveEnabled,
    products,
    initialLoading,
    state,
    message,
    refresh,
    refreshing,
    loadSubcategories,
    listShelves,
    remoteCategories,
  } = useCatalog();
  const [query, setQuery] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [remoteSubs, setRemoteSubs] = useState<LiveSubcategoryRecord[]>([]);

  const liveParent = useMemo(() => {
    if (!liveEnabled) {
      return undefined;
    }
    const parent = findLiveCategoryParent(products, parentId);
    if (parent) {
      return enrichLiveCategoryTreePresentation([parent])[0];
    }
    // Remote categories API may list parents that have zero products yet — still browsable.
    const remote = remoteCategories.find((row) => row.id === parentId);
    if (!remote) {
      return undefined;
    }
    return {
      id: remote.id,
      name: remote.name,
      image: remote.image,
      children: [] as const,
    };
  }, [liveEnabled, parentId, products, remoteCategories]);
  const demoParent = liveEnabled ? undefined : findCatalogParent(parentId);
  const parent = liveParent
    ? { id: liveParent.id, name: liveParent.name, image: liveParent.image }
    : demoParent;

  const parentNameKey = liveParent?.name ?? '';
  useEffect(() => {
    if (!liveEnabled || !parentNameKey) {
      return;
    }
    let cancelled = false;
    void loadSubcategories(parentNameKey).then((rows) => {
      if (!cancelled) {
        setRemoteSubs(rows);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [liveEnabled, parentNameKey, loadSubcategories]);

  const subcategories = useMemo((): CatalogSubcategory[] => {
    const remoteSubsForParent =
      liveEnabled && parentNameKey.length > 0 ? remoteSubs : ([] as typeof remoteSubs);
    if (liveEnabled && remoteSubsForParent.length > 0) {
      return remoteSubsForParent.map((child, index) => {
        const fromProducts = liveParent?.children.find((row) => row.id === child.id);
        return {
          id: child.id,
          parentId: child.parentId,
          name: child.name,
          image:
            typeof child.image === 'object' &&
            child.image != null &&
            'uri' in child.image &&
            typeof child.image.uri === 'string' &&
            child.image.uri.trim().length > 0
              ? child.image
              : (fromProducts?.image ?? child.image),
          productCount: fromProducts?.productCount ?? 0,
          order: index,
          visible: true,
        };
      });
    }
    if (liveEnabled && liveParent) {
      return liveParent.children.map((child, index) => ({
        id: child.id,
        parentId: child.parentId,
        name: child.name,
        image: child.image,
        productCount: child.productCount,
        order: index,
        visible: true,
      }));
    }
    return listSubcategoriesForParent(parentId);
  }, [liveEnabled, liveParent, parentId, parentNameKey, remoteSubs]);

  const visible = useMemo(() => filterSubcategories(subcategories, query), [query, subcategories]);

  const gutter = homeLayout.gutter;
  const columns = 2;
  const gap = 10;
  const contentWidth = Math.min(width, homeLayout.maxWidth);
  const cardWidth = (contentWidth - gutter * 2 - gap) / columns;

  function openShop(subcategory: CatalogSubcategory) {
    const shelves = listShelves(subcategory.id);
    const category = resolveShopShelfId(subcategory.id, shelves, products) ?? subcategory.id;
    const parentName = parent?.name ?? subcategory.parentId;
    router.push({
      pathname: '/shop',
      params: {
        category,
        parent: typeof parentName === 'string' ? parentName : undefined,
        sub: subcategory.name,
      },
    });
  }

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

  if (liveEnabled && initialLoading) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title="Subcategories" fallbackHref="/home" titleWeight="semibold" />
        <ProductGridSkeleton columns={2} count={4} cardWidth={cardWidth} />
      </View>
    );
  }

  if (liveEnabled && state.status === 'error' && products.length === 0) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title="Subcategories" fallbackHref="/home" titleWeight="semibold" />
        <CatalogStatusPanel
          kind="error"
          message={message}
          onRetry={() => void handleRetry()}
          retrying={retrying || refreshing}
        />
      </View>
    );
  }

  if (!parent) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader title="Subcategories" fallbackHref="/home" titleWeight="semibold" />
        <View style={[styles.fallback, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.fallbackTitle}>Category unavailable</Text>
          <Text style={styles.fallbackBody}>
            This category could not be found. Choose another category from Home or Shop.
          </Text>
          <PrimaryButton label="Back to Home" onPress={() => router.replace('/home')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Subcategories" fallbackHref="/home" titleWeight="semibold" />

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 12,
            maxWidth: homeLayout.maxWidth,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View>
            <BrandCatalogBanner />
            <CatalogBreadcrumb
              crumbs={[
                { label: 'Shop', onPress: () => router.push('/shop') },
                { label: parent.name },
              ]}
            />
            {liveEnabled && message && products.length > 0 ? (
              <CatalogSoftErrorBanner
                message={message}
                onRetry={() => void handleRetry()}
                retrying={retrying || refreshing}
              />
            ) : null}
            <CatalogSearchField
              value={query}
              onChange={setQuery}
              placeholder="Search subcategories"
              accessibilityLabel="Search subcategories"
              testID="subcategory-search"
            />
            <View style={styles.headerSpacer} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {query.trim().length > 0 ? 'No matching subcategories' : 'No subcategories yet'}
            </Text>
            <Text style={styles.emptyBody}>
              {query.trim().length > 0
                ? 'Try a different search term.'
                : liveEnabled
                  ? 'Subcategories will appear here when the store publishes them on products.'
                  : 'This category has no shelves in the on-device catalogue yet.'}
            </Text>
            {query.trim().length > 0 ? (
              <PrimaryButton label="Clear search" onPress={() => setQuery('')} />
            ) : (
              <PrimaryButton
                label="Browse Shop"
                onPress={() =>
                  router.push({
                    pathname: '/shop',
                    params: { category: parent.id },
                  })
                }
              />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <SubcategoryCard subcategory={item} onPress={openShop} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        testID="subcategories-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: homeLayout.gutter,
  },
  row: {
    gap: 10,
    marginBottom: 10,
  },
  headerSpacer: {
    height: 12,
  },
  empty: {
    paddingHorizontal: 12,
    paddingTop: 36,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  fallback: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 12,
  },
  fallbackTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'center',
  },
  fallbackBody: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
});
