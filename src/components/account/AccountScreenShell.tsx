import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { colors, fonts, homeLayout, space } from '@/constants/theme';

type AccountScreenShellProps = {
  title: string;
  fallbackHref?: Href;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Extra bottom padding when no footer (e.g. floating CTA elsewhere). */
  contentBottom?: number;
};

/** Shared account-feature chrome — warm canvas, max-width column, safe footer. */
export function AccountScreenShell({
  title,
  fallbackHref = '/profile',
  subtitle,
  children,
  footer,
  contentBottom,
}: AccountScreenShellProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = footer ? 16 : Math.max(insets.bottom, 16) + (contentBottom ?? 0);

  return (
    <View style={styles.screen}>
      <AppScreenHeader title={title} fallbackHref={fallbackHref} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.column}>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {children}
        </View>
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{footer}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: space.md,
    width: '100%',
    maxWidth: homeLayout.maxWidth,
    alignSelf: 'center',
  },
  column: {
    gap: space.md,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 10,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
