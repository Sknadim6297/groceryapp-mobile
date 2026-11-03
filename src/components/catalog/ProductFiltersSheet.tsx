import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import type { DemoProduct } from '@/types/catalog';
import type { CategoryFilterOption, PriceRangeId, ProductFiltersState } from '@/types/productFilters';
import {
  availablePriceRanges,
  cloneFilters,
  createDefaultFilters,
  filtersEqual,
  PRICE_RANGE_OPTIONS,
} from '@/utils/productFilters';

type ProductFiltersSheetProps = {
  visible: boolean;
  applied: ProductFiltersState;
  categories: CategoryFilterOption[];
  /** Pool used to derive which price ranges are meaningful. */
  pricePool: readonly DemoProduct[];
  stockFilterSupported: boolean;
  previewCount: (draft: ProductFiltersState) => number;
  onApply: (next: ProductFiltersState) => void;
  onClose: () => void;
};

export function ProductFiltersSheet({
  visible,
  applied,
  categories,
  pricePool,
  stockFilterSupported,
  previewCount,
  onApply,
  onClose,
}: ProductFiltersSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetHeight = Math.min(Math.round(height * 0.82), 720);
  const [draft, setDraft] = useState<ProductFiltersState>(() => cloneFilters(applied));
  const [draftForOpen, setDraftForOpen] = useState(false);
  const [syncedApplied, setSyncedApplied] = useState(applied);

  if (visible && (!draftForOpen || !filtersEqual(syncedApplied, applied))) {
    setDraftForOpen(true);
    setSyncedApplied(applied);
    setDraft(cloneFilters(applied));
  } else if (!visible && draftForOpen) {
    setDraftForOpen(false);
  }

  const priceOptions = useMemo(() => availablePriceRanges(pricePool), [pricePool]);
  const matchCount = previewCount(draft);
  const applyDisabled = matchCount === 0;

  function toggleCategory(id: string) {
    setDraft((current) => {
      const exists = current.categoryIds.includes(id);
      return {
        ...current,
        categoryIds: exists ? current.categoryIds.filter((entry) => entry !== id) : [...current.categoryIds, id],
      };
    });
  }

  function setPrice(id: PriceRangeId) {
    setDraft((current) => ({ ...current, priceRange: id }));
  }

  function clearDraft() {
    setDraft(createDefaultFilters());
  }

  function apply() {
    if (applyDisabled) {
      return;
    }
    onApply(draft);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss filters"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View style={[styles.sheet, { height: sheetHeight }]} testID="product-filters-sheet">
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              onPress={onClose}
              hitSlop={10}
              style={styles.close}
              testID="product-filters-close">
              <AppIcon name="close" color={colors.text} size={20} />
            </Pressable>
          </View>
          <View style={styles.divider} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionTitle}>Category</Text>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: draft.categoryIds.length === 0 }}
              accessibilityLabel="All Categories"
              onPress={() => setDraft((current) => ({ ...current, categoryIds: [] }))}
              style={({ pressed }) => [
                styles.chip,
                draft.categoryIds.length === 0 && styles.chipActive,
                pressed && styles.pressed,
              ]}
              testID="filter-category-all">
              <Text style={[styles.chipLabel, draft.categoryIds.length === 0 && styles.chipLabelActive]}>
                All Categories
              </Text>
            </Pressable>
            <View style={styles.chipWrap}>
              {categories.map((category) => {
                const selected = draft.categoryIds.includes(category.id);
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`${category.name}, ${category.count} items`}
                    onPress={() => toggleCategory(category.id)}
                    style={({ pressed }) => [styles.chip, selected && styles.chipActive, pressed && styles.pressed]}
                    testID={`filter-category-${category.id}`}>
                    <Text style={[styles.chipLabel, selected && styles.chipLabelActive]} numberOfLines={2}>
                      {category.name}
                    </Text>
                    <Text style={[styles.chipCount, selected && styles.chipCountActive]}>{category.count}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.chipWrap}>
              {(priceOptions.length > 0 ? priceOptions : PRICE_RANGE_OPTIONS).map((option) => {
                const selected = draft.priceRange === option.id;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    onPress={() => setPrice(option.id)}
                    style={({ pressed }) => [styles.chip, selected && styles.chipActive, pressed && styles.pressed]}
                    testID={`filter-price-${option.id}`}>
                    <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Availability</Text>
            {stockFilterSupported ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: draft.inStockOnly }}
                accessibilityLabel="In Stock Only"
                onPress={() => setDraft((current) => ({ ...current, inStockOnly: !current.inStockOnly }))}
                style={({ pressed }) => [
                  styles.toggleRow,
                  draft.inStockOnly && styles.toggleRowActive,
                  pressed && styles.pressed,
                ]}
                testID="filter-in-stock">
                <View style={[styles.checkbox, draft.inStockOnly && styles.checkboxActive]}>
                  {draft.inStockOnly ? <AppIcon name="check" color={colors.text} size={14} /> : null}
                </View>
                <Text style={styles.toggleLabel}>In Stock Only</Text>
              </Pressable>
            ) : (
              <View style={styles.disabledNote} testID="filter-in-stock-unavailable">
                <Text style={styles.disabledTitle}>In Stock Only</Text>
                <Text style={styles.disabledBody}>
                  Live stock is not published on catalogue items yet, so this filter is unavailable.
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Offers</Text>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: draft.discountedOnly }}
              accessibilityLabel="Discounted Products Only"
              onPress={() => setDraft((current) => ({ ...current, discountedOnly: !current.discountedOnly }))}
              style={({ pressed }) => [
                styles.toggleRow,
                draft.discountedOnly && styles.toggleRowActive,
                pressed && styles.pressed,
              ]}
              testID="filter-discounted">
              <View style={[styles.checkbox, draft.discountedOnly && styles.checkboxActive]}>
                {draft.discountedOnly ? <AppIcon name="check" color={colors.text} size={14} /> : null}
              </View>
              <Text style={styles.toggleLabel}>Discounted Products Only</Text>
            </Pressable>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
              onPress={clearDraft}
              style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
              testID="product-filters-clear">
              <Text style={styles.clearLabel}>Clear All</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                applyDisabled ? 'No matching products' : `Apply filters, ${matchCount} products`
              }
              accessibilityState={{ disabled: applyDisabled }}
              disabled={applyDisabled}
              onPress={apply}
              style={({ pressed }) => [
                styles.applyButton,
                applyDisabled && styles.applyDisabled,
                pressed && !applyDisabled && styles.pressed,
              ]}
              testID="product-filters-apply">
              <Text style={styles.applyLabel}>
                {applyDisabled ? 'No matches' : `Apply Filters · ${matchCount}`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
  },
  close: {
    position: 'absolute',
    right: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    marginTop: 8,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
  },
  chipLabel: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
  },
  chipLabelActive: {
    fontFamily: fonts.semibold,
  },
  chipCount: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  chipCountActive: {
    color: colors.primaryInk,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  toggleRowActive: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primary,
  },
  toggleLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  disabledNote: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 4,
  },
  disabledTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  disabledBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  clearButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  clearLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  applyButton: {
    flex: 1.4,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
  },
  applyDisabled: {
    opacity: 0.45,
  },
  applyLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
