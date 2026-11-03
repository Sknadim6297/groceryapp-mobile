import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import type { ProductSortId } from '@/types/productFilters';
import { sortLabel } from '@/utils/productFilters';

type ProductFilterSortBarProps = {
  sort: ProductSortId;
  activeFilterCount: number;
  onOpenFilters: () => void;
  onOpenSort: () => void;
};

export function ProductFilterSortBar({
  sort,
  activeFilterCount,
  onOpenFilters,
  onOpenSort,
}: ProductFilterSortBarProps) {
  const filtersActive = activeFilterCount > 0;

  return (
    <View style={styles.row} testID="product-filter-sort-bar">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          filtersActive ? `Filters, ${activeFilterCount} active` : 'Filters'
        }
        onPress={onOpenFilters}
        style={({ pressed }) => [styles.pill, filtersActive && styles.pillActive, pressed && styles.pressed]}
        testID="product-filters-button">
        <AppIcon name="sliders" color={colors.text} size={16} />
        <Text style={styles.pillLabel}>Filters</Text>
        {filtersActive ? (
          <View style={styles.badge} accessibilityElementsHidden>
            <Text style={styles.badgeText}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sort: ${sortLabel(sort)}`}
        onPress={onOpenSort}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
        testID="product-sort-button">
        <AppIcon name="sort" color={colors.text} size={16} />
        <Text style={styles.pillLabel} numberOfLines={1}>
          Sort: {sortLabel(sort)}
        </Text>
        <AppIcon name="chevronDown" color={colors.textSecondary} size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pillActive: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.cream,
  },
  pillLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 13,
    color: colors.text,
  },
  pressed: {
    opacity: 0.78,
  },
});
