import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { useMockCart } from '@/context/MockCartContext';
import type { DemoProduct } from '@/types/catalog';

type ProductCardProps = {
  product: DemoProduct;
  compact: boolean;
  tile?: boolean;
};

export function ProductCard({ product, compact, tile = false }: ProductCardProps) {
  const { add } = useMockCart();
  const [saved, setSaved] = useState(false);

  if (tile) {
    return (
      <View style={[styles.tile, compact && styles.tileCompact]}>
        <CatalogImage source={product.image} style={[styles.tileImage, compact && styles.tileImageCompact]} label={product.name} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
          hitSlop={6}
          onPress={() => setSaved((current) => !current)}
          style={styles.tileHeart}>
          <AppIcon name={saved ? 'heartFill' : 'heart'} color={saved ? colors.danger : '#CBD5E1'} size={14} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${product.name}`} onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}>
          <Text numberOfLines={2} style={[styles.tileName, compact && styles.tileNameCompact]}>
            {product.name}
          </Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.tileUnit}>
          {product.unit}
        </Text>
        <View style={styles.tilePrices}>
          <Text style={styles.tilePrice}>₹{product.price}</Text>
          {product.compareAt ? <Text style={styles.tileCompare}>₹{product.compareAt}</Text> : null}
        </View>
        <View style={styles.tileFoot}>
          {product.discountLabel ? (
            <View style={styles.tileDiscount}>
              <Text style={styles.discountLabel}>{product.discountLabel}</Text>
            </View>
          ) : (
            <View />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to the demo cart`}
            onPress={() => add(product.id)}
            style={({ pressed }) => [styles.tileAdd, pressed && styles.pressed]}>
            <AppIcon name="plus" color={colors.text} size={14} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <CatalogImage source={product.image} style={styles.image} label={product.name} />
      <View style={styles.copy}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open ${product.name}`} onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}>
          <Text numberOfLines={2} style={[styles.name, compact && styles.nameCompact]}>
            {product.name}
          </Text>
        </Pressable>
        <Text style={styles.unit}>{product.unit}</Text>
        <View style={styles.prices}>
          <Text style={styles.price}>₹{product.price}</Text>
          {product.compareAt ? <Text style={styles.compare}>₹{product.compareAt}</Text> : null}
        </View>
        {product.discountLabel ? (
          <View style={styles.discount}>
            <Text style={styles.discountLabel}>{product.discountLabel}</Text>
          </View>
        ) : null}
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
  tile: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    shadowColor: '#171717',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tileCompact: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 16,
  },
  tileImage: {
    width: '100%',
    height: 104,
    backgroundColor: 'transparent',
  },
  tileImageCompact: {
    height: 76,
  },
  tileNameCompact: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 15,
  },
  tileHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  tileName: {
    marginTop: 8,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  tileUnit: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  tileFoot: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tilePrices: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tilePrice: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
  },
  tileCompare: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  tileAdd: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileDiscount: {
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
});
