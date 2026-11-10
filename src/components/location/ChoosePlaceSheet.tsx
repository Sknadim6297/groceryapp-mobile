import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { useSavedAddresses } from '@/context/SavedAddressesContext';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import { formatDeliveryAddress, referenceLocations } from '@/data/referenceLocations';
import { readCurrentLocation } from '@/services/location/locationService';
import type { DeliveryLocation } from '@/types/location';
import { formatSavedAddressLines, savedAddressToDeliveryLocation } from '@/utils/savedAddressMapping';
import { displayAddressLabel } from '@/utils/savedAddressValidation';

type ChoosePlaceSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Called after GPS or a suggested/saved place is chosen. */
  onPickLocation: (location: DeliveryLocation) => void;
  /** Called when the user wants a blank manual form. */
  onEnterManually: () => void;
  /** Hide the saved-address list (useful on the Saved Addresses screen itself). */
  showSavedAddresses?: boolean;
  statusCopy?: Partial<Record<string, string>>;
};

const defaultStatusCopy: Record<string, string> = {
  denied: 'Location permission was denied. You can enter an address instead.',
  'services-off': 'Location services are turned off. Turn them on, or enter an address.',
  timeout: 'Finding your location took too long. Try again, or enter an address.',
  unavailable: 'Could not read your current location. Enter the address manually.',
};

/**
 * Tall bottom sheet for picking a place: search, GPS, manual entry, optional saved/suggested.
 */
export function ChoosePlaceSheet({
  visible,
  onClose,
  onPickLocation,
  onEnterManually,
  showSavedAddresses = true,
  statusCopy,
}: ChoosePlaceSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const keyboardCover = useKeyboardOverlap();
  const keyboardOverlap = Platform.OS === 'android' ? keyboardCover : 0;
  const sheetHeight = Math.min(Math.round(windowHeight * 0.78), 680);
  const { addresses } = useSavedAddresses();
  const [detecting, setDetecting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const copy = { ...defaultStatusCopy, ...statusCopy };
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
    if (result.status !== 'ready' && result.status !== 'approximate-permission') {
      setStatus(result.status);
      return;
    }
    setQuery('');
    setStatus(null);
    onPickLocation(result.location);
  }

  function pick(location: DeliveryLocation) {
    setStatus(null);
    setQuery('');
    onPickLocation(location);
  }

  function handleClose() {
    setStatus(null);
    setQuery('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.sheetBackdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetKeyboard}>
          <Pressable
            style={[
              styles.sheet,
              {
                height: sheetHeight,
                paddingBottom: Math.max(insets.bottom, 16) + keyboardOverlap,
              },
            ]}
            onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text accessibilityRole="header" style={styles.sheetTitle}>
              Choose Place
            </Text>

            <View style={styles.search}>
              <AppIcon name="search" color={colors.textSecondary} size={20} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search locality or apartment"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Search for an area or apartment"
                autoCorrect={false}
                style={styles.searchInput}
              />
            </View>

            {status ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {copy[status] ?? status}
              </Text>
            ) : null}

            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
              bounces={false}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Use my current location"
                accessibilityState={{ busy: detecting }}
                disabled={detecting}
                onPress={() => {
                  void detectCurrentLocation();
                }}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                {detecting ? (
                  <ActivityIndicator color={colors.primaryInk} />
                ) : (
                  <AppIcon name="stores" color={colors.primaryInk} size={22} />
                )}
                <Text style={styles.optionLabel}>
                  {detecting ? 'Finding your location…' : 'Use current location'}
                </Text>
                <AppIcon name="chevron" color={colors.textSecondary} size={18} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enter address manually"
                onPress={() => {
                  setQuery('');
                  setStatus(null);
                  onEnterManually();
                }}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                <AppIcon name="plus" color={colors.primaryInk} size={22} />
                <Text style={styles.optionLabel}>Enter address manually</Text>
                <AppIcon name="chevron" color={colors.textSecondary} size={18} />
              </Pressable>

              {showSavedAddresses && addresses.length > 0 ? (
                <Text style={styles.section}>Saved addresses</Text>
              ) : null}
              {showSavedAddresses
                ? addresses.map((address) => (
                    <Pressable
                      key={address.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${displayAddressLabel(address)}. ${formatSavedAddressLines(address)}`}
                      onPress={() => pick(savedAddressToDeliveryLocation(address))}
                      style={({ pressed }) => [styles.result, pressed && styles.pressed]}>
                      <Text style={styles.resultTitle}>{displayAddressLabel(address)}</Text>
                      <Text style={styles.resultDetail}>{formatSavedAddressLines(address)}</Text>
                    </Pressable>
                  ))
                : null}

              {matches.length > 0 ? <Text style={styles.section}>Suggested areas</Text> : null}
              {trimmed.length > 0 && matches.length === 0 ? (
                <Text style={styles.note}>No matching area. Enter an address manually instead.</Text>
              ) : null}
              {matches.map((place) => (
                <Pressable
                  key={place.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${place.label}, ${formatDeliveryAddress(place)}`}
                  onPress={() => pick(place)}
                  style={({ pressed }) => [styles.result, pressed && styles.pressed]}>
                  <Text style={styles.resultTitle}>{place.label}</Text>
                  <Text style={styles.resultDetail}>{formatDeliveryAddress(place)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sheetKeyboard: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
  },
  search: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.softBackground,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 10,
  },
  sheetScroll: {
    flex: 1,
    minHeight: 0,
  },
  sheetContent: {
    paddingBottom: 20,
    gap: 4,
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.primaryInk,
  },
  section: {
    marginTop: 14,
    marginBottom: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  result: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
  note: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
    paddingVertical: 8,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.75,
  },
});
