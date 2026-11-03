import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import type { TransactionMethod } from '@/types/transactions';

type PaymentMethodGlyphProps = {
  method: TransactionMethod;
};

/** Lightweight brand-style glyphs — not official network assets. */
export function PaymentMethodGlyph({ method }: PaymentMethodGlyphProps) {
  if (method === 'mastercard') {
    return (
      <View style={styles.plate}>
        <View style={styles.mcRow}>
          <View style={[styles.mcDot, styles.mcRed]} />
          <View style={[styles.mcDot, styles.mcOrange, styles.mcOverlap]} />
        </View>
      </View>
    );
  }

  if (method === 'visa') {
    return (
      <View style={styles.plate}>
        <Text style={styles.visa}>VISA</Text>
      </View>
    );
  }

  if (method === 'upi') {
    return (
      <View style={styles.plate}>
        <Text style={styles.upi}>UPI</Text>
      </View>
    );
  }

  return (
    <View style={[styles.plate, styles.cashPlate]}>
      <AppIcon name="bag" color={colors.text} size={18} />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashPlate: {
    backgroundColor: colors.softYellow,
  },
  mcRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mcDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  mcRed: {
    backgroundColor: '#EB001B',
  },
  mcOrange: {
    backgroundColor: '#F79E1B',
  },
  mcOverlap: {
    marginLeft: -6,
  },
  visa: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.5,
    color: '#1A1F71',
  },
  upi: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: '#097939',
  },
});
