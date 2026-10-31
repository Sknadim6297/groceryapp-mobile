import { ScrollView, useWindowDimensions, View, StyleSheet } from 'react-native';

import { ProductCard } from '@/components/home/ProductCard';
import { SectionHeader } from '@/components/home/SectionHeader';
import type { SoftIconName } from '@/components/ui/SoftIcon';
import type { DemoProduct } from '@/types/catalog';

type ProductSectionProps = {
  title: string;
  subtitle?: string;
  products: DemoProduct[];
  columns: 2 | 3 | 4;
  showHeart?: boolean;
  icon?: SoftIconName;
};

export function ProductSection({ title, subtitle, products, columns, showHeart, icon }: ProductSectionProps) {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const shelf = columns === 4;
  const stacked = columns === 3;
  const resolvedColumns = shelf ? 2 : columns;
  const tileWidth = Math.max(156, Math.min(176, (Math.min(width, 480) - 44) / 2.15));

  return (
    <View style={styles.section}>
      <SectionHeader title={title} subtitle={subtitle} showHeart={showHeart} icon={icon} />
      {shelf ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shelf}>
          {products.map((product) => (
            <View key={product.id} style={{ width: tileWidth }}>
              <ProductCard product={product} compact={compact} tile />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.grid}>
          {products.map((product) => (
            <View key={product.id} style={{ width: `${100 / resolvedColumns}%`, padding: 4 }}>
              <ProductCard product={product} compact={compact || stacked} tile={stacked} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 12,
    paddingTop: 18,
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  shelf: {
    gap: 10,
    paddingRight: 4,
  },
});
