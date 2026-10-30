import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';

const produceImage = require('@/assets/images/home/banner-produce.jpg');

export function PromotionalBanner() {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const badge = UI_PREVIEW_MODE ? 'FRESH GOODNESS IN 10 MINS' : 'FARM FRESH';

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={
        UI_PREVIEW_MODE
          ? 'Demo banner. Freshness delivered fast. Ten minutes is not a confirmed delivery time.'
          : 'Freshness delivered fast. Farm fresh fruits and vegetables at your doorstep.'
      }
      style={[styles.banner, compact && styles.bannerCompact]}
      testID="promo-banner">
      <View style={styles.copy}>
        <Text maxFontSizeMultiplier={1.15} style={[styles.title, compact && styles.titleCompact]}>
          Freshness delivered fast
        </Text>
        <Text maxFontSizeMultiplier={1.2} style={styles.subtitle}>
          Farm fresh fruits & veggies at your doorstep
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Shop now"
          onPress={() => router.push({ pathname: '/shop', params: { category: 'fruits' } })}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonLabel}>Shop Now</Text>
          <AppIcon name="arrow" color={colors.white} size={14} />
        </Pressable>
      </View>
      <Image source={produceImage} style={styles.image} contentFit="cover" contentPosition="right center" accessible={false} />
      <View style={styles.badge} importantForAccessibility="no" accessibilityElementsHidden>
        <Text style={styles.badgeLabel}>{badge}</Text>
      </View>
      <View style={styles.dots} importantForAccessibility="no" accessibilityElementsHidden>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    height: 148,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFF4C4',
  },
  bannerCompact: {
    height: 136,
  },
  copy: {
    width: '58%',
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 14,
    paddingRight: 6,
    zIndex: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 24,
    color: colors.text,
  },
  titleCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  button: {
    marginTop: 10,
    alignSelf: 'flex-start',
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
  },
  pressed: {
    opacity: 0.8,
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '56%',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 72,
    borderRadius: 12,
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  badgeLabel: {
    fontFamily: fonts.bold,
    fontSize: 8,
    lineHeight: 10,
    color: colors.white,
    textAlign: 'center',
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(23, 23, 23, 0.18)',
  },
  dotActive: {
    width: 12,
    backgroundColor: 'rgba(23, 23, 23, 0.45)',
  },
});
