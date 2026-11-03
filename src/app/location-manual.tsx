import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ManualAddressForm } from '@/components/location/ManualAddressForm';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { colors, fonts } from '@/constants/theme';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useConfirmDeliveryLocation } from '@/hooks/useConfirmDeliveryLocation';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import type { ManualAddressInput } from '@/types/location';

export default function LocationManualScreen() {
  const insets = useSafeAreaInsets();
  const keyboardCover = useKeyboardOverlap();
  const keyboardOverlap = Platform.OS === 'android' ? keyboardCover : 0;
  const { setSelection } = useDeliveryLocation();
  const { confirmLocation, isBusy } = useConfirmDeliveryLocation();
  const [saving, setSaving] = useState(false);

  async function saveAddress(value: ManualAddressInput) {
    if (saving || isBusy()) {
      return;
    }
    const location = {
      id: `manual-${Date.now()}`,
      label: value.city || 'Entered address',
      addressLine1: value.addressLine1,
      landmark: value.landmark || undefined,
      locality: value.city,
      city: value.city,
      state: value.state,
      postalCode: value.postalCode,
      country: 'India',
      source: 'manual' as const,
    };
    setSelection(location);
    setSaving(true);
    try {
      await confirmLocation(location);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AppScreenHeader title="Enter location" fallbackHref="/location" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(insets.bottom, 16) + 12 + keyboardOverlap },
          ]}>
          <View style={styles.column}>
            <Text style={styles.subtitle}>
              This address is saved as text only. It does not include map coordinates.
            </Text>
            <ManualAddressForm onSubmit={(value) => void saveAddress(value)} submitLabel={saving ? 'Saving…' : 'Continue'} />
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
    paddingTop: 16,
  },
  column: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 20,
    gap: 16,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
