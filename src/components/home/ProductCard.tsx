import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { useMockCart } from '@/context/MockCartContext';
import type { DemoProduct } from '@/types/catalog';

type ProductCardProps = {
  product: DemoProduct;
  compact: boolean;
};

export function ProductCard({ product, compact }: ProductCardProps) {
  const { add } = useMockCart();
  const [saved, setSaved] = useState(false);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Image source={product.image} style={styles.image} contentFit="contain" accessible={false} />
      <View style={styles.copy}>
        <Text numberOfLines={2} style={[styles.name, compact && styles.nameCompact]}>
          {product.name}
        </Text>
        <Text style={styles.unit}>{product.unit}</Text>
        <View style={styles.prices}>
          <Text style={styles.price}>₹{product.price}</Text>
          <Text style={styles.compare}>₹{product.compareAt}</Text>
        </View>
        <View style={styles.discount}>
          <Text style={styles.discountLabel}>{product.discountLabel}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saved ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
        hitSlop={6}
        onPress={() => setSaved((current) => !current)}
        style={styles.heart}>
        <AppIcon name={saved ? 'heartFill' : 'heart'} color={saved ? colors.danger : '#CBD5E1'} size={16} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${product.name} to the demo cart`}
        onPress={() => add(product.id)}
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
        <AppIcon name="plus" color={colors.text} size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 118,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardCompact: {
    minHeight: 108,
  },
  image: {
    width: 64,
    height: 118,
    backgroundColor: colors.white,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: 8,
    paddingVertical: 8,
    gap: 2,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 15,
    color: colors.text,
    paddingRight: 14,
  },
  nameCompact: {
    fontSize: 11,
    lineHeight: 13,
  },
  unit: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  prices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
  },
  compare: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discount: {
    alignSelf: 'flex-start',
    marginTop: 2,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  discountLabel: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    lineHeight: 12,
    color: colors.success,
  },
  heart: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  add: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
