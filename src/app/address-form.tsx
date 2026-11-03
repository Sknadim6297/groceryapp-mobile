import { Redirect, router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

import { LocationFlowHeader } from '@/components/location/LocationFlowHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useSavedAddresses } from '@/context/SavedAddressesContext';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import { canUseDevelopmentHome } from '@/services/devOtp';
import { profileRoutes } from '@/navigation/profileRoutes';
import { locationRoutes } from '@/navigation/locationRoutes';
import type { AddressLabel, SavedAddress, SavedAddressDraft } from '@/types/savedAddress';
import { deliveryLocationToDraft, finalizeAddressDraft, savedAddressToDraft } from '@/utils/savedAddressMapping';
import {
  emptyAddressDraft,
  isAddressDraftReady,
  normalizePostalCode,
  validateAddressDraft,
} from '@/utils/savedAddressValidation';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const LABELS: AddressLabel[] = ['Home', 'Work', 'Other'];

export default function AddressFormScreen() {
  const focused = useIsFocused();
  const params = useLocalSearchParams<{ id?: string | string[]; mode?: string | string[] }>();
  const editId = firstParam(params.id);
  const selectMode = firstParam(params.mode) === 'select';
  const { hydrated: authHydrated, session, devSession } = useAuthSession();
  const { hydrated, addresses } = useSavedAddresses();
  const existing = editId ? addresses.find((address) => address.id === editId) : undefined;

  if (!authHydrated || !hydrated) {
    return (
      <View style={[styles.screen, styles.loading]}>
        <ActivityIndicator color={colors.primaryInk} />
      </View>
    );
  }

  if (!session && !canUseDevelopmentHome(devSession)) {
    if (!focused) {
      return null;
    }
    return <Redirect href={profileRoutes.login} />;
  }

  if (editId && !existing) {
    return (
      <View style={styles.screen}>
        <LocationFlowHeader title="Save Delivery Address" fallbackHref={profileRoutes.addresses} />
        <Text style={styles.missing}>This address is no longer saved.</Text>
      </View>
    );
  }

  return (
    <AddressFormBody
      key={editId ?? 'new'}
      editId={editId}
      selectMode={selectMode}
      existing={existing}
      addressCount={addresses.length}
    />
  );
}

function AddressFormBody({
  editId,
  selectMode,
  existing,
  addressCount,
}: {
  editId?: string;
  selectMode: boolean;
  existing?: SavedAddress;
  addressCount: number;
}) {
  const insets = useSafeAreaInsets();
  const keyboardCover = useKeyboardOverlap();
  const keyboardOverlap = Platform.OS === 'android' ? keyboardCover : 0;
  const { saveAddress, selectAddressForDelivery } = useSavedAddresses();
  const { addressBookResult, beginAddressBookPick, consumeAddressBookResult } = useDeliveryLocation();
  const [draft, setDraft] = useState<SavedAddressDraft>(() =>
    existing ? savedAddressToDraft(existing) : emptyAddressDraft(),
  );
  const [makeDefault, setMakeDefault] = useState(() => existing?.isDefault ?? addressCount === 0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validateAddressDraft>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const bakedResult = useRef(false);

  useEffect(() => {
    if (!addressBookResult || bakedResult.current) {
      return;
    }
    bakedResult.current = true;
    setDraft((current) => deliveryLocationToDraft(addressBookResult, current));
    consumeAddressBookResult();
    setDirty(true);
  }, [addressBookResult, consumeAddressBookResult]);

  const ready = isAddressDraftReady(draft);

  function update<K extends keyof SavedAddressDraft>(field: K, value: SavedAddressDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
    setDirty(true);
  }

  function openLocationPicker() {
    beginAddressBookPick({
      selectMode,
      returnTo: selectMode ? { pathname: '/address-form', params: { mode: 'select' } } : '/address-form',
    });
    router.push(locationRoutes.search);
  }

  async function submit() {
    if (saving) {
      return;
    }
    const payload = finalizeAddressDraft(draft);
    const errors = validateAddressDraft(payload);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Please fix the highlighted fields.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await saveAddress(
      {
        ...payload,
        postalCode: normalizePostalCode(payload.postalCode),
      },
      { id: editId, makeDefault: makeDefault || addressCount === 0 },
    );
    setSaving(false);
    if (!result.ok) {
      setError(
        result.reason === 'duplicate'
          ? 'This address is already saved.'
          : result.reason === 'no-owner'
            ? 'Sign in again to save addresses.'
            : 'Could not save this address.',
      );
      return;
    }
    setDirty(false);
    if (selectMode) {
      selectAddressForDelivery(result.address.id);
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace({ pathname: '/addresses', params: selectMode ? { mode: 'select' } : {} });
  }

  function handleBack() {
    if (dirty) {
      setError('You have unsaved changes. Save the address or discard by pressing back again.');
      setDirty(false);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(profileRoutes.addresses);
  }

  return (
    <View style={styles.screen}>
      <LocationFlowHeader title="Save Delivery Address" onBack={handleBack} fallbackHref={profileRoutes.addresses} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            styles.scroll,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 88 + keyboardOverlap,
            },
          ]}>
          <View style={styles.column}>
            <Text style={styles.subtitle}>Add address details for a faster checkout</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change location"
              onPress={openLocationPicker}
              style={({ pressed }) => [styles.changeLocation, pressed && styles.pressed]}>
              <AppIcon name="stores" color={colors.primaryInk} size={18} />
              <Text style={styles.changeLocationLabel}>Change location</Text>
              <AppIcon name="chevron" color={colors.textSecondary} size={18} />
            </Pressable>

            <Field
              label="House / Flat No."
              required
              value={draft.houseNumber}
              placeholder="12B"
              error={fieldErrors.houseNumber}
              onChangeText={(next) => update('houseNumber', next)}
            />
            <Field
              label="Building / Street"
              required
              value={draft.buildingStreet}
              placeholder="Main Road"
              error={fieldErrors.buildingStreet}
              onChangeText={(next) => update('buildingStreet', next)}
            />
            <Field
              label="Area / Locality"
              required
              value={draft.area}
              placeholder="Locality"
              error={fieldErrors.area}
              onChangeText={(next) => update('area', next)}
            />
            <View style={styles.row}>
              <View style={styles.half}>
                <Field
                  label="City"
                  required
                  value={draft.city}
                  placeholder="City"
                  error={fieldErrors.city}
                  onChangeText={(next) => update('city', next)}
                />
              </View>
              <View style={styles.half}>
                <Field
                  label="PIN Code"
                  required
                  value={normalizePostalCode(draft.postalCode)}
                  placeholder="6 digits"
                  keyboardType="number-pad"
                  error={fieldErrors.postalCode}
                  onChangeText={(next) => update('postalCode', next)}
                />
              </View>
            </View>
            <Field
              label="State"
              required
              value={draft.state}
              placeholder="State"
              error={fieldErrors.state}
              onChangeText={(next) => update('state', next)}
            />
            <Field
              label="Landmark (Optional)"
              value={draft.landmark}
              placeholder="Near landmark"
              onChangeText={(next) => update('landmark', next)}
            />
            <Field
              label="Delivery instructions (Optional)"
              value={draft.instructions}
              placeholder="Gate code, floor, tip for rider"
              multiline
              onChangeText={(next) => update('instructions', next)}
            />

            <Text style={styles.section}>Address Label</Text>
            <View style={styles.labels}>
              {LABELS.map((label) => {
                const active = draft.label === label;
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={label}
                    onPress={() => update('label', label)}
                    style={[styles.labelChip, active && styles.labelChipActive]}>
                    {active ? <AppIcon name="check" color={colors.text} size={14} /> : null}
                    <Text style={[styles.labelChipText, active && styles.labelChipTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {draft.label === 'Other' ? (
              <Field
                label="Custom label"
                value={draft.customLabel}
                placeholder="Mom's place"
                error={fieldErrors.customLabel}
                onChangeText={(next) => update('customLabel', next)}
              />
            ) : null}

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: makeDefault }}
              accessibilityLabel="Set as default delivery address"
              onPress={() => setMakeDefault((current) => !current)}
              style={({ pressed }) => [styles.defaultRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, makeDefault && styles.checkboxOn]}>
                {makeDefault ? <AppIcon name="check" color={colors.text} size={14} /> : null}
              </View>
              <Text style={styles.defaultLabel}>Set as default delivery address</Text>
            </Pressable>

            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <PrimaryButton
            label={saving ? 'Saving…' : 'Save Address'}
            accessibilityLabel="Save Address"
            loading={saving}
            disabled={!ready || saving}
            onPress={() => void submit()}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  error,
  keyboardType = 'default',
  multiline = false,
  required = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  error?: string;
  keyboardType?: 'default' | 'number-pad';
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}>*</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        autoCorrect={false}
        multiline={multiline}
        accessibilityLabel={label}
        style={[styles.input, multiline && styles.inputMultiline, error ? styles.inputError : null]}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.fieldError}>
          {error}
        </Text>
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
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: homeLayout.maxWidth,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  changeLocation: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.softYellow,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeLocationLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  section: {
    marginTop: 4,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  labels: {
    flexDirection: 'row',
    gap: 8,
  },
  labelChip: {
    minHeight: 40,
    minWidth: 76,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  labelChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.softYellow,
  },
  labelChipText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  labelChipTextActive: {
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
    minWidth: 0,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  required: {
    color: colors.danger,
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.softBackground,
    paddingHorizontal: 14,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
  },
  inputMultiline: {
    minHeight: 88,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.danger,
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primary,
  },
  defaultLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  missing: {
    margin: 16,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  pressed: {
    opacity: 0.75,
  },
});
