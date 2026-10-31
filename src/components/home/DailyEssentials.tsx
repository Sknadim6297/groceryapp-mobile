import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { SectionHeader } from '@/components/home/SectionHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { dailyEssentials } from '@/data/homeFeed';
import { previewDailyEssentialOverride } from '@/data/previewImageCatalog';

export function DailyEssentials() {
  return (
    <View style={styles.section}>
      <SectionHeader title="Daily essentials" subtitle="Everything you need, every day" />
      <View style={styles.grid}>
        {dailyEssentials.map((item) => {
          const override = UI_PREVIEW_MODE ? previewDailyEssentialOverride(item.id) : undefined;
          const name = override?.name ?? item.name;
          return (
          <View key={item.id} style={styles.cell}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={name}
            onPress={() => router.push('/shop')}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <CatalogImage
              source={override ? { uri: override.uri } : item.image}
              style={styles.image}
              label={name}
            />
            <View style={styles.footer}>
              <Text numberOfLines={2} style={styles.label}>
                {name}
              </Text>
              <View style={styles.arrow}>
                <AppIcon name="arrow" color={colors.text} size={12} />
              </View>
            </View>
          </Pressable>
          </View>
          );
        })}
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
    width: '33.333%',
    padding: 5,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    minHeight: 132,
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
    height: 84,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
