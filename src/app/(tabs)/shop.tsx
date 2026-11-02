import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogImage } from '@/components/home/CatalogImage';
import { ProductCard } from '@/components/home/ProductCard';
import { SideMenu } from '@/components/home/SideMenu';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { listShopShelves, type ShopShelf } from '@/data/shopCatalog';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import type { DemoProduct } from '@/types/catalog';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function shelfForQuery(value: string): string | undefined {
  const needle = value.trim().toLowerCase();
  if (needle.length === 0) {
    return undefined;
  }
  return listShopShelves().find((shelf) => shelf.products.some((product) => matches(product, needle)))?.id;
}

function itemLabel(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

function matches(product: DemoProduct, needle: string): boolean {
  return product.name.toLowerCase().includes(needle) || product.unit.toLowerCase().includes(needle);
}

export default function ShopScreen() {
  const params = useLocalSearchParams<{ category?: string | string[]; q?: string | string[] }>();
  const requested = firstParam(params.category);
  const routeQuery = firstParam(params.q) ?? '';
  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);
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
  const [draftOpen, setDraftOpen] = useState<boolean | null>(null);
  const [seenQuery, setSeenQuery] = useState(routeQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<{ focus: () => void } | null>(null);
  const listRef = useRef<{ scrollToOffset: (options: { offset: number; animated?: boolean }) => void } | null>(null);

  if (requested !== seenRequest) {
    setSeenRequest(requested);
    setOverrideId(null);
  }

  if (routeQuery !== seenQuery) {
    setSeenQuery(routeQuery);
    setDraftQuery(null);
    setDraftOpen(null);
  }

  const query = draftQuery ?? routeQuery;
  const searchOpen = draftOpen ?? routeQuery.length > 0;
  const selectedId = overrideId ?? requested ?? shelfForQuery(routeQuery);
  const active =
    shelves.find((shelf) => shelf.id === selectedId) ??
    shelves.find((shelf) => shelf.products.length > 0) ??
    shelves[0];
  const needle = query.trim().toLowerCase();
  const products = useMemo(() => {
    if (!active) {
      return [];
    }
    return needle.length === 0 ? active.products : active.products.filter((product) => matches(product, needle));
  }, [active, needle]);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [active?.id, needle]);

  useEffect(() => {
    if (searchOpen) {
      searchRef.current?.focus();
    }
  }, [searchOpen]);

  function selectShelf(id: string) {
    setOverrideId(id);
    router.setParams({ category: id });
  }

  const count = products.length;
  const title = active?.name ?? 'Shop';

  return (
    <View style={styles.screen}>
      <View style={[styles.column, { width: contentWidth }]}>
        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <AppIcon name="back" color={colors.text} size={24} />
          </Pressable>
          {active ? (
            <CatalogImage source={active.image} style={styles.headerImage} label={active.name} contentFit="contain" />
          ) : null}
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {title}
            </Text>
            <Text style={styles.headerCount} testID="shop-item-count">
              {itemLabel(count)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search products"
            accessibilityState={{ expanded: searchOpen }}
            onPress={() => setDraftOpen(!searchOpen)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            testID="shop-search">
            <AppIcon name="search" color={colors.text} size={24} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu"
            accessibilityState={{ expanded: menuOpen }}
            onPress={() => setMenuOpen(true)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            testID="shop-menu">
            <AppIcon name="menu" color={colors.text} size={24} />
          </Pressable>
        </View>

        {searchOpen ? (
          <View style={styles.searchRow}>
            <AppIcon name="search" color={colors.textSecondary} size={20} />
            <TextInput
              ref={(node) => {
                searchRef.current = node;
              }}
              value={query}
              onChangeText={setDraftQuery}
              placeholder={`Search in ${title}`}
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              accessibilityLabel="Search products"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              testID="shop-search-input"
            />
            {query.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={8}
                onPress={() => setDraftQuery('')}
                style={styles.clear}>
                <AppIcon name="close" color={colors.textSecondary} size={18} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

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
                  <Text style={styles.sectionTitle}>
                    {itemLabel(count)} in {active.name}
                  </Text>
                </View>
              }
              ListEmptyComponent={
                <Text style={styles.emptyList}>{needle.length > 0 ? 'No items match that search.' : 'No items in this category yet.'}</Text>
              }
              contentContainerStyle={[styles.listContent, { paddingBottom: 16 + keyboardOverlap }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              initialNumToRender={8}
              windowSize={7}
            />
          </View>
        )}
      </View>
      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
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
    backgroundColor: colors.softBackground,
  },
  column: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingRight: 4,
    paddingBottom: 6,
    paddingLeft: 2,
    backgroundColor: colors.brightYellow,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerImage: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  headerCount: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryInk,
  },
  pressed: {
    opacity: 0.72,
  },
  searchRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  clear: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
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
  emptyList: {
    paddingHorizontal: 16,
    paddingTop: 28,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
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
