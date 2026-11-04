import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { colors, fonts, radii } from '@/constants/theme';

const BADGES: { icon: AppIconName; label: string }[] = [
  { icon: 'clock', label: '72 hours\nReplacement' },
  { icon: 'truck', label: 'Fast\nDelivery' },
  { icon: 'headset', label: '24/7\nSupport' },
];

export function ProductTrustBadges() {
  return (
    <View style={styles.row}>
      {BADGES.map((badge) => (
        <View key={badge.label} style={styles.badge}>
          <AppIcon name={badge.icon} color={colors.primaryInk} size={18} />
          <Text style={styles.label}>{badge.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flex: 1,
    minHeight: 72,
    borderRadius: radii.sm,
    backgroundColor: colors.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    gap: 6,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text,
    textAlign: 'center',
  },
});
