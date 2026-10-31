import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CategoryCard } from '@/components/home/CategoryCard';
import { SectionHeader } from '@/components/home/SectionHeader';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { mockCategories } from '@/data/mockCategories';
import { previewCategoryGroups } from '@/data/previewImageCatalog';

export function CategoryGrid() {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const groups = UI_PREVIEW_MODE ? previewCategoryGroups() : [];
  const categories = mockCategories.filter((category) => category.id !== 'masala');

  if (groups.length > 0) {
    return (
      <View style={styles.groups}>
        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <SectionHeader title={group.title} />
            <View style={[styles.grid, compact && styles.gridCompact]}>
              {group.categories.map((category) => (
                <View key={category.id} style={styles.cell}>
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
        <View key={category.id} style={styles.cell}>
          <CategoryCard category={category} compact={compact} largeImage={UI_PREVIEW_MODE} />
        </View>
      ))}
      {UI_PREVIEW_MODE ? null : (
      <View style={styles.cell}>
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
    width: '25%',
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
