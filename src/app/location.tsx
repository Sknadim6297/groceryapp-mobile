import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import { formatDeliveryAddress, referenceLocations } from '@/data/referenceLocations';
import { locationContinueTarget } from '@/navigation/locationFlow';
import { canUseDevelopmentHome } from '@/services/devOtp';
import { readCurrentLocation } from '@/services/location/locationService';

const statusCopy: Record<string, string> = {
  denied: 'Location permission was denied. You can enter an address instead.',
  'services-off': 'Location services are turned off. Turn them on, or enter an address.',
  timeout: 'Finding your location took too long. Try again, or enter an address.',
  unavailable: 'A street address could not be read. Enter the address manually.',
};

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const keyboardCover = useKeyboardOverlap();
  const keyboardOverlap = Platform.OS === 'android' ? keyboardCover : 0;
  const { selection, setSelection, confirmSelection, locationIntent } = useDeliveryLocation();
  const { session, devSession } = useAuthSession();
  const leaving = useRef(false);
  const [detecting, setDetecting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const trimmed = query.trim().toLowerCase();
  const matches =
    trimmed.length === 0
      ? []
      : referenceLocations.filter((place) =>
          `${place.label} ${formatDeliveryAddress(place)}`.toLowerCase().includes(trimmed),
        );

  async function detectCurrentLocation() {
    if (detecting) {
      return;
    }

    setDetecting(true);
    setStatus(null);
    const result = await readCurrentLocation();
    setDetecting(false);

    if (result.status !== 'ready') {
      setStatus(result.status);
      return;
    }

    setSelection(result.location);
    if (result.location.approximate) {
      setStatus('approximate');
    }
  }

  function continueNext() {
    if (!selection || leaving.current) {
      return;
    }

    leaving.current = true;
    confirmSelection();
    const target = locationContinueTarget({
      intent: locationIntent,
      canGoBack: router.canGoBack(),
      signedIn: Boolean(session) || canUseDevelopmentHome(devSession),
    });
    if (target === 'back') {
      router.back();
      return;
    }
    router.replace(target);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + 16,
              paddingBottom: Math.max(insets.bottom, 12) + (selection ? 96 : 24) + keyboardOverlap,
            },
          ]}>
          <View style={styles.column}>
            <Text accessibilityRole="header" maxFontSizeMultiplier={1.2} style={styles.title}>
              Enter your area or apartment name
            </Text>
            <View style={styles.search}>
              <AppIcon name="search" color={colors.textSecondary} size={24} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Try a locality or apartment"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Search for an area or apartment"
                autoCorrect={false}
                style={styles.searchInput}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Use my current location"
              accessibilityState={{ busy: detecting }}
              disabled={detecting}
              onPress={() => {
                void detectCurrentLocation();
              }}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <AppIcon name="stores" color={colors.primaryInk} size={24} />
              <Text style={styles.rowLabel}>{detecting ? 'Finding your location…' : 'Use my current location'}</Text>
              <AppIcon name="chevron" color={colors.textSecondary} size={24} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add new address"
              onPress={() => router.push('/location-manual')}
              style={({ pressed }) => [styles.row, styles.rowLast, pressed && styles.pressed]}>
              <AppIcon name="plus" color={colors.primaryInk} size={24} />
              <Text style={styles.rowLabel}>Add new address</Text>
            </Pressable>

            {status === 'approximate' ? (
              <Text style={styles.note}>This location is approximate. Check the address before continuing.</Text>
            ) : null}
            {status === 'preview' ? (
              <Text style={styles.note}>UI preview does not request location permission.</Text>
            ) : null}
            {status && status !== 'approximate' && status !== 'preview' ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {statusCopy[status]}
              </Text>
            ) : null}

            {matches.length > 0 ? <Text style={styles.section}>Suggested areas</Text> : null}
            {trimmed.length > 0 && matches.length === 0 ? (
              <Text style={styles.note}>No matching area. Add a new address instead.</Text>
            ) : null}
            {matches.map((place) => (
              <Pressable
                key={place.id}
                accessibilityRole="button"
                accessibilityLabel={`${place.label}, ${formatDeliveryAddress(place)}`}
                accessibilityState={{ selected: selection?.id === place.id }}
                onPress={() => {
                  setStatus(null);
                  setSelection(place);
                }}
                style={({ pressed }) => [styles.result, selection?.id === place.id && styles.resultSelected, pressed && styles.pressed]}>
                <Text style={styles.resultTitle}>{place.label}</Text>
                <Text style={styles.resultDetail}>{formatDeliveryAddress(place)}</Text>
              </Pressable>
            ))}

            {selection ? (
              <View style={styles.selected}>
                <Text style={styles.section}>Selected address</Text>
                <Text style={styles.resultTitle}>{selection.label}</Text>
                <Text style={styles.resultDetail}>{formatDeliveryAddress(selection)}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {selection ? (
        <View
          style={[
            styles.footer,
            {
              bottom: keyboardOverlap,
              paddingBottom: keyboardOverlap > 0 ? 12 : Math.max(insets.bottom, 12),
            },
          ]}>
          <View style={styles.footerInner}>
            <PrimaryButton label="Continue" onPress={continueNext} accessibilityLabel="Continue with this address" />
            <Text style={styles.disclaimer}>Delivery availability is not confirmed until the store service checks this address.</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
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
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
  },
  search: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 10,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.primaryInk,
  },
  pressed: {
    opacity: 0.75,
  },
  section: {
    marginTop: 18,
    marginBottom: 8,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  result: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultSelected: {
    backgroundColor: colors.softYellow,
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  resultTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  resultDetail: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  selected: {
    marginTop: 8,
  },
  note: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  error: {
    marginTop: 12,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingTop: 8,
    backgroundColor: colors.white,
  },
  footerInner: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 20,
    gap: 8,
  },
  disclaimer: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
