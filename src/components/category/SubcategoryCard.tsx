import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { formatItemCount } from '@/utils/subcategorySearch';
import type { CatalogSubcategory } from '@/types/subcategory';

type SubcategoryCardProps = {
  subcategory: CatalogSubcategory;
  onPress: (subcategory: CatalogSubcategory) => void;
};

export function SubcategoryCard({ subcategory, onPress }: SubcategoryCardProps) {
  const { width } = useWindowDimensions();
  const compact = width < 360;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${subcategory.name}, ${formatItemCount(subcategory.productCount)}`}
      onPress={() => onPress(subcategory)}
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.pressed]}
      testID={`subcategory-${subcategory.id}`}>
      <View style={[styles.imageFrame, compact && styles.imageFrameCompact]}>
        <CatalogImage
          source={subcategory.image}
          label={subcategory.name}
          contentFit="contain"
          style={styles.imageFill}
        />
      </View>

      <Text
        numberOfLines={3}
        ellipsizeMode="tail"
        maxFontSizeMultiplier={1.15}
        style={[styles.name, compact && styles.nameCompact]}>
        {subcategory.name}
      </Text>

      <View style={styles.footer}>
        <Text numberOfLines={1} maxFontSizeMultiplier={1.1} style={styles.count}>
          {formatItemCount(subcategory.productCount)}
        </Text>
        <View style={styles.arrow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <AppIcon name="chevron" color={colors.text} size={14} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 188,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
    alignItems: 'stretch',
    shadowColor: '#171717',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardCompact: {
    minHeight: 172,
    borderRadius: 14,
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  pressed: {
    opacity: 0.86,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 1.15,
    borderRadius: 14,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
    padding: 8,
  },
  imageFrameCompact: {
    borderRadius: 12,
    padding: 6,
    marginBottom: 6,
  },
  imageFill: {
    width: '100%',
    height: '100%',
  },
  name: {
    width: '100%',
    minHeight: 48,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
    textAlign: 'center',
  },
  nameCompact: {
    minHeight: 42,
    fontSize: 12,
    lineHeight: 14,
  },
  footer: {
    marginTop: 'auto',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingTop: 4,
  },
  count: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  arrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
