import { Redirect, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogImage } from '@/components/home/CatalogImage';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { findDemoStore } from '@/data/demoStores';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function StoreDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const storeId = firstParam(id) ?? '';
  const store = findDemoStore(storeId);

  if (!UI_PREVIEW_MODE) {
    return <Redirect href="/stores" />;
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Store details" fallbackHref="/stores" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <DemoBanner message="Demo store profile — hours and stock are fictional." />
        {!store ? (
          <Text style={styles.body}>This demo store was not found.</Text>
        ) : (
          <View style={styles.card}>
            <CatalogImage source={store.image} style={styles.hero} contentFit="cover" />
            <Text style={styles.title}>{store.name}</Text>
            <Text style={styles.meta}>{store.area}</Text>
            <Text style={styles.meta}>
              {store.distanceLabel} · ★ {store.ratingLabel}
            </Text>
            <Text style={styles.meta}>{store.openLabel}</Text>
            <Text style={styles.body}>{store.detail}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.softBackground },
  content: {
    padding: homeLayout.gutter,
    gap: 12,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  hero: { width: '100%', height: 180 },
  title: {
    marginTop: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  meta: {
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
});
