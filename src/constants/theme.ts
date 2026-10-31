/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '../global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Each DM Sans file is registered under its own family name.
 * Set `fontFamily` to the matching face. `fontWeight` does not select another file.
 */
export const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  interRegular: 'Inter_400Regular',
  interBold: 'Inter_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: fonts.regular,
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: fonts.regular,
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: fonts.regular,
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * Grocery UI tokens.
 * `primaryInk` is the brand yellow darkened so small text and icons stay
 * readable on white. `#EAB308` is for fills, not for 11px labels.
 */
export const colors = {
  primary: '#FACC15',
  primaryDark: '#EAB308',
  primaryInk: '#854D0E',
  softYellow: '#FEF9C3',
  background: '#FFFFFF',
  softBackground: '#F8FAFC',
  text: '#171717',
  textSecondary: '#64748B',
  textOnPrimary: '#171717',
  textOnPrimaryMuted: 'rgba(23, 23, 23, 0.72)',
  border: '#E5E7EB',
  success: '#16A34A',
  danger: '#DC2626',
  iconSurface: '#171717',
  white: '#FFFFFF',
  brightYellow: '#FFD633',
  cream: '#FFFBEB',
  welcomeSoft: '#FEF3C7',
  welcomeMuted: '#737373',
  iconBadge: '#FDE68A',
} as const;

export const headerGradient = ['#FDE047', '#FACC15', '#EAB308'] as const;

export const fontFamily = fonts.regular;

export const homeLayout = {
  maxWidth: 480,
  gutter: 16,
} as const;
