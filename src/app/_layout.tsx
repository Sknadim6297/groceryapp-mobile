import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { colors, fonts } from '@/constants/theme';
import { AuthFlowProvider } from '@/context/AuthFlowContext';
import { DeliveryLocationProvider } from '@/context/DeliveryLocationContext';
import { MockCartProvider } from '@/context/MockCartContext';
import { PreviewSessionProvider } from '@/context/PreviewSessionContext';
import { ProfileDraftProvider } from '@/context/ProfileDraftContext';

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primaryInk,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

const headerOptions = {
  headerShown: true,
  headerTintColor: colors.text,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.background },
  headerTitleStyle: { fontFamily: fonts.semibold, fontWeight: 'normal' as const },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [fonts.regular]: DMSans_400Regular,
    [fonts.medium]: DMSans_500Medium,
    [fonts.semibold]: DMSans_600SemiBold,
    [fonts.bold]: DMSans_700Bold,
    [fonts.interRegular]: Inter_400Regular,
    [fonts.interBold]: Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <AuthFlowProvider>
        <DeliveryLocationProvider>
        <ProfileDraftProvider>
        <MockCartProvider>
        <PreviewSessionProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="otp" options={{ headerShown: false }} />
        <Stack.Screen name="location" options={{ headerShown: false }} />
        <Stack.Screen name="location-manual" options={{ headerShown: false }} />
        <Stack.Screen name="complete-profile" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ ...headerOptions, title: 'Help' }} />
        <Stack.Screen name="terms" options={{ ...headerOptions, title: 'Terms & Conditions' }} />
        <Stack.Screen name="privacy" options={{ ...headerOptions, title: 'Privacy Policy' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="menu"
          options={{
            ...headerOptions,
            title: 'Menu',
          }}
        />
        </Stack>
        </PreviewSessionProvider>
        </MockCartProvider>
        </ProfileDraftProvider>
        </DeliveryLocationProvider>
      </AuthFlowProvider>
    </ThemeProvider>
  );
}
