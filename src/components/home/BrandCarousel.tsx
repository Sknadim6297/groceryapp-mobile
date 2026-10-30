import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { mockBrands } from '@/data/mockBrands';

export function BrandCarousel() {
  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text accessibilityRole="header" style={styles.heading}>
          Shop by Brands
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all brands"
          hitSlop={8}
          onPress={() => router.push('/shop')}
          style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}>
          <Text style={styles.viewAllLabel}>View all</Text>
          <AppIcon name="chevron" color={colors.textSecondary} size={14} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {mockBrands.map((brand) => (
          <Pressable
            key={brand.id}
            accessibilityRole="button"
            accessibilityLabel={`${brand.name}. Demo brand, not a live supplier.`}
            onPress={() => router.push({ pathname: '/shop', params: { brand: brand.id } })}
            style={({ pressed }) => [styles.brand, pressed && styles.pressed]}>
            <Image source={brand.image} style={styles.mark} contentFit="cover" accessible={false} />
            <Text numberOfLines={1} style={styles.name}>
              {brand.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 14,
    paddingBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  viewAllLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.75,
  },
  row: {
    paddingHorizontal: 8,
    gap: 2,
  },
  brand: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.softBackground,
  },
  name: {
    width: '100%',
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13,
    color: colors.text,
    textAlign: 'center',
  },
});
