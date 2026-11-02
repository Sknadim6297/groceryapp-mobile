import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { colors, fonts } from '@/constants/theme';
import type { Category } from '@/types/category';

type CategoryCardProps = {
  category: Category;
  compact: boolean;
  largeImage?: boolean;
};

export function CategoryCard({ category, compact, largeImage = false }: CategoryCardProps) {
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
      <View style={largeImage ? styles.frameLarge : [styles.frame, compact && styles.frameCompact]}>
        <CatalogImage source={category.image} label={category.name} style={styles.imageFill} />
      </View>
      <Text numberOfLines={2} maxFontSizeMultiplier={1.15} style={[styles.label, compact && styles.labelCompact]}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'stretch',
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 8,
    shadowColor: '#171717',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardCompact: {
    borderRadius: 14,
    paddingTop: 6,
    paddingBottom: 6,
  },
  pressed: {
    opacity: 0.82,
  },
  frame: {
    alignSelf: 'center',
    width: '78%',
    aspectRatio: 1,
  },
  frameCompact: {
    width: '72%',
  },
  frameLarge: {
    width: '100%',
    aspectRatio: 1,
  },
  imageFill: {
    width: '100%',
    height: '100%',
  },
  label: {
    width: '100%',
    marginTop: 6,
    minHeight: 26,
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
