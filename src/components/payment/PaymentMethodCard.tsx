import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import type { PaymentMethodId } from '@/types/paymentPreferences';

type PaymentMethodCardProps = {
  id: PaymentMethodId;
  title: string;
  subtitle: string;
  icon: AppIconName;
  primary: boolean;
  onSelectPrimary: () => void;
  onOpenDetails: () => void;
};

export function PaymentMethodCard({
  title,
  subtitle,
  icon,
  primary,
  onSelectPrimary,
  onOpenDetails,
}: PaymentMethodCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: primary }}
        accessibilityLabel={`Set ${title} as primary`}
        onPress={onSelectPrimary}
        style={({ pressed }) => [styles.primaryRow, pressed && styles.pressed]}>
        <Text style={[styles.primaryLabel, primary && styles.primaryLabelOn]}>Set as Primary</Text>
        <View style={[styles.radio, primary && styles.radioOn]}>
          {primary ? <View style={styles.radioDot} /> : null}
        </View>
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}
        onPress={onOpenDetails}
        style={({ pressed }) => [styles.methodRow, pressed && styles.pressed]}>
        <View style={[styles.iconPlate, primary && styles.iconPlateOn]}>
          <AppIcon name={icon} color={colors.text} size={18} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
        <AppIcon name="chevron" color={colors.textSecondary} size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    overflow: 'hidden',
  },
  primaryRow: {
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  primaryLabelOn: {
    fontFamily: fonts.semibold,
    color: colors.primaryInk,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: colors.primaryDark,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 14,
  },
  methodRow: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconPlate: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlateOn: {
    backgroundColor: colors.softYellow,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.82,
  },
});
