import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogImage } from '@/components/home/CatalogImage';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { DEMO_STORES } from '@/data/demoStores';

export default function StoresScreen() {
  const insets = useSafeAreaInsets();

  if (!UI_PREVIEW_MODE) {
    return (
      <PlaceholderScreen
        title="Stores"
        message="This is a placeholder. Store selection is not available yet."
      />
    );
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Stores" showBack={false} />
      <FlatList
        data={DEMO_STORES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.hero}>Nearby stores</Text>
            <DemoBanner message="Demo store list — distances and hours are fictional." />
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.name}
            onPress={() => router.push({ pathname: '/store/[id]', params: { id: item.id } })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <CatalogImage source={item.image} style={styles.image} contentFit="cover" />
            <View style={styles.copy}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.meta}>{item.area}</Text>
              <Text style={styles.meta}>
                {item.distanceLabel} · ★ {item.ratingLabel}
              </Text>
              <Text style={styles.meta}>{item.openLabel}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.softBackground },
  content: {
    padding: homeLayout.gutter,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: { gap: 10, marginBottom: 12 },
  hero: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  gap: { height: 12 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  image: { width: 96, height: 96 },
  copy: { flex: 1, paddingVertical: 12, paddingRight: 12, gap: 2 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  pressed: { opacity: 0.85 },
});
