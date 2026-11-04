import { Redirect, router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useSavedAddresses } from '@/context/SavedAddressesContext';
import { resolveAddressBookAddReturnTo, resolveLocationExitHref } from '@/navigation/locationFlow';
import { locationRoutes } from '@/navigation/locationRoutes';
import { profileRoutes } from '@/navigation/profileRoutes';
import { canUseDevelopmentHome } from '@/services/devOtp';
import type { AddressLabel, SavedAddress } from '@/types/savedAddress';
import { formatIndiaMobileDisplay, isValidIndiaMobile } from '@/utils/phoneValidation';
import { formatSavedAddressLines } from '@/utils/savedAddressMapping';
import { displayAddressLabel } from '@/utils/savedAddressValidation';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const labelIcon: Record<AddressLabel, AppIconName> = {
  Home: 'home',
  Work: 'briefcase',
  Other: 'stores',
};

function listTitle(address: SavedAddress): string {
  if (address.label === 'Home') {
    return 'Home Address';
  }
  if (address.label === 'Work') {
    return 'Office Address';
  }
  return displayAddressLabel(address);
}

export default function AddressesScreen() {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const selectMode = firstParam(params.mode) === 'select';
  const { hydrated: authHydrated, session, devSession } = useAuthSession();
  const {
    hydrated,
    addresses,
    deleteAddress,
    setDefaultAddress,
    selectAddressForDelivery,
  } = useSavedAddresses();
  const { beginAddressBookPick, returnTo } = useDeliveryLocation();
  const [pendingDelete, setPendingDelete] = useState<SavedAddress | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const contactPhone = session?.mobile ?? devSession?.mobile ?? '';
  const phoneLabel = isValidIndiaMobile(contactPhone)
    ? `+91 ${formatIndiaMobileDisplay(contactPhone)}`
    : contactPhone || 'Phone not on file';

  function openAddAddress() {
    beginAddressBookPick({
      selectMode,
      returnTo: resolveAddressBookAddReturnTo({ selectMode, existingReturnTo: returnTo }),
    });
    router.push(locationRoutes.search);
  }

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

  async function onDefault(address: SavedAddress) {
    setBusyId(address.id);
    setNotice(null);
    const ok = await setDefaultAddress(address.id);
    setBusyId(null);
    setNotice(ok ? 'Default delivery address updated.' : 'Could not update the default address.');
  }

  function onSelect(address: SavedAddress) {
    const ok = selectAddressForDelivery(address.id);
    if (!ok) {
      setNotice('Could not select this address.');
      return;
    }
    if (selectMode) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(resolveLocationExitHref(returnTo, '/cart'));
      }
      return;
    }
    setNotice(`Delivering to ${displayAddressLabel(address)}.`);
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    const id = pendingDelete.id;
    setBusyId(id);
    setPendingDelete(null);
    const ok = await deleteAddress(id);
    setBusyId(null);
    setNotice(ok ? 'Address removed.' : 'Could not remove this address.');
  }

  return (
    <View style={styles.screen} testID="location-addresses-screen">
      <AppScreenHeader
        title={selectMode ? 'Select Address' : 'Location'}
        fallbackHref={profileRoutes.profile}
      />

      {notice ? (
        <Text accessibilityRole="text" style={styles.notice}>
          {notice}
        </Text>
      ) : null}

      {addresses.length === 0 ? (
        <View style={{ paddingBottom: Math.max(insets.bottom, 24), flex: 1 }}>
          <EmptyState
            title="No saved addresses yet"
            body="Add a delivery address once and reuse it at checkout."
            art={
              <View style={styles.emptyIcon}>
                <AppIcon name="stores" color={colors.primaryInk} size={34} />
              </View>
            }
            action={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add New Address"
                onPress={openAddAddress}
                style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
                testID="addresses-empty-add">
                <Text style={styles.addButtonLabel}>Add New Address</Text>
              </Pressable>
            }
          />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom, 24) + 88 },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add Delivery Address"
              onPress={openAddAddress}
              style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
              testID="addresses-add-delivery">
              <Text style={styles.addRowLabel}>Add Delivery Address</Text>
              <AppIcon name="chevron" color={colors.textSecondary} size={20} />
            </Pressable>
          }
          renderItem={({ item, index }) => (
            <AddressRow
              address={item}
              phoneLabel={phoneLabel}
              busy={busyId === item.id}
              selectMode={selectMode}
              showDivider={index < addresses.length - 1}
              onSelect={() => onSelect(item)}
              onEdit={() =>
                router.push({
                  pathname: '/address-form',
                  params: { id: item.id, ...(selectMode ? { mode: 'select' } : {}) },
                })
              }
              onDefault={() => void onDefault(item)}
              onDelete={() => setPendingDelete(item)}
            />
          )}
        />
      )}

      {addresses.length > 0 ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add New Address"
            onPress={openAddAddress}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            testID="addresses-add-new">
            <Text style={styles.addButtonLabel}>Add New Address</Text>
          </Pressable>
        </View>
      ) : null}

      <Modal visible={pendingDelete !== null} transparent animationType="fade" onRequestClose={() => setPendingDelete(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setPendingDelete(null)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>Delete address?</Text>
            <Text style={styles.sheetCopy}>
              {pendingDelete
                ? `${displayAddressLabel(pendingDelete)} · ${formatSavedAddressLines(pendingDelete)}`
                : ''}
            </Text>
            <View style={styles.sheetActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={() => setPendingDelete(null)}
                style={({ pressed }) => [styles.sheetButton, pressed && styles.pressed]}>
                <Text style={styles.sheetCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete address"
                onPress={() => void confirmDelete()}
                style={({ pressed }) => [styles.sheetButton, styles.sheetDanger, pressed && styles.pressed]}>
                <Text style={styles.sheetDelete}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function AddressRow({
  address,
  phoneLabel,
  busy,
  selectMode,
  showDivider,
  onSelect,
  onEdit,
  onDefault,
  onDelete,
}: {
  address: SavedAddress;
  phoneLabel: string;
  busy: boolean;
  selectMode: boolean;
  showDivider: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDefault: () => void;
  onDelete: () => void;
}) {
  const title = listTitle(address);
  const lines = formatSavedAddressLines(address);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${phoneLabel}. ${lines}`}
        accessibilityState={{ disabled: busy, selected: address.isDefault }}
        disabled={busy}
        onPress={onSelect}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        testID={`address-row-${address.id}`}>
        <View style={[styles.iconWrap, address.isDefault && styles.iconWrapDefault]}>
          <AppIcon name={labelIcon[address.label]} color={colors.primaryInk} size={22} />
        </View>
        <View style={styles.rowCopy}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.rowTitle}>
              {title}
            </Text>
            {address.isDefault ? (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeLabel}>Default</Text>
              </View>
            ) : null}
          </View>
          <Text numberOfLines={1} style={styles.rowPhone}>
            {phoneLabel}
          </Text>
          <Text numberOfLines={3} style={styles.rowBody}>
            {lines}
          </Text>
          {selectMode ? (
            <Text style={styles.selectHint}>{busy ? 'Working…' : 'Tap to deliver here'}</Text>
          ) : null}
          <View style={styles.actions}>
            {!address.isDefault ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Set ${title} as default`}
                disabled={busy}
                onPress={onDefault}
                hitSlop={6}
                style={styles.action}>
                <Text style={styles.actionLabel}>Set default</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${title}`}
              disabled={busy}
              onPress={onEdit}
              hitSlop={6}
              style={styles.action}>
              <Text style={styles.actionLabel}>Edit</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${title}`}
              disabled={busy}
              onPress={onDelete}
              hitSlop={6}
              style={styles.action}>
              <Text style={[styles.actionLabel, styles.danger]}>{busy ? '…' : 'Delete'}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    marginTop: space.sm,
    marginHorizontal: homeLayout.gutter,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryInk,
    backgroundColor: colors.softYellow,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  list: {
    paddingTop: 4,
    width: '100%',
    maxWidth: homeLayout.maxWidth,
    alignSelf: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: homeLayout.gutter,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  addRowLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: homeLayout.gutter,
    paddingVertical: 16,
    backgroundColor: colors.white,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDefault: {
    backgroundColor: colors.primary,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  defaultBadge: {
    borderRadius: radii.pill,
    backgroundColor: colors.softYellow,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultBadgeLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.primaryInk,
  },
  rowPhone: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  rowBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  selectHint: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primaryInk,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
  },
  action: {
    minHeight: 28,
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.primaryInk,
  },
  danger: {
    color: colors.danger,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: homeLayout.gutter + 58,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: homeLayout.gutter,
    paddingTop: space.md,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.soft,
  },
  addButton: {
    minHeight: 54,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  addButtonLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: space.xl,
    gap: space.md,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  sheetCopy: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.sm,
  },
  sheetButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softBackground,
  },
  sheetDanger: {
    backgroundColor: '#FEE2E2',
  },
  sheetCancel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  sheetDelete: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.75,
  },
});
