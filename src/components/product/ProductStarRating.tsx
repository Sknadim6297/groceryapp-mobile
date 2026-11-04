import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';

const STAR_GOLD = '#F59E0B';

type ProductStarRatingProps = {
  rating: number;
  size?: number;
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
};

export function ProductStarRating({
  rating,
  size = 14,
  showValue = false,
  interactive = false,
  onChange,
}: ProductStarRatingProps) {
  const clamped = Math.min(5, Math.max(0, rating));

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const on = star <= Math.round(clamped);
        const icon = (
          <AppIcon
            name="star"
            color={on ? STAR_GOLD : '#D1D5DB'}
            size={size}
            filled={on}
          />
        );
        if (!interactive) {
          return <View key={star}>{icon}</View>;
        }
        return (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${star} star${star === 1 ? '' : 's'}`}
            hitSlop={6}
            onPress={() => onChange?.(star)}>
            {icon}
          </Pressable>
        );
      })}
      {showValue ? <Text style={styles.value}>{clamped.toFixed(1)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  value: {
    marginLeft: 4,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
  },
});
