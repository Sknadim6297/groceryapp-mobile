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
import { ToastProvider } from '@/components/ui/AppToast';
import { AuthFlowProvider } from '@/context/AuthFlowContext';
import { AuthSessionProvider } from '@/context/AuthSessionContext';
import { CustomerAccountProvider } from '@/context/CustomerAccountContext';
import { CustomerProfileProvider } from '@/context/CustomerProfileContext';
import { RememberedCustomerProvider } from '@/context/RememberedCustomerContext';
import { getDevOtpRuntimeSnapshot } from '@/constants/devOtpMode';
import { rejectDevTestSessionOutsideDevelopment } from '@/services/devOtp';
import { DeliveryLocationProvider } from '@/context/DeliveryLocationContext';
import { MockCartProvider } from '@/context/MockCartContext';
import { PreviewSessionProvider } from '@/context/PreviewSessionContext';
import { ProfileDraftProvider } from '@/context/ProfileDraftContext';
import { SavedAddressesProvider } from '@/context/SavedAddressesContext';
import { WishlistProvider } from '@/context/WishlistContext';

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
    rejectDevTestSessionOutsideDevelopment();
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // Safe flags only — never OTP codes, tokens, or phone numbers.
      console.info('[dev-otp]', getDevOtpRuntimeSnapshot());
    }
  }, []);

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
      <ToastProvider>
      <AuthFlowProvider>
      <AuthSessionProvider>
      <RememberedCustomerProvider>
      <CustomerAccountProvider>
        <CustomerProfileProvider>
        <DeliveryLocationProvider>
        <SavedAddressesProvider>
        <ProfileDraftProvider>
        <MockCartProvider>
        <WishlistProvider>
        <PreviewSessionProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}>
        <Stack.Screen name="index" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="intro" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="otp" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="location" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="location-map" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="location-manual" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="complete-profile" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="addresses" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="address-form" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="wishlist" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="help" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="support/faq/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="support/chat" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="terms" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="privacy" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="category/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="orders" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="checkout" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="payment" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="my-payment" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="order-confirmed" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="coupons" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="buy-again" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="transactions" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="scan-qr" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="store/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="menu" options={{ headerShown: false, animation: 'slide_from_right' }} />
        </Stack>
        </PreviewSessionProvider>
        </WishlistProvider>
        </MockCartProvider>
        </ProfileDraftProvider>
        </SavedAddressesProvider>
        </DeliveryLocationProvider>
        </CustomerProfileProvider>
      </CustomerAccountProvider>
      </RememberedCustomerProvider>
      </AuthSessionProvider>
      </AuthFlowProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
