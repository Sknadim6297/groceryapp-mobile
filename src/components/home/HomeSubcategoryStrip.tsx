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
import {
  enrichLiveCategoryTreePresentation,
  localCategoryImage,
  resolvePresentationImage,
} from '@/utils/catalogPresentationAssets';
import { deriveLiveCategoryTree } from '@/utils/liveCatalogMeta';

const INK = '#171717';
const TILE_BG = '#FFF4D6';
const ROWS = 2;
/** Cap All-discovery tiles so Home stays light. */
const ALL_MAX_TILES = 24;
/** Prefer a few real children per parent in All mode. */
const ALL_PER_PARENT = 3;

type GridTile = {
  id: string;
  name: string;
  image: ImageSource;
  parentName: string;
};

/**
 * Subcategory grid under the main-category pills.
 * Never repeats main categories — only `/subcategories?category=` children.
 * All → mixed discovery from each parent (cached + deduped loads).
 */
export function HomeSubcategoryStrip() {
  const { width } = useWindowDimensions();
  const browse = useOptionalHomeCatalogBrowse();
  const { liveEnabled, loadSubcategories, products, remoteCategories } = useCatalog();
  const [rows, setRows] = useState<LiveSubcategoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

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
    if (!liveEnabled || !selected) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const requestId = selected.id;
    const requestName = selected.name;

    async function loadForSelection() {
      try {
        if (isAll) {
          // Mixed subcategory discovery — never main-category cards.
          const groups = await Promise.all(
            liveParents.map(async (parent) => {
              const fetched = await loadSubcategories(parent.name);
              return fetched
                .filter(
                  (row) => row.parentId === parent.id || row.parentName === parent.name,
                )
                .slice(0, ALL_PER_PARENT);
            }),
          );
          if (cancelled) {
            return;
          }
          // Ignore if user left All while requests were in flight.
          if (browse?.selectedCategory?.id !== HOME_ALL_CATEGORY.id) {
            return;
          }
          const mixed: LiveSubcategoryRecord[] = [];
          const seen = new Set<string>();
          for (const group of groups) {
            for (const row of group) {
              if (seen.has(row.id)) {
                continue;
              }
              seen.add(row.id);
              mixed.push(row);
              if (mixed.length >= ALL_MAX_TILES) {
                break;
              }
            }
            if (mixed.length >= ALL_MAX_TILES) {
              break;
            }
          }
          setRows(mixed);
          setLoading(false);
          return;
        }

        const fetched = await loadSubcategories(requestName);
        if (cancelled) {
          return;
        }
        // Stale guard: user switched categories mid-flight.
        if (browse?.selectedCategory?.id !== requestId) {
          return;
        }
        const scoped = fetched.filter(
          (row) => row.parentId === requestId || row.parentName === requestName,
        );
        setRows(scoped);
        setLoading(false);
      } catch {
        if (cancelled) {
          return;
        }
        setRows([]);
        setError('Could not load subcategories. Tap to retry.');
        setLoading(false);
      }
    }

    void loadForSelection();

    return () => {
      cancelled = true;
    };
  }, [
    browse?.selectedCategory?.id,
    isAll,
    liveEnabled,
    liveParents,
    loadSubcategories,
    reloadToken,
    selected,
  ]);

  const tiles = useMemo<GridTile[]>(() => {
    if (!selected) {
      return [];
    }
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      parentName: row.parentName,
      image: resolvePresentationImage(
        row.image,
        localCategoryImage(row.name, row.parentName || selected.name),
      ),
    }));
  }, [rows, selected]);

  const columns = useMemo(() => chunkIntoColumns(tiles, ROWS), [tiles]);

  if (!liveEnabled || !selected) {
    return null;
  }

  function openTile(tile: GridTile) {
    router.push({
      pathname: '/shop',
      params: { category: tile.id },
    });
  }

  function retry() {
    setReloadToken((token) => token + 1);
  }

  const heading = isAll ? 'Explore Our Collection' : selected.name;

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
          {isAll
            ? 'No subcategories published yet for this store.'
            : 'No subcategories in this category yet.'}
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
