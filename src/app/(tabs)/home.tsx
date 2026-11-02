import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { BrandCarousel } from '@/components/home/BrandCarousel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { DailyEssentials } from '@/components/home/DailyEssentials';
import { DeliveryHeader } from '@/components/home/DeliveryHeader';
import { ExploreMore } from '@/components/home/ExploreMore';
import { FreeCashPromoBanner } from '@/components/home/FreeCashPromoBanner';
import { FreeDeliveryBanner, FruitsBanner, MinutesBanner, SavingsBanner } from '@/components/home/HomeBanners';
import { NewUserOffers } from '@/components/home/NewUserOffers';
import { OfferRow } from '@/components/home/OfferRow';
import { PopularPicks } from '@/components/home/PopularPicks';
import { ProductSection } from '@/components/home/ProductSection';
import { StoreRow } from '@/components/home/StoreRow';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { useCustomerAccount } from '@/context/CustomerAccountContext';
import { boughtAgain, recentProducts, recommendedProducts, spotlightProducts, topSelling } from '@/data/homeFeed';
import { previewDryFruitProducts } from '@/data/previewImageCatalog';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);
  const { account } = useCustomerAccount();
  const linkedProducts = previewDryFruitProducts();

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
          {account ? (
            <Text style={styles.greeting} accessibilityRole="header">
              Hi, {account.name}
            </Text>
          ) : null}
          <FreeCashPromoBanner />
          <DailyEssentials />
          <SavingsBanner />
          <ProductSection title="Recommended for you" products={recommendedProducts} columns={2} />
          <ProductSection title="Recently viewed" products={recentProducts} columns={3} showHeart />
          <OfferRow />
          <ProductSection title="In the spotlight" products={spotlightProducts} columns={3} />
          <MinutesBanner />
          <ExploreMore />
          <PopularPicks />
          {linkedProducts.length > 0 ? (
            <ProductSection title="Dry Fruits & Cereals" products={linkedProducts} columns={3} />
          ) : null}
          <CategoryGrid />
          <StoreRow />
          <BrandCarousel />
          <FreeDeliveryBanner />
          <ProductSection title="Recently bought" subtitle="Buy again, quickly" products={boughtAgain} columns={3} icon="refresh" />
          <FruitsBanner />
          <ProductSection title="Top selling today" products={topSelling} columns={4} />
          <NewUserOffers />
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
  greeting: {
    marginHorizontal: 16,
    marginTop: 16,
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
});
