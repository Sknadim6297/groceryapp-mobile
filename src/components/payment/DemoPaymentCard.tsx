import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';

import { DEMO_PAYMENT_CARD } from '@/data/demoPaymentCard';
import { colors, fonts } from '@/constants/theme';

const groceryBag = require('@/assets/images/home/cutouts/produce-offer.webp') as number;

type DemoPaymentCardProps = {
  hidden?: boolean;
};

export function DemoPaymentCard({ hidden = false }: DemoPaymentCardProps) {
  if (hidden) {
    return (
      <View style={styles.hiddenCard}>
        <Text style={styles.hiddenTitle}>Demo card hidden</Text>
        <Text style={styles.hiddenBody}>Use the menu to show the preview card again.</Text>
      </View>
    );
  }

  return (
    <View style={styles.shell} accessibilityLabel="Demo payment card preview">
      <LinearGradient colors={['#171717', '#1F2937', colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>{DEMO_PAYMENT_CARD.brandLabel}</Text>
            <Text style={styles.brandSub}>{DEMO_PAYMENT_CARD.brandSubLabel}</Text>
          </View>
          <Text style={styles.network}>{DEMO_PAYMENT_CARD.networkLabel}</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{DEMO_PAYMENT_CARD.badge}</Text>
        </View>

        <Text style={styles.number}>{DEMO_PAYMENT_CARD.maskedNumber}</Text>

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.caption}>CARDHOLDER</Text>
            <Text style={styles.holder}>{DEMO_PAYMENT_CARD.holderLabel}</Text>
          </View>
          <View style={styles.expiryBlock}>
            <Text style={styles.caption}>EXPIRES</Text>
            <Text style={styles.holder}>{DEMO_PAYMENT_CARD.expiryLabel}</Text>
          </View>
        </View>

        <Image source={groceryBag} style={styles.illustration} resizeMode="contain" accessibilityIgnoresInvertColors />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  card: {
    minHeight: 190,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  brandBlock: {
    flex: 1,
    gap: 2,
  },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 18,
    color: colors.white,
  },
  brandSub: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.82)',
  },
  network: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
    letterSpacing: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.text,
  },
  number: {
    marginTop: 18,
    fontFamily: fonts.semibold,
    fontSize: 20,
    letterSpacing: 1.4,
    color: colors.white,
  },
  bottomRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  expiryBlock: {
    alignItems: 'flex-end',
    marginRight: 72,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 9,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  holder: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  illustration: {
    position: 'absolute',
    right: -4,
    bottom: -8,
    width: 110,
    height: 110,
    opacity: 0.95,
  },
  hiddenCard: {
    minHeight: 120,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 6,
  },
  hiddenTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  hiddenBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
