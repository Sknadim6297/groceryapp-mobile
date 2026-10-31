import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductCard } from '@/components/home/ProductCard';
import { PreviewScaffold } from '@/components/preview/PreviewScaffold';
import { colors, fonts } from '@/constants/theme';
import { listBuyAgainProducts } from '@/data/listCatalogProducts';

export default function BuyAgainScreen() {
  const products = listBuyAgainProducts();

  return (
    <PreviewScaffold title="Buy again" subtitle="Demo list on this device. Not an order history.">
      <Text style={styles.note}>These are the same preview products as Recently bought. Adding one updates the demo cart.</Text>
      <View style={styles.grid}>
        {products.map((product) => (
          <Pressable
            key={product.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${product.name}`}
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
            style={styles.cell}>
            <ProductCard product={product} compact tile />
          </Pressable>
        ))}
      </View>
    </PreviewScaffold>
  );
}

const styles = StyleSheet.create({
  note: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '48%',
  },
});
