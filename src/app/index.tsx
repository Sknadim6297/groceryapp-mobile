import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { colors } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { canUseDevelopmentHome, isDevOtpEnabled } from '@/services/devOtp';

const SPLASH_MS = 1100;

const preload = [
  require('@/assets/images/onboarding/welcome-hero.jpg'),
  require('@/assets/images/home/produce.jpg'),
  require('@/assets/images/home/carrots.jpg'),
];

export default function SplashScreen() {
  const { hydrated, session, devSession } = useAuthSession();
  const [opacity] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.84));
  const [shift] = useState(() => new Animated.Value(14));

  useEffect(() => {
    const motion = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 780, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 780, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(shift, { toValue: 0, duration: 780, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    motion.start();
    if (!hydrated) {
      return () => {
        motion.stop();
      };
    }
    const timer = setTimeout(() => {
      if (session || canUseDevelopmentHome(devSession)) {
        router.replace('/home');
        return;
      }
      if (isDevOtpEnabled() && devSession?.destination === 'complete-profile') {
        router.replace('/complete-profile');
        return;
      }
      router.replace('/intro');
    }, SPLASH_MS);
    return () => {
      clearTimeout(timer);
      motion.stop();
    };
  }, [devSession, hydrated, opacity, scale, session, shift]);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={styles.preload}>
        {preload.map((source) => (
          <Image key={String(source)} source={source} style={styles.preloadImage} />
        ))}
      </View>
      <Animated.View style={{ opacity, transform: [{ scale }, { translateY: shift }] }}>
        <BrandLogo height={120} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preload: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  preloadImage: {
    width: 1,
    height: 1,
  },
});
