import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { SectionHeader } from '@/components/home/SectionHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { dailyEssentials } from '@/data/homeFeed';
import { previewDailyEssentialOverride } from '@/data/previewImageCatalog';
import type { DailyEssentialTile } from '@/utils/liveCatalogMeta';

type DailyEssentialsProps = {
  /** When set (live catalogue), only these tiles are shown — derived from product Category. */
  items?: DailyEssentialTile[];
};

export function DailyEssentials({ items }: DailyEssentialsProps) {
  const { width } = useWindowDimensions();
  const columns = width < 390 ? 2 : 3;
  const live = items != null;
  const tiles = live
    ? items
    : dailyEssentials.map((item) => {
        const override = previewDailyEssentialOverride(item.id);
        return {
          id: item.id,
          name: override?.name ?? item.name,
          image: override ? { uri: override.uri } : item.image,
          categoryId: undefined as string | undefined,
        };
      });

  if (tiles.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Daily essentials"
        subtitle={live ? 'From this store’s catalogue' : 'Everything you need, every day'}
      />
      <View style={styles.grid}>
        {tiles.map((item) => (
          <View key={item.id} style={[styles.cell, { width: `${100 / columns}%` }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.name}
              onPress={() =>
                router.push({
                  pathname: '/shop',
                  params: item.categoryId ? { category: item.categoryId } : undefined,
                })
              }
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <CatalogImage source={item.image} style={styles.image} label={item.name} />
              <View style={styles.footer}>
                <Text numberOfLines={2} style={styles.label}>
                  {item.name}
                </Text>
                <View style={styles.arrow}>
                  <AppIcon name="arrow" color={colors.text} size={16} />
                </View>
              </View>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    padding: 5,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    minHeight: 0,
    shadowColor: '#171717',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  image: {
    width: '100%',
    aspectRatio: 1.15,
    backgroundColor: 'transparent',
  },
  footer: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 15,
    color: colors.text,
  },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
