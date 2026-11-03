import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { colors, fonts } from '@/constants/theme';

type LocationFlowHeaderProps = {
  title: string;
  fallbackHref?: Href;
  onBack?: () => void;
};

/** Compact white header with Mayapur Bazaar logo + screen title (location flows). */
export function LocationFlowHeader({ title, fallbackHref = '/home', onBack }: LocationFlowHeaderProps) {
  const insets = useSafeAreaInsets();

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackHref);
  }

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={handleBack}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <AppIcon name="back" color={colors.text} size={22} />
        </Pressable>
        <BrandLogo height={36} />
        <View style={styles.side} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  topRow: {
    minHeight: 48,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  side: {
    width: 44,
  },
  title: {
    marginTop: 2,
    paddingHorizontal: 20,
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
});
