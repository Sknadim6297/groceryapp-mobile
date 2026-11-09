import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { BrandCarousel } from '@/components/home/BrandCarousel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { DailyEssentials } from '@/components/home/DailyEssentials';
import { DeliveryHeader } from '@/components/home/DeliveryHeader';
import { ExploreMore } from '@/components/home/ExploreMore';
import { FreeCashPromoBanner } from '@/components/home/FreeCashPromoBanner';
import { HomePromoCarousel } from '@/components/home/HomePromoCarousel';
import { NewUserOffers } from '@/components/home/NewUserOffers';
import { OfferRow } from '@/components/home/OfferRow';
import { PopularPicks } from '@/components/home/PopularPicks';
import { ProductSection } from '@/components/home/ProductSection';
import { StoreRow } from '@/components/home/StoreRow';
import { CatalogStatusPanel } from '@/components/ui/CatalogStatusPanel';
import { HomeCatalogSkeleton } from '@/components/ui/LoadingSkeleton';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { contentColumnWidth } from '@/utils/contentWidth';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useCatalog } from '@/context/CatalogContext';
import { useCustomerAccount } from '@/context/CustomerAccountContext';
import { useRememberedCustomer } from '@/context/RememberedCustomerContext';
import {
  boughtAgain,
  recentProducts,
  recommendedProducts,
  spotlightProducts,
  topSelling,
} from '@/data/homeFeed';
import { mockProducts } from '@/data/mockProducts';
import { previewDryFruitProducts } from '@/data/previewImageCatalog';
import { isDevOtpEnabled } from '@/services/devOtp';
import { activeLoginForDisplay, displayCustomer } from '@/services/rememberedCustomer';
import type { DemoProduct } from '@/types/catalog';
import { buildHomeCatalogueSections } from '@/utils/homeCatalogueSections';
import {
  deriveDailyEssentials,
  deriveLiveBrands,
  deriveLiveCategories,
  deriveLiveCategoryTree,
} from '@/utils/liveCatalogMeta';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = contentColumnWidth(width);
  const { session, devSession } = useAuthSession();
  const { account } = useCustomerAccount();
  const { customer: remembered } = useRememberedCustomer();
  const { liveEnabled, initialLoading, refreshing, state, products, message, refresh } = useCatalog();
  const [retrying, setRetrying] = useState(false);
  const identity = displayCustomer(
    activeLoginForDisplay(session, devSession, isDevOtpEnabled()),
    account,
    remembered,
  );

  async function handleRetry() {
    if (retrying) {
      return;
    }
    setRetrying(true);
    try {
      await refresh();
    } finally {
      setRetrying(false);
    }
  }
  /**
   * Demo marketing chrome (promos, stores, offers) when UI preview is on.
   * Live catalogue only when PRODUCTS_COMPANY is set (currently off → full dummy frontend).
   */
  const showDemoChrome = UI_PREVIEW_MODE;

  const demoDryFruits = useMemo(() => previewDryFruitProducts(), []);
  const liveSections = useMemo(() => buildHomeCatalogueSections(products), [products]);
  const liveCategories = useMemo(
    () => (liveEnabled ? deriveLiveCategories(products) : null),
    [liveEnabled, products],
  );
  const liveCategoryTree = useMemo(
    () => (liveEnabled ? deriveLiveCategoryTree(products) : null),
    [liveEnabled, products],
  );
  const liveBrands = useMemo(() => (liveEnabled ? deriveLiveBrands(products) : null), [liveEnabled, products]);
  const liveDailyEssentials = useMemo(
    () => (liveEnabled ? deriveDailyEssentials(products) : null),
    [liveEnabled, products],
  );

  // Dummy/local catalogue when live is off. Live rails only when PRODUCTS_COMPANY is set.
  const productRails = liveEnabled
    ? {
        recommended: liveSections.recommended.length > 0 ? liveSections.recommended : recommendedProducts,
        recent: [] as DemoProduct[],
        spotlight: liveSections.spotlight.length > 0 ? liveSections.spotlight : spotlightProducts,
        popular: liveSections.popular.length > 0 ? liveSections.popular : mockProducts,
        dryFruits: liveSections.dryFruits.length > 0 ? liveSections.dryFruits : demoDryFruits,
        boughtAgain: showDemoChrome ? boughtAgain : ([] as DemoProduct[]),
        topSelling: liveSections.topSelling.length > 0 ? liveSections.topSelling : topSelling,
      }
    : {
        recommended: recommendedProducts,
        recent: recentProducts,
        spotlight: spotlightProducts,
        popular: mockProducts,
        dryFruits: demoDryFruits,
        boughtAgain,
        topSelling,
      };

  if (liveEnabled && initialLoading) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <DeliveryHeader />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.column, { width: contentWidth }]}>
            <HomeCatalogSkeleton />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (liveEnabled && state.status === 'error' && products.length === 0) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <DeliveryHeader />
        <CatalogStatusPanel
          kind="error"
          message={message}
          onRetry={() => void handleRetry()}
          retrying={retrying}
        />
      </View>
    );
  }

  if (liveEnabled && products.length === 0) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <DeliveryHeader />
        <CatalogStatusPanel
          kind="empty"
          title="No products yet"
          message="No products are available for this store yet."
          onRetry={() => void handleRetry()}
          retrying={retrying}
        />
      </View>
    );
  }

  const greetingName = identity?.name?.trim() ?? '';

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        refreshControl={
          liveEnabled ? (
            <RefreshControl refreshing={refreshing || retrying} onRefresh={() => void handleRetry()} tintColor={colors.primaryInk} />
          ) : undefined
        }>
        <View style={[styles.column, { width: contentWidth }]}>
          <DeliveryHeader />
          {greetingName ? (
            <Text style={styles.greeting} accessibilityRole="header">
              Hi, {greetingName}
            </Text>
          ) : null}
          {showDemoChrome ? <FreeCashPromoBanner /> : null}
          <DailyEssentials items={liveDailyEssentials ?? undefined} />
          {showDemoChrome ? <HomePromoCarousel /> : null}
          {productRails.recommended.length > 0 ? (
            <ProductSection title="Recommended for you" products={productRails.recommended} columns={2} />
          ) : null}
          {productRails.recent.length > 0 ? (
            <ProductSection title="Recently viewed" products={productRails.recent} columns={2} showHeart />
          ) : null}
          {showDemoChrome ? <OfferRow /> : null}
          {productRails.spotlight.length > 0 ? (
            <ProductSection title="In the spotlight" products={productRails.spotlight} columns={2} />
          ) : null}
          {showDemoChrome ? <ExploreMore /> : null}
          <PopularPicks products={productRails.popular} />
          {productRails.dryFruits.length > 0 ? (
            <ProductSection title="Dry Fruits & Cereals" products={productRails.dryFruits} columns={2} />
          ) : null}
          <CategoryGrid
            categories={liveCategories ?? undefined}
            categoryTree={liveCategoryTree ?? undefined}
          />
          {showDemoChrome ? <StoreRow /> : null}
          <BrandCarousel brands={liveBrands ?? undefined} />
          {productRails.boughtAgain.length > 0 ? (
            <ProductSection
              title="Recently bought"
              subtitle="Buy again, quickly"
              products={productRails.boughtAgain}
              columns={2}
              icon="refresh"
            />
          ) : null}
          {productRails.topSelling.length > 0 ? (
            <ProductSection title="Top selling today" products={productRails.topSelling} columns={4} />
          ) : null}
          {showDemoChrome ? <NewUserOffers /> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
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
    backgroundColor: colors.warmBackground,
    flexGrow: 1,
    maxWidth: homeLayout.maxWidth,
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
