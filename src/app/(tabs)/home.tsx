import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";

import { DeliveryHeader } from "@/components/home/DeliveryHeader";
import { HomePromoCarousel } from "@/components/home/HomePromoCarousel";
import { PopularPicks } from "@/components/home/PopularPicks";
import { ProductSection } from "@/components/home/ProductSection";
import { CatalogSoftErrorBanner } from "@/components/ui/CatalogSoftErrorBanner";
import { CatalogStatusPanel } from "@/components/ui/CatalogStatusPanel";
import { HomeCatalogSkeleton } from "@/components/ui/LoadingSkeleton";
import { UI_PREVIEW_MODE } from "@/constants/preview";
import { colors, homeLayout } from "@/constants/theme";
import { useCatalog } from "@/context/CatalogContext";
import { HomeCatalogBrowseProvider } from "@/context/HomeCatalogBrowseContext";
import {
    recommendedProducts,
    spotlightProducts,
    topSelling,
} from "@/data/homeFeed";
import { mockProducts } from "@/data/mockProducts";
import { contentColumnWidth } from "@/utils/contentWidth";
import { buildHomeCatalogueSections } from "@/utils/homeCatalogueSections";

export default function HomeScreen() {
  return (
    <HomeCatalogBrowseProvider>
      <HomeScreenBody />
    </HomeCatalogBrowseProvider>
  );
}

function HomeScreenBody() {
  const { width } = useWindowDimensions();
  const contentWidth = contentColumnWidth(width);
  const {
    liveEnabled,
    initialLoading,
    refreshing,
    state,
    products,
    message,
    refresh,
  } = useCatalog();
  const [retrying, setRetrying] = useState(false);

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

  const showDemoChrome = UI_PREVIEW_MODE;
  const liveSections = useMemo(
    () => buildHomeCatalogueSections(products),
    [products],
  );

  // Distinct product rails only — category browse lives in the header.
  const productRails = liveEnabled
    ? {
        recommended:
          liveSections.recommended.length > 0
            ? liveSections.recommended
            : recommendedProducts,
        spotlight:
          liveSections.spotlight.length > 0
            ? liveSections.spotlight
            : spotlightProducts,
        popular:
          liveSections.popular.length > 0 ? liveSections.popular : mockProducts,
        topSelling:
          liveSections.topSelling.length > 0
            ? liveSections.topSelling
            : topSelling,
      }
    : {
        recommended: recommendedProducts,
        spotlight: spotlightProducts,
        popular: mockProducts,
        topSelling,
      };

  if (liveEnabled && initialLoading) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <DeliveryHeader />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.column, { width: contentWidth }]}>
            <HomeCatalogSkeleton />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (liveEnabled && state.status === "error" && products.length === 0) {
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
            <RefreshControl
              refreshing={refreshing || retrying}
              onRefresh={() => void handleRetry()}
              tintColor={colors.primaryInk}
            />
          ) : undefined
        }
      >
        <View style={[styles.column, { width: contentWidth }]}>
          <DeliveryHeader />
          {liveEnabled && message && products.length > 0 ? (
            <CatalogSoftErrorBanner
              message={message}
              onRetry={() => void handleRetry()}
              retrying={retrying || refreshing}
            />
          ) : null}
          {showDemoChrome ? <HomePromoCarousel /> : null}
          {productRails.recommended.length > 0 ? (
            <ProductSection
              title="Recommended for you"
              products={productRails.recommended.slice(0, 6)}
              columns={2}
            />
          ) : null}
          {productRails.spotlight.length > 0 ? (
            <ProductSection
              title="In the spotlight"
              products={productRails.spotlight.slice(0, 6)}
              columns={2}
            />
          ) : null}
          <PopularPicks products={productRails.popular.slice(0, 8)} />
          {productRails.topSelling.length > 0 ? (
            <ProductSection
              title="Top selling today"
              products={productRails.topSelling.slice(0, 8)}
              columns={2}
            />
          ) : null}
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
    alignItems: "center",
    flexGrow: 1,
    paddingBottom: 8,
  },
  column: {
    backgroundColor: colors.warmBackground,
    flexGrow: 1,
    maxWidth: homeLayout.maxWidth,
  },
});
