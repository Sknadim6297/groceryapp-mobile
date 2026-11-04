import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PriceRangeDualSlider } from '@/components/catalog/PriceRangeDualSlider';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts, radii, shadow } from '@/constants/theme';
import type { CategoryFilterOption, FilterStarRating, ProductFiltersState } from '@/types/productFilters';
import {
  catalogueHasRatingSignals,
  cloneFilters,
  createDefaultFilters,
  FILTER_STAR_OPTIONS,
  filtersEqual,
  parsePriceInput,
  priceBoundsFromPool,
  type ListedProduct,
} from '@/utils/productFilters';

type ProductFiltersSheetProps = {
  visible: boolean;
  applied: ProductFiltersState;
  categories: CategoryFilterOption[];
  /** Pool used to derive price bounds and rating availability. */
  pricePool: readonly ListedProduct[];
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
  const sheetHeight = Math.min(Math.round(height * 0.88), 760);
  const [draft, setDraft] = useState<ProductFiltersState>(() => cloneFilters(applied));
  const [draftForOpen, setDraftForOpen] = useState(false);
  const [syncedApplied, setSyncedApplied] = useState(applied);
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');

  const bounds = useMemo(() => priceBoundsFromPool(pricePool), [pricePool]);
  const ratingSupported = useMemo(() => catalogueHasRatingSignals(pricePool), [pricePool]);

  if (visible && (!draftForOpen || !filtersEqual(syncedApplied, applied))) {
    setDraftForOpen(true);
    setSyncedApplied(applied);
    const next = cloneFilters(applied);
    setDraft(next);
    setMinText(String(next.priceMin ?? bounds.min));
    setMaxText(String(next.priceMax ?? bounds.max));
  } else if (!visible && draftForOpen) {
    setDraftForOpen(false);
  }

  const displayLow = draft.priceMin ?? bounds.min;
  const displayHigh = draft.priceMax ?? bounds.max;
  const matchCount = previewCount(draft);
  const applyDisabled = matchCount === 0;
  const allCategoriesSelected = draft.categoryIds.length === 0;

  function toggleCategory(id: string) {
    setDraft((current) => {
      const exists = current.categoryIds.includes(id);
      return {
        ...current,
        categoryIds: exists ? current.categoryIds.filter((entry) => entry !== id) : [...current.categoryIds, id],
      };
    });
  }

  function selectAllCategories() {
    setDraft((current) => ({ ...current, categoryIds: [] }));
  }

  function setPriceRange(low: number, high: number) {
    const nextLow = Math.max(bounds.min, Math.min(low, high - 1));
    const nextHigh = Math.min(bounds.max, Math.max(high, nextLow + 1));
    setDraft((current) => ({
      ...current,
      priceMin: nextLow <= bounds.min && nextHigh >= bounds.max ? null : nextLow,
      priceMax: nextLow <= bounds.min && nextHigh >= bounds.max ? null : nextHigh,
    }));
    setMinText(String(nextLow));
    setMaxText(String(nextHigh));
  }

  function commitMinText(raw: string) {
    const parsed = parsePriceInput(raw);
    if (parsed == null) {
      setMinText(String(displayLow));
      return;
    }
    setPriceRange(parsed, displayHigh);
  }

  function commitMaxText(raw: string) {
    const parsed = parsePriceInput(raw);
    if (parsed == null) {
      setMaxText(String(displayHigh));
      return;
    }
    setPriceRange(displayLow, parsed);
  }

  function toggleStar(star: FilterStarRating) {
    setDraft((current) => {
      const exists = current.ratingStars.includes(star);
      return {
        ...current,
        ratingStars: exists
          ? current.ratingStars.filter((entry) => entry !== star)
          : [...current.ratingStars, star],
      };
    });
  }

  function clearDraft() {
    setDraft(createDefaultFilters());
    setMinText(String(bounds.min));
    setMaxText(String(bounds.max));
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
            <Text style={styles.sectionTitle}>Categories:</Text>
            <View style={styles.categoryGrid}>
              <FilterCheckRow
                label="All"
                checked={allCategoriesSelected}
                onPress={selectAllCategories}
                testID="filter-category-all"
              />
              {categories.map((category) => {
                const selected = draft.categoryIds.includes(category.id);
                return (
                  <FilterCheckRow
                    key={category.id}
                    label={`${category.name} (${category.count})`}
                    checked={selected}
                    onPress={() => toggleCategory(category.id)}
                    testID={`filter-category-${category.id}`}
                  />
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Pricing:</Text>
            <View style={styles.priceInputs}>
              <View style={styles.priceField}>
                <Text style={styles.priceFieldLabel}>Min</Text>
                <TextInput
                  value={minText}
                  onChangeText={setMinText}
                  onBlur={() => commitMinText(minText)}
                  onSubmitEditing={() => commitMinText(minText)}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={styles.priceInput}
                  accessibilityLabel="Minimum price"
                  testID="filter-price-min"
                />
              </View>
              <View style={styles.priceField}>
                <Text style={styles.priceFieldLabel}>Max</Text>
                <TextInput
                  value={maxText}
                  onChangeText={setMaxText}
                  onBlur={() => commitMaxText(maxText)}
                  onSubmitEditing={() => commitMaxText(maxText)}
                  keyboardType="numeric"
                  returnKeyType="done"
                  style={styles.priceInput}
                  accessibilityLabel="Maximum price"
                  testID="filter-price-max"
                />
              </View>
            </View>
            <PriceRangeDualSlider
              boundMin={bounds.min}
              boundMax={bounds.max}
              low={displayLow}
              high={displayHigh}
              onChange={setPriceRange}
            />

            <Text style={styles.sectionTitle}>Product Status:</Text>
            <View style={styles.statusRow}>
              {stockFilterSupported ? (
                <FilterCheckRow
                  label="In Stock"
                  checked={draft.inStockOnly}
                  onPress={() => setDraft((current) => ({ ...current, inStockOnly: !current.inStockOnly }))}
                  testID="filter-in-stock"
                  compact
                />
              ) : (
                <View style={[styles.checkRow, styles.checkRowCompact, styles.disabledChip]} testID="filter-in-stock-unavailable">
                  <View style={styles.checkbox} />
                  <Text style={styles.disabledLabel}>In Stock</Text>
                </View>
              )}
              <FilterCheckRow
                label="On Sale"
                checked={draft.discountedOnly}
                onPress={() => setDraft((current) => ({ ...current, discountedOnly: !current.discountedOnly }))}
                testID="filter-discounted"
                compact
              />
            </View>
            {!stockFilterSupported ? (
              <Text style={styles.hint}>Live stock is not published on catalogue items yet.</Text>
            ) : null}

            <Text style={styles.sectionTitle}>Rating Stars:</Text>
            {ratingSupported ? (
              <View style={styles.statusRow}>
                {FILTER_STAR_OPTIONS.map((option) => {
                  const checked = draft.ratingStars.includes(option.id);
                  return (
                    <FilterCheckRow
                      key={option.id}
                      label={option.label}
                      checked={checked}
                      onPress={() => toggleStar(option.id)}
                      testID={`filter-star-${option.id}`}
                      compact
                    />
                  );
                })}
              </View>
            ) : (
              <Text style={styles.hint} testID="filter-rating-unavailable">
                Product ratings are not published on this catalogue yet.
              </Text>
            )}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset filters"
              onPress={clearDraft}
              style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
              testID="product-filters-clear">
              <Text style={styles.resetLabel}>Reset</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                applyDisabled ? 'No matching products' : `Show results, ${matchCount} products`
              }
              accessibilityState={{ disabled: applyDisabled }}
              disabled={applyDisabled}
              onPress={apply}
              style={({ pressed }) => [
                styles.showButton,
                applyDisabled && styles.showDisabled,
                pressed && !applyDisabled && styles.pressed,
              ]}
              testID="product-filters-apply">
              <Text style={styles.showLabel}>
                {applyDisabled ? 'No matches' : 'Show Results'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterCheckRow({
  label,
  checked,
  onPress,
  testID,
  compact = false,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  testID: string;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.checkRow,
        compact && styles.checkRowCompact,
        pressed && styles.pressed,
      ]}
      testID={testID}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <AppIcon name="check" color={colors.text} size={12} /> : null}
      </View>
      <Text style={styles.checkLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17, 24, 39, 0.42)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    ...shadow.card,
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
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    letterSpacing: -0.2,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warmBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    marginTop: 10,
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkRow: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 6,
    paddingRight: 8,
  },
  checkRowCompact: {
    width: 'auto',
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  checkLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  priceInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  priceField: {
    flex: 1,
    gap: 6,
  },
  priceFieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  priceInput: {
    minHeight: 44,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.warmBackground,
    paddingHorizontal: 12,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  disabledChip: {
    opacity: 0.55,
  },
  disabledLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: -2,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  resetButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  resetLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  showButton: {
    flex: 1.35,
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
  },
  showDisabled: {
    opacity: 0.45,
  },
  showLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
