import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii, shadow, space } from '@/constants/theme';
import type { ShoppingCollectionChip } from '@/types/shoppingCollection';

type CollectionFilterChipsProps = {
  chips: readonly ShoppingCollectionChip[];
  value: string;
  onChange: (next: string) => void;
};

export function CollectionFilterChips({ chips, value, onChange }: CollectionFilterChipsProps) {
  if (chips.length <= 1) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}>
      {chips.map((chip) => {
        const selected = chip.id === value;
        return (
          <Pressable
            key={chip.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={chip.label}
            onPress={() => onChange(chip.id)}
            style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
            testID={`collection-chip-${chip.id}`}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{chip.label}</Text>
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
    marginTop: space.sm,
  },
  row: {
    gap: space.sm,
    alignItems: 'center',
    paddingRight: space.sm,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.82,
  },
  tail: {
    width: 4,
  },
});
