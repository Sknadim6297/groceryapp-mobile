import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { SectionHeader } from '@/components/home/SectionHeader';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { previewStoreCards } from '@/data/previewImageCatalog';

const stores: { id: string; name: string; detail: string; eta: string; icon: AppIconName; tint: string }[] = [
  { id: 'city', name: 'CityBasket', detail: 'Wide Range', eta: '10 Mins', icon: 'shop', tint: '#FFEDD5' },
  { id: 'green', name: 'GreenLeaf', detail: 'Fresh & Organic', eta: '15 Mins', icon: 'leaf', tint: '#DCFCE7' },
  { id: 'value', name: 'ValueMart', detail: 'Everyday Low Price', eta: '20 Mins', icon: 'cart', tint: '#E0F2FE' },
  { id: 'more', name: 'More Stores', detail: 'Near You', eta: '', icon: 'stores', tint: '#FFEDD5' },
];

export function StoreRow() {
  const previewStores = UI_PREVIEW_MODE ? previewStoreCards() : [];

  return (
    <View style={styles.section}>
      <SectionHeader title={previewStores.length > 0 ? 'Featured Stores' : 'Shop by Store'} />
      {previewStores.length > 0 ? (
        <View style={styles.row}>
          {previewStores.map((store) => (
            <Pressable
              key={store.id}
              accessibilityRole="button"
              accessibilityLabel={`${store.name}. Preview store image. Not a live supplier.`}
              onPress={() => router.push('/stores')}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <CatalogImage source={{ uri: store.url }} style={styles.photo} label={store.name} />
              <Text numberOfLines={2} style={styles.name}>
                {store.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
      <View style={styles.row}>
        {stores.map((store) => (
          <Pressable
            key={store.id}
            accessibilityRole="button"
            accessibilityLabel={`${store.name}. Demo store. ${store.eta || store.detail} is not a confirmed delivery time.`}
            onPress={() => router.push('/stores')}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={[styles.icon, { backgroundColor: store.tint }]}>
              <AppIcon name={store.icon} color={colors.text} size={18} />
            </View>
            <Text numberOfLines={1} style={styles.name}>
              {store.name}
            </Text>
            <Text numberOfLines={2} style={styles.detail}>
              {store.detail}
            </Text>
            {store.eta ? (
              <View style={styles.eta}>
                <AppIcon name="bolt" color={colors.success} size={10} />
                <Text style={styles.etaLabel}>{store.eta}</Text>
              </View>
            ) : (
              <AppIcon name="chevron" color={colors.textSecondary} size={14} />
            )}
          </Pressable>
        ))}
      </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 6,
    shadowColor: '#171717',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: 64,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text,
    textAlign: 'center',
  },
  detail: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  eta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  etaLabel: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    lineHeight: 12,
    color: colors.success,
  },
});
