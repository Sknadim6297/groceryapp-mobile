import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';

const produce = require('@/assets/images/home/banner-produce.jpg');

function ShopButton({ label, light }: { label: string; light?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push('/shop')}
      style={({ pressed }) => [styles.button, light && styles.buttonLight, pressed && styles.pressed]}>
      <Text style={[styles.buttonLabel, light && styles.buttonLabelDark]}>{label}</Text>
      <AppIcon name="arrow" color={light ? colors.text : colors.white} size={14} />
    </Pressable>
  );
}

export function SavingsBanner() {
  return (
    <View style={styles.savings} accessibilityRole="summary" accessibilityLabel="Demo offer. Big savings on daily needs.">
      <View style={styles.savingsCopy}>
        <Text style={styles.savingsTitle}>Big savings{'\n'}on daily needs</Text>
        <Text style={styles.savingsSub}>Fresh groceries at great prices every day</Text>
        <ShopButton label="Shop Deals" />
      </View>
      <Image source={produce} style={styles.savingsImage} contentFit="cover" accessible={false} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>UP TO{'\n'}50% OFF</Text>
      </View>
    </View>
  );
}

export function FreeDeliveryBanner() {
  return (
    <View style={styles.green} accessibilityRole="summary" accessibilityLabel="Demo banner. Free delivery is not confirmed.">
      <Text style={styles.greenTitle}>Get Free Delivery</Text>
      <Text style={styles.greenSub}>On orders above ₹499</Text>
      <ShopButton label="Shop Now" light />
    </View>
  );
}

export function MinutesBanner() {
  return (
    <View style={styles.purple} accessibilityRole="summary" accessibilityLabel="Demo banner. Ten minutes is not a confirmed delivery time.">
      <View style={styles.purpleCopy}>
        <View style={styles.purpleTitleRow}>
          <AppIcon name="bolt" color={colors.primary} size={18} />
          <Text style={styles.purpleTitle}>Grocery in Minutes</Text>
        </View>
        <Text style={styles.purpleSub}>Daily essentials delivered super fast</Text>
        <ShopButton label="Order Now" light />
      </View>
      <View style={styles.minuteBadge}>
        <Text style={styles.minuteValue}>10</Text>
        <Text style={styles.minuteLabel}>MINS</Text>
      </View>
    </View>
  );
}

export function FruitsBanner() {
  return (
    <View style={styles.fruits} accessibilityRole="summary">
      <View style={styles.fruitsCopy}>
        <Text style={styles.fruitsTitle}>Fresh Fruits & Vegetables</Text>
        <Text style={styles.fruitsSub}>Farm fresh • Handpicked • Hygienic</Text>
        <ShopButton label="Shop Now" />
      </View>
      <Image source={produce} style={styles.fruitsImage} contentFit="cover" accessible={false} />
      <View style={styles.freshBadge}>
        <Text style={styles.freshText}>100%{'\n'}Fresh</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  savings: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 148,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFF4C4',
  },
  savingsCopy: {
    width: '58%',
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 14,
    zIndex: 1,
    gap: 6,
  },
  savingsTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 24,
    color: colors.text,
  },
  savingsSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  savingsImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '52%',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    lineHeight: 11,
    color: colors.text,
    textAlign: 'center',
  },
  green: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: '#22C55E',
    padding: 16,
    gap: 6,
  },
  greenTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 24,
    color: colors.white,
  },
  greenSub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.white,
  },
  purple: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: '#6D28D9',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  purpleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  purpleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  purpleTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.white,
  },
  purpleSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: '#EDE9FE',
  },
  minuteBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuteValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 24,
    color: colors.text,
  },
  minuteLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text,
  },
  fruits: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 132,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#ECFDF3',
  },
  fruitsCopy: {
    width: '62%',
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 14,
    zIndex: 1,
    gap: 6,
  },
  fruitsTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  fruitsSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  fruitsImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '48%',
  },
  freshBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freshText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    lineHeight: 11,
    color: colors.white,
    textAlign: 'center',
  },
  button: {
    marginTop: 6,
    alignSelf: 'flex-start',
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonLight: {
    backgroundColor: colors.white,
  },
  buttonLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
  },
  buttonLabelDark: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
  },
  pressed: {
    opacity: 0.8,
  },
});
