import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BrandCarousel } from '@/components/home/BrandCarousel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { DailyEssentials } from '@/components/home/DailyEssentials';
import { DeliveryHeader } from '@/components/home/DeliveryHeader';
import { FreeCashPromoBanner } from '@/components/home/FreeCashPromoBanner';
import { ExploreMore } from '@/components/home/ExploreMore';
import {
  FreeDeliveryBanner,
  FruitsBanner,
  MinutesBanner,
  SavingsBanner,
} from '@/components/home/HomeBanners';
import { OfferRow } from '@/components/home/OfferRow';
import { PopularPicks } from '@/components/home/PopularPicks';
import { ProductSection } from '@/components/home/ProductSection';
import { SectionHeader } from '@/components/home/SectionHeader';
import { colors, homeLayout } from '@/constants/theme';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { boughtAgain, recentProducts, recommendedProducts, spotlightProducts, topSelling } from '@/data/homeFeed';
import { previewDryFruitProducts } from '@/data/previewImageCatalog';

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
          <FreeCashPromoBanner />
          <DailyEssentials />
          <SavingsBanner />
          <ProductSection
            title="Recommended for you"
            subtitle="Handpicked just for you"
            products={recommendedProducts}
            columns={2}
          />
          <ProductSection title="Recently Viewed" products={recentProducts} columns={3} showHeart />
          <OfferRow />
          <ProductSection title="In the Spotlight" products={spotlightProducts} columns={3} />
          <MinutesBanner />
          <ExploreMore />
          <PopularPicks />
          {UI_PREVIEW_MODE ? (
            <ProductSection
              title="Dry Fruits & Cereals"
              subtitle="Preview images. Prices are from the supplied list, not a live offer."
              products={previewDryFruitProducts()}
              columns={3}
            />
          ) : null}
          <View style={styles.categoryBlock}>
            {UI_PREVIEW_MODE ? null : <SectionHeader title="Shop by Category" />}
            <CategoryGrid />
          </View>
          <BrandCarousel />
          <FreeDeliveryBanner />
          <ProductSection
            title="Recently bought"
            subtitle="Buy again, quickly"
            products={boughtAgain}
            columns={3}
            icon="refresh"
          />
          <FruitsBanner />
          <ProductSection title="Top Selling Today" products={topSelling} columns={4} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.softBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: 12,
  },
  column: {
    backgroundColor: colors.softBackground,
    flexGrow: 1,
  },
  categoryBlock: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 4,
  },
});
