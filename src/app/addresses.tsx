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
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useSavedAddresses } from '@/context/SavedAddressesContext';
import { canUseDevelopmentHome } from '@/services/devOtp';
import { locationRoutes } from '@/navigation/locationRoutes';
import { profileRoutes } from '@/navigation/profileRoutes';
import type { AddressLabel, SavedAddress } from '@/types/savedAddress';
import { displayAddressLabel } from '@/utils/savedAddressValidation';
import { formatSavedAddressLines } from '@/utils/savedAddressMapping';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const labelIcon: Record<AddressLabel, AppIconName> = {
  Home: 'home',
  Work: 'briefcase',
  Other: 'stores',
};

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
  const { beginAddressBookPick } = useDeliveryLocation();
  const [pendingDelete, setPendingDelete] = useState<SavedAddress | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function openAddAddress() {
    beginAddressBookPick({
      selectMode,
      returnTo: selectMode ? '/cart' : '/addresses',
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
        router.replace('/cart');
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
    <View style={styles.screen}>
      <AppScreenHeader
        title={selectMode ? 'Select address' : 'Saved Addresses'}
        fallbackHref={profileRoutes.profile}
      />
      <Text style={styles.count}>
        {selectMode
          ? 'Choose where this order should be delivered'
          : addresses.length === 1
            ? '1 saved address'
            : `${addresses.length} saved addresses`}
      </Text>

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
              <View style={styles.emptyAction}>
                <PrimaryButton label="Add Address" accessibilityLabel="Add Address" onPress={openAddAddress} />
              </View>
            }
          />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom, 24) + 72 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AddressCard
              address={item}
              busy={busyId === item.id}
              selectMode={selectMode}
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
          <PrimaryButton
            label="Add new address"
            accessibilityLabel="Add new address"
            onPress={openAddAddress}
          />
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

function AddressCard({
  address,
  busy,
  selectMode,
  onSelect,
  onEdit,
  onDefault,
  onDelete,
}: {
  address: SavedAddress;
  busy: boolean;
  selectMode: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDefault: () => void;
  onDelete: () => void;
}) {
  const title = displayAddressLabel(address);
  return (
    <View style={[styles.card, address.isDefault && styles.cardDefault]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${formatSavedAddressLines(address)}`}
        disabled={busy}
        onPress={onSelect}
        style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}>
        <View style={styles.iconWrap}>
          <AppIcon name={labelIcon[address.label]} color={colors.primaryInk} size={20} />
        </View>
        <View style={styles.cardCopy}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {title}
            </Text>
            {address.isDefault ? (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeLabel}>DEFAULT</Text>
              </View>
            ) : null}
          </View>
          <Text numberOfLines={3} style={styles.cardBody}>
            {formatSavedAddressLines(address)}
          </Text>
          {address.instructions ? (
            <Text numberOfLines={2} style={styles.cardHint}>
              Note: {address.instructions}
            </Text>
          ) : null}
          {selectMode ? (
            <Text style={styles.selectHint}>{busy ? 'Working…' : 'Tap to deliver here'}</Text>
          ) : null}
        </View>
      </Pressable>
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
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: 2,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  notice: {
    marginTop: space.sm,
    marginHorizontal: space.lg,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryInk,
  },
  list: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.md,
    width: '100%',
    maxWidth: homeLayout.maxWidth,
    alignSelf: 'center',
  },
  card: {
    borderRadius: radii.md,
    backgroundColor: colors.white,
    padding: space.md,
    gap: space.md,
    ...shadow.card,
  },
  cardDefault: {
    backgroundColor: colors.cream,
  },
  cardMain: {
    flexDirection: 'row',
    gap: space.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: space.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  cardTitle: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 19,
    color: colors.text,
  },
  defaultBadge: {
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  defaultBadgeLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.text,
  },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  cardHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.md,
  },
  selectHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primaryInk,
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
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAction: {
    width: '100%',
    maxWidth: 320,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
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
