import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { colors, fonts, homeLayout } from '@/constants/theme';

export default function NotFoundScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: false }} />
      <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <BrandLogo height={56} />
        <Text accessibilityRole="header" style={styles.title}>
          Page not found
        </Text>
        <Text style={styles.body}>
          That link does not match a screen in Mayapur Bazaar. Check the address or return home to keep shopping.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to home"
          onPress={() => router.replace('/home')}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonLabel}>Go to Home</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Browse the shop"
          onPress={() => router.replace('/shop')}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryLabel}>Browse Shop</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    marginTop: 12,
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 360,
  },
  button: {
    marginTop: 12,
    minHeight: 48,
    minWidth: 200,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  secondary: {
    minHeight: 44,
    minWidth: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secondaryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  pressed: {
    opacity: 0.85,
  },
});
