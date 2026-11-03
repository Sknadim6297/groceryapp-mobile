import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors, fonts, radii, shadow, space } from '@/constants/theme';
import { resolveParentIdForCategory } from '@/data/subcategoryCatalog';
import type { Category } from '@/types/category';
import { hapticSelection } from '@/utils/haptics';

type CategoryCardProps = {
  category: Category;
  compact: boolean;
  largeImage?: boolean;
};

export function CategoryCard({ category, compact, largeImage = false }: CategoryCardProps) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={category.name}
      onPress={() => {
        void hapticSelection();
        const parentId = resolveParentIdForCategory(category.id);
        if (parentId) {
          router.push({ pathname: '/category/[id]', params: { id: parentId } });
          return;
        }
        router.push({
          pathname: '/shop',
          params: { category: category.id },
        });
      }}
      style={[styles.card, compact && styles.cardCompact]}
      testID={`category-${category.id}`}>
      <View style={largeImage ? styles.frameLarge : [styles.frame, compact && styles.frameCompact]}>
        <CatalogImage source={category.image} label={category.name} style={styles.imageFill} />
      </View>
      <Text numberOfLines={2} maxFontSizeMultiplier={1.15} style={[styles.label, compact && styles.labelCompact]}>
        {category.name}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    alignItems: 'stretch',
    paddingHorizontal: space.sm,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    ...shadow.soft,
  },
  cardCompact: {
    borderRadius: radii.sm,
    paddingTop: 6,
    paddingBottom: 6,
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
    marginTop: space.sm,
    minHeight: 28,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 15,
    color: colors.text,
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
});
