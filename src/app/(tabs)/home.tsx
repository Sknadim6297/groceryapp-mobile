import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BrandCarousel } from '@/components/home/BrandCarousel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { DeliveryHeader } from '@/components/home/DeliveryHeader';
import { PopularPicks } from '@/components/home/PopularPicks';
import { PromotionalBanner } from '@/components/home/PromotionalBanner';
import { colors, homeLayout } from '@/constants/theme';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.column, { width: contentWidth }]}>
          <DeliveryHeader />
          <CategoryGrid />
          <PromotionalBanner />
          <BrandCarousel />
          <PopularPicks />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
  },
  column: {
    backgroundColor: colors.background,
    flexGrow: 1,
  },
});
