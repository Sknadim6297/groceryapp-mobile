import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import type { CheckoutPaymentMethod } from '@/components/payment/checkoutPaymentMethods';
import { colors, fonts, radii, shadow } from '@/constants/theme';

type PaymentMethodSelectCardProps = {
  method: CheckoutPaymentMethod;
  selected: boolean;
  onSelect: () => void;
};

export function PaymentMethodSelectCard({ method, selected, onSelect }: PaymentMethodSelectCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${method.title}. ${method.subtitle}${method.demoBadge ? `. ${method.demoBadge}` : ''}`}
      onPress={onSelect}
      style={({ pressed }) => [styles.card, selected && styles.cardOn, pressed && styles.pressed]}>
      <View style={[styles.iconPlate, selected && styles.iconPlateOn]}>
        <AppIcon name={method.icon} color={colors.text} size={20} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{method.title}</Text>
        <Text style={styles.subtitle}>{method.subtitle}</Text>
        {method.demoBadge ? <Text style={styles.badge}>{method.demoBadge}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.soft,
  },
  cardOn: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
  },
  iconPlate: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlateOn: {
    backgroundColor: colors.primary,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  badge: {
    marginTop: 2,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.primaryInk,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioOn: {
    borderColor: colors.primaryDark,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primaryDark,
  },
  pressed: {
    opacity: 0.86,
  },
});
