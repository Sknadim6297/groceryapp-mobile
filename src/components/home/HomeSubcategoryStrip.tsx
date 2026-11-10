import type { ImageSource } from 'expo-image';
import { router } from 'expo-router';
import { memo, useEffect, useMemo, useState } from 'react';
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
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { HOME_ALL_CATEGORY } from '@/constants/homeCatalogBrowse';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { useCatalog } from '@/context/CatalogContext';
import { useOptionalHomeCatalogBrowse } from '@/context/HomeCatalogBrowseContext';
import { mergeRemoteCategoriesIntoTree } from '@/services/catalogMetaApi';
import type { LiveSubcategoryRecord } from '@/services/catalogMetaApi';
import type { LiveCategoryParent } from '@/types/category';
import { enrichLiveCategoryTreePresentation, localCategoryImage, resolvePresentationImage } from '@/utils/catalogPresentationAssets';
import { deriveLiveCategoryTree } from '@/utils/liveCatalogMeta';

const INK = '#171717';
const TILE_BG = '#FFF4D6';
const ROWS = 2;

type GridTile = {
  id: string;
  name: string;
  image: ImageSource;
  kind: 'category' | 'subcategory';
};

/**
 * Reference-style subcategory area: 2-row horizontal image grid under the category pills.
 * All → shop-by-category tiles from live parents.
 * Specific category → lazy GET /subcategories?category= (cached + deduped).
 */
export function HomeSubcategoryStrip() {
  const { width } = useWindowDimensions();
  const browse = useOptionalHomeCatalogBrowse();
  const { liveEnabled, loadSubcategories, products, remoteCategories } = useCatalog();
  const [remoteSubs, setRemoteSubs] = useState<LiveSubcategoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = browse?.selectedCategory ?? null;
  const isAll = selected?.id === HOME_ALL_CATEGORY.id;
  const content = Math.min(width, homeLayout.maxWidth);
  const cardWidth = content < 360 ? 108 : content < 420 ? 118 : 126;

  const liveParents = useMemo(() => {
    if (!liveEnabled) {
      return [] as LiveCategoryParent[];
    }
    const fromProducts = enrichLiveCategoryTreePresentation(deriveLiveCategoryTree(products));
    return enrichLiveCategoryTreePresentation(
      mergeRemoteCategoriesIntoTree(fromProducts, remoteCategories),
    );
  }, [liveEnabled, products, remoteCategories]);

  useEffect(() => {
    if (!liveEnabled || !selected?.name || isAll) {
      setRemoteSubs([]);
      setLoading(false);
      setError(null);
      return;
    }

    const requestName = selected.name;
    const requestId = selected.id;
    let cancelled = false;
    setLoading(true);
    setError(null);

    void loadSubcategories(requestName)
      .then((fetched) => {
        if (cancelled) {
          return;
        }
        const scoped = fetched.filter(
          (row) => row.parentId === requestId || row.parentName === requestName,
        );
        setRemoteSubs(scoped);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setRemoteSubs([]);
        setError('Could not load subcategories. Tap to retry.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAll, liveEnabled, loadSubcategories, selected?.id, selected?.name]);

  const tiles = useMemo<GridTile[]>(() => {
    if (!selected) {
      return [];
    }
    if (isAll) {
      return liveParents.map((parent) => ({
        id: parent.id,
        name: parent.name,
        image: resolvePresentationImage(
          parent.image,
          localCategoryImage(parent.name),
        ),
        kind: 'category' as const,
      }));
    }
    return remoteSubs.map((row) => ({
      id: row.id,
      name: row.name,
      image: resolvePresentationImage(
        row.image,
        localCategoryImage(row.name, selected.name),
      ),
      kind: 'subcategory' as const,
    }));
  }, [isAll, liveParents, remoteSubs, selected]);

  const columns = useMemo(() => chunkIntoColumns(tiles, ROWS), [tiles]);

  if (!liveEnabled || !selected) {
    return null;
  }

  function openTile(tile: GridTile) {
    if (tile.kind === 'category') {
      const parent = liveParents.find((row) => row.id === tile.id);
      if (parent && browse) {
        browse.selectCategory({ id: parent.id, name: parent.name });
        return;
      }
      router.push({ pathname: '/shop', params: { category: tile.id } });
      return;
    }
    router.push({
      pathname: '/shop',
      params: { category: tile.id },
    });
  }

  function retry() {
    if (!selected || isAll) {
      return;
    }
    setLoading(true);
    setError(null);
    void loadSubcategories(selected.name).then((fetched) => {
      const scoped = fetched.filter(
        (row) => row.parentId === selected.id || row.parentName === selected.name,
      );
      setRemoteSubs(scoped);
      setLoading(false);
    });
  }

  const heading = isAll ? 'Shop by category' : selected.name;

  return (
    <View style={styles.section} testID="home-subcategory-strip">
      <Text style={styles.heading} accessibilityRole="header" numberOfLines={1}>
        {heading}
      </Text>

      {loading ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}>
          {Array.from({ length: 3 }, (_, col) => (
            <View key={`skel-col-${col}`} style={[styles.column, { width: cardWidth }]}>
              {Array.from({ length: ROWS }, (_, row) => (
                <View key={`skel-${col}-${row}`} style={styles.skelCard}>
                  <LoadingSkeleton height={14} width="70%" />
                  <LoadingSkeleton height={cardWidth - 28} borderRadius={14} style={styles.skelImage} />
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : error ? (
        <Pressable onPress={retry} accessibilityRole="button" accessibilityLabel="Retry loading subcategories">
          <Text style={styles.error}>{error}</Text>
        </Pressable>
      ) : tiles.length === 0 ? (
        <Text style={styles.empty} accessibilityRole="text">
          No subcategories in this category yet.
        </Text>
      ) : (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          contentContainerStyle={styles.row}>
          {columns.map((column, columnIndex) => (
            <View key={`col-${columnIndex}`} style={[styles.column, { width: cardWidth }]}>
              {column.map((tile) => (
                <SubcategoryCard
                  key={tile.id}
                  tile={tile}
                  onPress={() => openTile(tile)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

type SubcategoryCardProps = {
  tile: GridTile;
  onPress: () => void;
};

const SubcategoryCard = memo(function SubcategoryCard({ tile, onPress }: SubcategoryCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tile.name}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      testID={`home-subcategory-${tile.id}`}>
      <Text numberOfLines={2} maxFontSizeMultiplier={1.15} style={styles.cardTitle}>
        {tile.name}
      </Text>
      <View style={styles.imageFrame}>
        {hasUsableImage(tile.image) ? (
          <CatalogImage
            source={tile.image}
            label={tile.name}
            style={styles.imageFill}
            contentFit="contain"
          />
        ) : (
          <View style={styles.iconFallback}>
            <SoftIcon name="box" size={28} />
          </View>
        )}
      </View>
    </Pressable>
  );
});

function chunkIntoColumns<T>(items: T[], rows: number): T[][] {
  if (items.length === 0) {
    return [];
  }
  const columns: T[][] = [];
  for (let i = 0; i < items.length; i += rows) {
    columns.push(items.slice(i, i + rows));
  }
  return columns;
}

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

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.warmBackground,
    paddingTop: 10,
    paddingBottom: 10,
  },
  heading: {
    marginHorizontal: 14,
    marginBottom: 10,
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: INK,
  },
  row: {
    paddingLeft: 12,
    paddingRight: 12,
    gap: 10,
  },
  column: {
    gap: 10,
  },
  card: {
    backgroundColor: TILE_BG,
    borderRadius: 18,
    paddingTop: 10,
    paddingHorizontal: 8,
    paddingBottom: 8,
    minHeight: 132,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  cardTitle: {
    minHeight: 32,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: INK,
    textAlign: 'left',
  },
  imageFrame: {
    marginTop: 4,
    width: '100%',
    aspectRatio: 1.05,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFill: {
    width: '100%',
    height: '100%',
  },
  iconFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skelCard: {
    backgroundColor: TILE_BG,
    borderRadius: 18,
    padding: 10,
    minHeight: 132,
    gap: 10,
  },
  skelImage: {
    marginTop: 4,
  },
  empty: {
    marginHorizontal: 14,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  error: {
    marginHorizontal: 14,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
});
