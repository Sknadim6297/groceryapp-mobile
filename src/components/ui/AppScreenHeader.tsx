import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, control, fonts, space } from '@/constants/theme';

export const APP_SCREEN_HEADER_HEIGHT = 52;

type AppScreenHeaderProps = {
  title: string;
  /** Defaults to router.back(), or replace(fallbackHref) when there is no history. */
  onBack?: () => void;
  fallbackHref?: Href;
  showBack?: boolean;
  right?: ReactNode;
  /** Accessibility label for the back control. */
  backAccessibilityLabel?: string;
  titleWeight?: 'medium' | 'semibold';
};

/**
 * Compact white inner-screen header.
 * Title stays centered regardless of left/right control widths.
 * Intentionally white (not yellow) so it is visually distinct from Home/Profile tab chrome.
 */
export function AppScreenHeader({
  title,
  onBack,
  fallbackHref = '/home',
  showBack = true,
  right,
  backAccessibilityLabel = 'Go back',
  titleWeight = 'semibold',
}: AppScreenHeaderProps) {
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
    <View style={[styles.wrap, { paddingTop: insets.top }]} testID="app-screen-header">
      <StatusBar style="dark" />
      <View style={styles.bar}>
        <View style={styles.side}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={backAccessibilityLabel}
              hitSlop={10}
              onPress={handleBack}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              testID="app-screen-header-back">
              <AppIcon name="back" color={colors.text} size={22} />
            </Pressable>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>

        <View pointerEvents="none" style={styles.titleWrap}>
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            style={[styles.title, titleWeight === 'medium' && styles.titleMedium]}
            testID="app-screen-header-title">
            {title}
          </Text>
        </View>

        <View style={[styles.side, styles.sideRight]}>{right ?? <View style={styles.iconButton} />}</View>
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    zIndex: 20,
    elevation: 0,
  },
  bar: {
    height: APP_SCREEN_HEADER_HEIGHT,
    paddingHorizontal: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  side: {
    minWidth: control.icon,
    zIndex: 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideRight: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  iconButton: {
    width: control.touch,
    height: control.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 56,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'center',
  },
  titleMedium: {
    fontFamily: fonts.medium,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  pressed: {
    opacity: 0.65,
  },
});
