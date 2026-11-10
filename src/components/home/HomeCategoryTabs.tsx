import type { ImageSource } from 'expo-image';
import { router } from 'expo-router';
import { memo, useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { SoftIcon } from '@/components/ui/SoftIcon';
import { HOME_ALL_CATEGORY } from '@/constants/homeCatalogBrowse';
import { colors, fonts } from '@/constants/theme';
import { useCatalog } from '@/context/CatalogContext';
import { useOptionalHomeCatalogBrowse } from '@/context/HomeCatalogBrowseContext';
import { listVisibleHomeShoppingShortcuts } from '@/data/shoppingCollections';
import { mergeRemoteCategoriesIntoTree } from '@/services/catalogMetaApi';
import type { LiveCategoryParent } from '@/types/category';
import type { ShoppingCollectionId } from '@/types/shoppingCollection';
import { enrichLiveCategoryTreePresentation } from '@/utils/catalogPresentationAssets';
import { deriveLiveCategoryTree } from '@/utils/liveCatalogMeta';

const INK = '#171717';

type HorizontalScroller = {
  scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
};

/** Curated collage art for demo shopping shortcuts (local assets only). */
const IMAGE_BY_COLLECTION: Record<ShoppingCollectionId, ImageSource> = {
  all: require('@/assets/images/home/grains.jpg'),
  fresh: require('@/assets/images/home/fresh-fruits.jpg'),
  diwali: require('@/assets/images/home/snacks.jpg'),
  electronics: require('@/assets/images/home/personal.jpg'),
  organic: require('@/assets/images/home/produce.jpg'),
};

type TabItem = {
  id: string;
  name: string;
  image?: ImageSource;
  isAll?: boolean;
};

/**
 * Home header main-category strip (reference: horizontal tall pills).
 * Live: select a category → subcategory grid updates below (no navigation).
 */
export function HomeCategoryTabs() {
  const { width } = useWindowDimensions();
  const { liveEnabled, products, remoteCategories } = useCatalog();
  const browse = useOptionalHomeCatalogBrowse();
  const scrollerRef = useRef<HorizontalScroller | null>(null);
  const tabOffsets = useRef<Record<string, number>>({});

  const liveParents = useMemo(() => {
    if (!liveEnabled) {
      return [] as LiveCategoryParent[];
    }
    const fromProducts = enrichLiveCategoryTreePresentation(deriveLiveCategoryTree(products));
    return enrichLiveCategoryTreePresentation(
      mergeRemoteCategoriesIntoTree(fromProducts, remoteCategories),
    );
  }, [liveEnabled, products, remoteCategories]);

  const liveTabs = useMemo<TabItem[]>(() => {
    if (liveParents.length === 0) {
      return [];
    }
    return [
      { id: HOME_ALL_CATEGORY.id, name: HOME_ALL_CATEGORY.name, isAll: true },
      ...liveParents.map((parent) => ({
        id: parent.id,
        name: parent.name,
        image: parent.image,
      })),
    ];
  }, [liveParents]);

  const demoTabs = listVisibleHomeShoppingShortcuts();
  const compact = width < 360;
  const tabWidth = compact ? 64 : 72;
  const selectedId = browse?.selectedCategory?.id ?? null;

  // Default to All so the shop-by-category grid appears immediately.
  useEffect(() => {
    if (!liveEnabled || !browse || liveTabs.length === 0) {
      return;
    }
    if (browse.selectedCategory) {
      const stillValid = liveTabs.some((tab) => tab.id === browse.selectedCategory?.id);
      if (stillValid) {
        return;
      }
    }
    browse.selectCategory({ id: HOME_ALL_CATEGORY.id, name: HOME_ALL_CATEGORY.name });
  }, [browse, liveEnabled, liveTabs]);

  // Keep the selected chip in view when switching.
  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const x = tabOffsets.current[selectedId];
    if (typeof x !== 'number') {
      return;
    }
    scrollerRef.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });
  }, [selectedId]);

  function selectLiveTab(tab: TabItem) {
    if (!browse) {
      if (!tab.isAll) {
        router.push({ pathname: '/category/[id]', params: { id: tab.id } });
      }
      return;
    }
    browse.selectCategory({ id: tab.id, name: tab.name });
  }

  function openCollection(id: ShoppingCollectionId) {
    router.push({
      pathname: '/collection/[id]',
      params: { id },
    });
  }

  function onTabLayout(id: string, x: number) {
    tabOffsets.current[id] = x;
  }

  if (liveEnabled) {
    if (liveTabs.length === 0) {
      return null;
    }
    return (
      <View style={styles.strip}>
        <ScrollView
          ref={(node) => {
            scrollerRef.current = node;
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          style={styles.scroller}
          contentContainerStyle={styles.row}>
          {liveTabs.map((tab) => {
            const selected = tab.id === selectedId;
            return (
              <CategoryPill
                key={tab.id}
                tab={tab}
                selected={selected}
                width={tabWidth}
                compact={compact}
                onPress={() => selectLiveTab(tab)}
                onLayoutX={(x) => onTabLayout(tab.id, x)}
              />
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.strip}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={styles.scroller}
        contentContainerStyle={styles.row}>
        {demoTabs.map((tab) => (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityLabel={tab.badgeLabel ? `${tab.title}. ${tab.badgeLabel}` : tab.title}
            onPress={() => openCollection(tab.id)}
            style={[styles.pill, { width: tabWidth }]}
            testID={`home-shortcut-${tab.id}`}>
            <View style={styles.pillInner}>
              {tab.badgeLabel ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badgeLabel}</Text>
                </View>
              ) : null}
              <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
                <CatalogImage
                  source={IMAGE_BY_COLLECTION[tab.id]}
                  label={shortcutLabel(tab.id)}
                  style={styles.imageFill}
                  contentFit="contain"
                />
              </View>
              <Text numberOfLines={2} style={[styles.label, compact && styles.labelCompact]}>
                {shortcutLabel(tab.id)}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

type CategoryPillProps = {
  tab: TabItem;
  selected: boolean;
  width: number;
  compact: boolean;
  onPress: () => void;
  onLayoutX: (x: number) => void;
};

const CategoryPill = memo(function CategoryPill({
  tab,
  selected,
  width,
  compact,
  onPress,
  onLayoutX,
}: CategoryPillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={tab.name}
      onPress={onPress}
      onLayout={(event) => onLayoutX(event.nativeEvent.layout.x)}
      style={[styles.pill, { width }, selected ? styles.pillSelected : styles.pillIdle]}
      testID={`home-category-${tab.id}`}>
      <View style={styles.pillInner}>
        <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
          {tab.isAll ? (
            <SoftIcon name="grid" size={compact ? 22 : 24} />
          ) : tab.image && hasUsableImage(tab.image) ? (
            <CatalogImage
              source={tab.image}
              label={tab.name}
              style={styles.imageFill}
              contentFit="contain"
            />
          ) : (
            <SoftIcon name="box" size={compact ? 22 : 24} />
          )}
        </View>
        <Text
          numberOfLines={2}
          style={[styles.label, compact && styles.labelCompact, selected && styles.labelSelected]}>
          {tab.name}
        </Text>
      </View>
    </Pressable>
  );
});

function hasUsableImage(source: ImageSource | undefined): boolean {
  if (typeof source === 'number') {
    return true;
  }
  if (
    typeof source === 'object' &&
    source != null &&
    'uri' in source &&
    typeof source.uri === 'string' &&
    source.uri.trim().length > 0
  ) {
    return true;
  }
  return false;
}

function shortcutLabel(id: ShoppingCollectionId): string {
  switch (id) {
    case 'all':
      return 'All';
    case 'fresh':
      return 'Fresh';
    case 'diwali':
      return 'Diwali';
    case 'electronics':
      return 'Electronics';
    case 'organic':
      return 'Organic';
    default:
      return id;
  }
}

const styles = StyleSheet.create({
  strip: {
    marginTop: 2,
    backgroundColor: colors.cream,
    paddingTop: 6,
    paddingBottom: 0,
  },
  scroller: {
    flexGrow: 0,
  },
  row: {
    paddingLeft: 10,
    paddingRight: 12,
    alignItems: 'stretch',
    gap: 8,
  },
  pill: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  pillIdle: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
  },
  pillSelected: {
    backgroundColor: colors.warmBackground,
  },
  pillInner: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 4,
    minHeight: 78,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  iconWrapCompact: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  imageFill: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 4,
    zIndex: 2,
    alignSelf: 'center',
    backgroundColor: INK,
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 7,
    lineHeight: 9,
    color: colors.white,
  },
  label: {
    marginTop: 6,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    color: INK,
    textAlign: 'center',
    width: '100%',
  },
  labelCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
  labelSelected: {
    color: colors.primaryInk,
  },
});
