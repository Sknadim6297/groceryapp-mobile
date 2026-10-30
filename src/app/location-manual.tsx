import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ManualAddressForm } from '@/components/location/ManualAddressForm';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import type { ManualAddressInput } from '@/types/location';

export default function LocationManualScreen() {
  const insets = useSafeAreaInsets();
  const { setSelection } = useDeliveryLocation();

  function saveAddress(value: ManualAddressInput) {
    setSelection({
      id: 'manual',
      label: 'Entered address',
      addressLine1: value.addressLine1,
      landmark: value.landmark || undefined,
      city: value.city,
      state: value.state,
      postalCode: value.postalCode,
      country: 'India',
      source: 'manual',
    });
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/location');
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) + 12 },
          ]}>
          <View style={styles.column}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/location'))}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
              <AppIcon name="back" color={colors.text} size={18} />
            </Pressable>
            <Text accessibilityRole="header" style={styles.title}>
              Enter location manually
            </Text>
            <Text style={styles.subtitle}>
              This address is saved as text only. It does not include map coordinates.
            </Text>
            <ManualAddressForm onSubmit={saveAddress} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 20,
    gap: 16,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.welcomeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
