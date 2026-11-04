import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii, shadow, space } from '@/constants/theme';
import type { OrdersFilterId } from '@/utils/orderListing';

const FILTERS: { id: OrdersFilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
];

type OrdersFilterChipsProps = {
  value: OrdersFilterId;
  onChange: (next: OrdersFilterId) => void;
  counts?: Partial<Record<OrdersFilterId, number>>;
};

export function OrdersFilterChips({ value, onChange, counts }: OrdersFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}>
      {FILTERS.map((filter) => {
        const selected = filter.id === value;
        const count = counts?.[filter.id];
        return (
          <Pressable
            key={filter.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={
              typeof count === 'number' ? `${filter.label}, ${count} orders` : filter.label
            }
            onPress={() => onChange(filter.id)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && styles.pressed,
            ]}
            testID={`orders-filter-${filter.id}`}>
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{filter.label}</Text>
            {typeof count === 'number' ? (
              <View style={[styles.countPill, selected && styles.countPillSelected]}>
                <Text style={[styles.countLabel, selected && styles.countLabelSelected]}>{count}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
      <View style={styles.tail} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    gap: space.sm,
    alignItems: 'center',
    paddingVertical: 2,
    paddingRight: space.sm,
  },
  chip: {
    minHeight: 40,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...shadow.soft,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  chipLabelSelected: {
    color: colors.text,
  },
  countPill: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: colors.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillSelected: {
    backgroundColor: colors.white,
  },
  countLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  countLabelSelected: {
    color: colors.primaryInk,
  },
  pressed: {
    opacity: 0.82,
  },
  tail: {
    width: 4,
  },
});
