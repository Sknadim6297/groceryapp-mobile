import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { CategoryCard } from '@/components/home/CategoryCard';
import { mockCategories } from '@/data/mockCategories';

export function CategoryGrid() {
  const { width } = useWindowDimensions();
  const compact = width < 360;

  return (
    <View style={[styles.grid, compact && styles.gridCompact]}>
      {mockCategories.map((category) => (
        <View key={category.id} style={styles.cell}>
          <CategoryCard category={category} compact={compact} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  gridCompact: {
    paddingHorizontal: 8,
  },
  cell: {
    width: '25%',
    padding: 4,
  },
});
