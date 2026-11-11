import { ScrollView, useWindowDimensions, View, StyleSheet } from 'react-native';

import { ProductCard } from '@/components/home/ProductCard';
import { productCardWidth, productColumns, shelfCardWidth } from '@/components/home/productLayout';
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
  onViewAll?: () => void;
};

const SECTION_PAD = 24;
const GRID_GAP = 8;

export function ProductSection({
  title,
  subtitle,
  products,
  columns,
  showHeart,
  icon,
  onViewAll,
}: ProductSectionProps) {
  const { width } = useWindowDimensions();
  const shelf = columns === 4;
  const resolved = productColumns(width, 2, SECTION_PAD, GRID_GAP);
  const cardWidth = shelf ? shelfCardWidth(width) : productCardWidth(width, resolved, SECTION_PAD, GRID_GAP);
  const compact = cardWidth < 100;

  return (
    <View style={styles.section}>
      <SectionHeader title={title} subtitle={subtitle} showHeart={showHeart} icon={icon} onViewAll={onViewAll} />
      {shelf ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.scroller}
          contentContainerStyle={styles.shelf}>
          {products.map((product) => (
            <View key={product.id} style={[styles.shelfCard, { width: cardWidth }]}>
              <ProductCard product={product} compact={compact} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.grid}>
          {products.map((product) => (
            <View key={product.id} style={{ width: cardWidth }}>
              <ProductCard product={product} compact={compact} />
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
    paddingTop: 12,
    gap: 8,
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    alignItems: 'stretch',
  },
  scroller: {
    width: '100%',
  },
  shelf: {
    gap: 10,
    paddingRight: 4,
  },
  shelfCard: {
    alignSelf: 'stretch',
  },
});
