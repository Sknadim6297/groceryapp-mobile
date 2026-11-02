import { router } from 'expo-router';
import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { AppIcon } from '@/components/ui/AppIcon';
import { DiscountOff } from '@/components/ui/DiscountOff';
import { colors, fonts } from '@/constants/theme';
import { useMockCart } from '@/context/MockCartContext';
import type { DemoProduct } from '@/types/catalog';
import { formatRupee } from '@/utils/cartBill';

type ProductCardProps = {
  product: DemoProduct;
  /** Slightly tighter type when the card is under about 140px wide. */
  compact?: boolean;
};

function ProductCardComponent({ product, compact = false }: ProductCardProps) {
  const { add, quantities, setQuantity } = useMockCart();
  const quantity = quantities[product.id] ?? 0;
  const [saved, setSaved] = useState(false);
  const showMrp = product.compareAt != null && product.compareAt > product.price;

  function openProduct() {
    router.push({ pathname: '/product/[id]', params: { id: product.id } });
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.chrome}>
        <View style={styles.badgeSlot}>
          {product.discountLabel ? <DiscountOff label={product.discountLabel} inline /> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
          hitSlop={8}
          onPress={() => setSaved((current) => !current)}
          style={styles.heart}>
          <AppIcon name={saved ? 'heartFill' : 'heart'} color={saved ? colors.danger : '#CBD5E1'} size={16} />
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${product.name}`} onPress={openProduct} style={styles.details}>
        <View style={[styles.photoFrame, compact && styles.photoFrameCompact]}>
          <CatalogImage source={product.image} style={styles.photo} label={product.name} contentFit="cover" />
        </View>
        <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.name, compact && styles.nameCompact]}>
          {product.name}
        </Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.unit}>
          {product.unit}
        </Text>
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.prices}>
          <Text numberOfLines={1} style={[styles.price, compact && styles.priceCompact]}>
            {formatRupee(product.price)}
          </Text>
          {showMrp ? (
            <Text numberOfLines={1} style={styles.mrp}>
              {formatRupee(product.compareAt ?? 0)}
            </Text>
          ) : null}
        </View>
        {quantity > 0 ? (
          <View style={styles.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Decrease ${product.name}`}
              hitSlop={6}
              onPress={() => setQuantity(product.id, quantity - 1)}
              style={styles.step}>
              <AppIcon name="minus" color={colors.success} size={16} />
            </Pressable>
            <Text style={styles.count}>{quantity}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Increase ${product.name}`}
              hitSlop={6}
              onPress={() => setQuantity(product.id, quantity + 1)}
              style={styles.step}>
              <AppIcon name="plus" color={colors.success} size={16} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to the basket`}
            onPress={() => add(product.id)}
            style={({ pressed }) => [styles.add, pressed && styles.pressed]}
            testID={`product-add-${product.id}`}>
            <Text style={styles.addLabel}>ADD</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export const ProductCard = memo(ProductCardComponent);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  cardCompact: {
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  chrome: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badgeSlot: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  heart: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  details: {
    minWidth: 0,
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 1.22,
    borderRadius: 10,
    backgroundColor: '#F6F7F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoFrameCompact: {
    aspectRatio: 1.22,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  name: {
    marginTop: 6,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 15,
    color: colors.text,
    includeFontPadding: false,
  },
  nameCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  unit: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 4,
    gap: 4,
  },
  prices: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    minWidth: 0,
  },
  price: {
    flexShrink: 0,
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 18,
    color: colors.success,
  },
  priceCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  mrp: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  add: {
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.success,
    letterSpacing: 0.4,
  },
  stepper: {
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: {
    flex: 1,
    height: 28,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    minWidth: 18,
    flexShrink: 0,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.success,
  },
  pressed: {
    opacity: 0.75,
  },
});
