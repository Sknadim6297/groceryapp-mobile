import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { colors, fonts } from '@/constants/theme';

const hero = require('@/assets/images/onboarding/welcome-hero.jpg');
const produce = require('@/assets/images/home/produce.jpg');
const carrots = require('@/assets/images/home/carrots.jpg');

const highlights = [
  { value: 'Fresh', label: 'Daily groceries' },
  { value: 'Fast', label: 'To your door' },
  { value: 'Easy', label: 'Reorder later' },
] as const;

export default function IntroScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;

  function openLogin() {
    router.push('/login');
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={styles.circleLeft} />
      <View pointerEvents="none" style={styles.circleRight} />
      <Animated.View entering={FadeIn.duration(420)} style={[styles.brand, { paddingTop: insets.top + 12 }]}>
        <View style={styles.logoCard}>
          <BrandLogo height={compact ? 72 : 86} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(520)} style={styles.stage}>
        <View style={[styles.sideCard, styles.sideLeft]}>
          <Image source={produce} style={styles.sideImage} contentFit="cover" accessible={false} />
        </View>
        <View style={styles.centerCard}>
          <Image source={hero} style={styles.centerImage} contentFit="cover" accessible={false} />
        </View>
        <View style={[styles.sideCard, styles.sideRight]}>
          <Image source={carrots} style={styles.sideImage} contentFit="cover" accessible={false} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(180).duration(480)} style={styles.copy}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.2} style={[styles.title, compact && styles.titleCompact]}>
          Fresh groceries, delivered to your door.
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(260).duration(480)}
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.highlights} accessibilityRole="summary">
          {highlights.map((item, index) => (
            <View key={item.label} style={[styles.highlight, index > 0 && styles.highlightSplit]}>
              <Text maxFontSizeMultiplier={1.15} style={styles.highlightValue}>
                {item.value}
              </Text>
              <Text maxFontSizeMultiplier={1.15} style={styles.highlightLabel}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Get started"
          onPress={openLogin}
          style={({ pressed }) => [styles.start, pressed && styles.pressed]}>
          <Text style={styles.startLabel}>Get Started</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.brightYellow,
    overflow: 'hidden',
  },
  circleLeft: {
    position: 'absolute',
    top: 80,
    left: -70,
    width: 180,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  circleRight: {
    position: 'absolute',
    top: 140,
    right: -80,
    width: 200,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  pressed: {
    opacity: 0.8,
  },
  brand: {
    alignItems: 'center',
    marginTop: 8,
  },
  logoCard: {
    borderRadius: 36,
    backgroundColor: colors.white,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: '#854D0E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  highlights: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 28,
    paddingVertical: 14,
    marginBottom: 16,
  },
  highlight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    gap: 2,
  },
  highlightSplit: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(23, 23, 23, 0.12)',
  },
  highlightValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
    textAlign: 'center',
  },
  highlightLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryInk,
    textAlign: 'center',
  },
  stage: {
    marginTop: 28,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideCard: {
    position: 'absolute',
    width: 112,
    height: 148,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  sideLeft: {
    transform: [{ rotate: '-12deg' }, { translateX: -78 }, { translateY: 16 }],
  },
  sideRight: {
    transform: [{ rotate: '12deg' }, { translateX: 78 }, { translateY: 16 }],
  },
  sideImage: {
    width: '100%',
    height: '100%',
  },
  centerCard: {
    width: 150,
    height: 176,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 4,
    borderColor: colors.white,
    zIndex: 2,
  },
  centerImage: {
    width: '100%',
    height: '100%',
  },
  copy: {
    paddingHorizontal: 28,
    marginTop: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    color: colors.text,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 20,
  },
  start: {
    minHeight: 54,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLabel: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
  },
});
