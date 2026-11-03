import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import type { OrdersFilterId } from '@/utils/orderListing';

const FILTERS: { id: OrdersFilterId; label: string }[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'active', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
];

type OrdersFilterChipsProps = {
  value: OrdersFilterId;
  onChange: (next: OrdersFilterId) => void;
};

export function OrdersFilterChips({ value, onChange }: OrdersFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}>
      {FILTERS.map((filter) => {
        const selected = filter.id === value;
        return (
          <Pressable
            key={filter.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={filter.label}
            onPress={() => onChange(filter.id)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && styles.pressed,
            ]}
            testID={`orders-filter-${filter.id}`}>
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{filter.label}</Text>
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
    gap: 8,
    alignItems: 'center',
    paddingRight: 8,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  chipLabelSelected: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  pressed: {
    opacity: 0.8,
  },
  tail: {
    width: 4,
  },
});
