import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SoftIcon, type SoftIconName } from '@/components/ui/SoftIcon';
import { colors, fonts } from '@/constants/theme';

const items: { id: string; label: string; icon: SoftIconName; tint: string }[] = [
  { id: 'coupons', label: 'Coupons & Offers', icon: 'coupon', tint: '#FEE2E2' },
  { id: 'membership', label: 'Membership & Savings', icon: 'crown', tint: '#FEF3C7' },
  { id: 'subscribe', label: 'Subscribe & Save', icon: 'calendar', tint: '#E0F2FE' },
  { id: 'wishlist', label: 'My Wishlist', icon: 'heart', tint: '#FCE7F3' },
  { id: 'bulk', label: 'Bulk Order', icon: 'box', tint: '#FFEDD5' },
];

export function ExploreMore() {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>
        Explore More
      </Text>
      <View style={styles.row}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => router.push('/shop')}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            <View style={[styles.icon, { backgroundColor: item.tint }]}>
              <SoftIcon name={item.icon} size={28} />
            </View>
            <Text numberOfLines={2} style={styles.label}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 12,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.75,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13,
    color: colors.text,
    textAlign: 'center',
  },
});
