import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CategoryCard } from '@/components/home/CategoryCard';
import { SectionHeader } from '@/components/home/SectionHeader';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { mockCategories } from '@/data/mockCategories';
import { previewCategoryGroups } from '@/data/previewImageCatalog';
import type { Category, LiveCategoryParent } from '@/types/category';

type CategoryGridProps = {
  /** Live parent categories (home strip uses these). */
  categories?: Category[];
  /** Live category tree — Shop by category prefers subcategory leaves. */
  categoryTree?: LiveCategoryParent[];
};

/**
 * Shop by category.
 * Live mode: show SubCategory leaves when the API provides them; otherwise Category leaves.
 * Demo mode: preview groups / mock categories.
 */
export function CategoryGrid({ categories: liveCategories, categoryTree }: CategoryGridProps) {
  const { width } = useWindowDimensions();
  const content = Math.min(width, homeLayout.maxWidth);
  const columns = content < 360 ? 2 : content < 460 ? 3 : 4;
  const compact = content < 360;

  if (categoryTree && categoryTree.length > 0) {
    const hasRealSubs = categoryTree.some((parent) =>
      parent.children.some((child) => child.id !== parent.id),
    );

    if (hasRealSubs) {
      return (
        <View style={styles.groups}>
          <View style={styles.group}>
            <SectionHeader title="Shop by category" subtitle="Subcategories from this store" />
          </View>
          {categoryTree.map((parent) => (
            <View key={parent.id} style={styles.group}>
              <SectionHeader title={parent.name} />
              <View style={[styles.grid, compact && styles.gridCompact]}>
                {parent.children.map((child) => (
                  <View key={child.id} style={[styles.cell, { width: `${100 / columns}%` }]}>
                    <CategoryCard
                      category={{ id: child.id, name: child.name, image: child.image }}
                      compact={compact}
                      largeImage
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      );
    }

    const leaves = categoryTree.flatMap((parent) => parent.children);
    return (
      <View style={styles.groups}>
        <View style={styles.group}>
          <SectionHeader
            title="Shop by category"
            subtitle="From this store’s catalogue. Subcategories will appear here when published."
          />
          <View style={[styles.grid, compact && styles.gridCompact]}>
            {leaves.map((child) => (
              <View key={child.id} style={[styles.cell, { width: `${100 / columns}%` }]}>
                <CategoryCard
                  category={{ id: child.id, name: child.name, image: child.image }}
                  compact={compact}
                  largeImage
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (liveCategories) {
    if (liveCategories.length === 0) {
      return null;
    }
    return (
      <View style={styles.groups}>
        <View style={styles.group}>
          <SectionHeader title="Shop by category" subtitle="From this store’s catalogue" />
          <View style={[styles.grid, compact && styles.gridCompact]}>
            {liveCategories.map((category) => (
              <View key={category.id} style={[styles.cell, { width: `${100 / columns}%` }]}>
                <CategoryCard category={category} compact={compact} largeImage />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  const groups = previewCategoryGroups();
  const categories = mockCategories.filter((category) => category.id !== 'masala');

  if (groups.length > 0) {
    return (
      <View style={styles.groups}>
        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <SectionHeader title={group.title} />
            <View style={[styles.grid, compact && styles.gridCompact]}>
              {group.categories.map((category) => (
                <View key={category.id} style={[styles.cell, { width: `${100 / columns}%` }]}>
                  <CategoryCard category={category} compact={compact} largeImage />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.grid, compact && styles.gridCompact]}>
      {categories.map((category) => (
        <View key={category.id} style={[styles.cell, { width: `${100 / columns}%` }]}>
          <CategoryCard category={category} compact={compact} largeImage={UI_PREVIEW_MODE} />
        </View>
      ))}
      {UI_PREVIEW_MODE ? null : (
        <View style={[styles.cell, { width: `${100 / columns}%` }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More categories"
            onPress={() => router.push('/shop')}
            style={({ pressed }) => [styles.more, compact && styles.moreCompact, pressed && styles.pressed]}>
            <View style={styles.dots}>
              {[0, 1, 2, 3].map((dot) => (
                <View key={dot} style={styles.dot} />
              ))}
            </View>
            <Text numberOfLines={2} style={styles.moreLabel}>
              More Categories
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  groups: {
    gap: 18,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  group: {
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 8,
  },
  gridCompact: {
    paddingTop: 4,
  },
  cell: {
    padding: 4,
  },
  more: {
    backgroundColor: '#F3F5F7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    minHeight: 108,
    gap: 8,
  },
  moreCompact: {
    minHeight: 96,
  },
  pressed: {
    opacity: 0.82,
  },
  dots: {
    width: 36,
    height: 36,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignContent: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  moreLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 13,
    color: colors.text,
    textAlign: 'center',
  },
});
