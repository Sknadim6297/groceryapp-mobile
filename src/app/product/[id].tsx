import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { PreviewScaffold } from '@/components/preview/PreviewScaffold';
import { AppIcon } from '@/components/ui/AppIcon';
import { LIVE_CATALOGUE_CONNECTED } from '@/constants/liveData';
import { colors, fonts } from '@/constants/theme';
import { useMockCart } from '@/context/MockCartContext';
import { findDemoProduct } from '@/data/findDemoProduct';
import { formatRupee } from '@/utils/cartBill';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const productId = Array.isArray(id) ? id[0] : id;
  const product = productId ? findDemoProduct(productId) : undefined;
  const { add, quantities, setQuantity } = useMockCart();
  const [notice, setNotice] = useState<string | null>(null);
  const quantity = product ? (quantities[product.id] ?? 0) : 0;

  if (!product) {
    return (
      <PreviewScaffold title="Product" subtitle="Preview catalogue">
        <Text style={styles.missing}>This item is not in the demo catalogue.</Text>
      </PreviewScaffold>
    );
  }

  return (
    <PreviewScaffold title="Product details" subtitle="Preview item. Not a live product page.">
      <View style={styles.card}>
        <CatalogImage source={product.image} style={styles.image} label={product.name} />
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>
        <View style={styles.prices}>
          <Text style={styles.price}>{formatRupee(product.price)}</Text>
          {product.compareAt ? <Text style={styles.compare}>{formatRupee(product.compareAt)}</Text> : null}
        </View>
        {product.discountLabel ? <Text style={styles.discount}>{product.discountLabel} · demo label</Text> : null}
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${product.name}`}
            onPress={() => setQuantity(product.id, quantity - 1)}
            style={styles.step}>
            <AppIcon name="minus" color={colors.text} size={16} />
          </Pressable>
          <Text style={styles.count}>{quantity}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Increase ${product.name}`}
            onPress={() => (quantity === 0 ? add(product.id) : setQuantity(product.id, quantity + 1))}
            style={styles.step}>
            <AppIcon name="plus" color={colors.text} size={16} />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${product.name} to the demo cart`}
          onPress={() => {
            add(product.id);
            setNotice('Added to the preview cart.');
          }}
          style={styles.add}>
          <Text style={styles.addLabel}>Add to cart</Text>
        </Pressable>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Go to cart" onPress={() => router.push('/cart')}>
          <Text style={styles.link}>Review cart</Text>
        </Pressable>
      </View>
    </PreviewScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  image: {
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.softBackground,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  unit: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  prices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  compare: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discount: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  stepper: {
    alignSelf: 'flex-start',
    marginTop: 4,
    minWidth: 112,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  step: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  add: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  notice: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryInk,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  missing: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
});
