import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import type { Category } from '@/types/category';

type CategoryCardProps = {
  category: Category;
  compact: boolean;
};

export function CategoryCard({ category, compact }: CategoryCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.name}
      onPress={() =>
        router.push({
          pathname: '/shop',
          params: { category: category.id },
        })
      }
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.pressed]}
      testID={`category-${category.id}`}>
      <Image
        source={category.image}
        style={[styles.image, compact && styles.imageCompact]}
        contentFit="contain"
        accessible={false}
        importantForAccessibility="no"
      />
      <Text numberOfLines={2} maxFontSizeMultiplier={1.15} style={[styles.label, compact && styles.labelCompact]}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F3F5F7',
    borderRadius: 16,
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 108,
  },
  cardCompact: {
    minHeight: 96,
    borderRadius: 14,
    paddingTop: 6,
    paddingBottom: 6,
  },
  pressed: {
    opacity: 0.82,
  },
  image: {
    width: '78%',
    aspectRatio: 1,
  },
  imageCompact: {
    width: '72%',
  },
  label: {
    width: '100%',
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 13,
    color: colors.text,
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
});
