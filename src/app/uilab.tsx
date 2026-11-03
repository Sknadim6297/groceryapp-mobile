/**
 * Dev / UI_PREVIEW-only visual lab. Does not sign the user in or bypass auth for other routes.
 */
import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryCard } from '@/components/home/CategoryCard';
import { ProductCard } from '@/components/home/ProductCard';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton, ProductCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, space } from '@/constants/theme';
import { recommendedProducts } from '@/data/homeFeed';
import { mockCategories } from '@/data/mockCategories';
import { contentColumnWidth } from '@/utils/contentWidth';

export default function UiLabScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const allowed = __DEV__ || UI_PREVIEW_MODE;

  if (!allowed) {
    return <Redirect href="/login" />;
  }

  const contentWidth = contentColumnWidth(width);
  const product = recommendedProducts[0];
  const category = mockCategories[0];

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="UI Preview Lab" fallbackHref="/login" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, 24),
            maxWidth: contentWidth,
            width: '100%',
            alignSelf: 'center',
            alignItems: 'stretch',
          },
        ]}>
        <Text style={styles.section}>Buttons</Text>
        <PrimaryButton label="Primary action" onPress={() => undefined} showArrow={false} />
        <SecondaryButton label="Secondary action" onPress={() => undefined} />

        <Text style={styles.section}>Product card</Text>
        {product ? (
          <View style={styles.cardSlot}>
            <ProductCard product={product} />
          </View>
        ) : null}

        <Text style={styles.section}>Category card</Text>
        {category ? (
          <View style={styles.catSlot}>
            <CategoryCard category={category} compact={false} />
          </View>
        ) : null}

        <Text style={styles.section}>Skeleton</Text>
        <View style={styles.row}>
          <ProductCardSkeleton />
          <LoadingSkeleton height={48} />
        </View>

        <Text style={styles.section}>Empty state</Text>
        <EmptyState title="Nothing here yet" body="Shared empty pattern for addresses, wishlist and search." />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    gap: space.md,
    width: '100%',
  },
  section: {
    marginTop: space.sm,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    width: '100%',
  },
  cardSlot: {
    width: 180,
    maxWidth: '100%',
  },
  catSlot: {
    width: 120,
    maxWidth: '100%',
  },
  row: {
    gap: space.sm,
    width: '100%',
  },
});
