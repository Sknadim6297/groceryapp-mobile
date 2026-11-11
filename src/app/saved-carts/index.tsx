import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { useToast } from '@/components/ui/AppToast';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts, homeLayout, radii, space } from '@/constants/theme';
import { useCatalog } from '@/context/CatalogContext';
import { useMockCart } from '@/context/MockCartContext';
import { useSavedCarts } from '@/context/SavedCartsContext';
import { profileRoutes } from '@/navigation/profileRoutes';
import type { SavedCart } from '@/types/savedCart';
import { revalidateSavedCartQuantities } from '@/utils/revalidateSavedCart';

export default function SavedCartsScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { findProduct } = useCatalog();
  const { quantities, totalCount, clearCart, setQuantity } = useMockCart();
  const { hydrated, carts, renameSavedCart, deleteSavedCart } = useSavedCarts();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  function confirmDelete(cart: SavedCart) {
    Alert.alert('Delete saved cart?', `Remove “${cart.name}” from this device.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSavedCart(cart.id) },
    ]);
  }

  function applyRestore(cart: SavedCart) {
    const result = revalidateSavedCartQuantities(cart.quantities, findProduct);
    const restoredCount = Object.keys(result.quantities).length;
    if (restoredCount === 0) {
      showToast(
        'error',
        'None of those products are available in the current catalogue. Saved prices/stock were not reused.',
      );
      return;
    }
    clearCart();
    for (const [id, qty] of Object.entries(result.quantities)) {
      setQuantity(id, qty);
    }
    const skipped = result.missingIds.length + result.outOfStockIds.length;
    showToast(
      'success',
      skipped > 0
        ? `Restored ${restoredCount} available item(s). ${skipped} unavailable/out-of-stock skipped.`
        : `Restored ${restoredCount} item(s) into your cart.`,
    );
    router.push('/cart');
  }

  function restoreCart(cart: SavedCart) {
    if (totalCount > 0 || Object.keys(quantities).length > 0) {
      Alert.alert(
        'Replace current cart?',
        'Restoring this saved cart will replace the items currently in your cart on this device.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace cart', style: 'destructive', onPress: () => applyRestore(cart) },
        ],
      );
      return;
    }
    applyRestore(cart);
  }

  function startRename(cart: SavedCart) {
    setRenamingId(cart.id);
    setRenameDraft(cart.name);
  }

  function commitRename() {
    if (!renamingId) {
      return;
    }
    renameSavedCart(renamingId, renameDraft);
    setRenamingId(null);
    setRenameDraft('');
  }

  if (!hydrated) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.primaryInk} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Saved carts" />
      <Text style={styles.hint}>
        Snapshots store product quantities only. Prices and stock are rechecked against the catalogue when you
        restore.
      </Text>

      {carts.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <EmptyState
            title="No saved carts yet"
            body="Save your current cart from Review Cart with a custom name."
            art={
              <View style={styles.emptyIcon}>
                <AppIcon name="bag" color={colors.primaryInk} size={32} />
              </View>
            }
            action={
              <PrimaryButton
                label="Open cart"
                accessibilityLabel="Open cart"
                onPress={() => router.push('/cart')}
              />
            }
          />
        </View>
      ) : (
        <FlatList
          data={carts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: homeLayout.gutter,
            paddingBottom: Math.max(insets.bottom, 24),
          }}
          renderItem={({ item }) => {
            const count = Object.values(item.quantities).reduce((sum, qty) => sum + qty, 0);
            const renaming = renamingId === item.id;
            return (
              <View style={styles.card}>
                {renaming ? (
                  <TextInput
                    value={renameDraft}
                    onChangeText={setRenameDraft}
                    onEndEditing={commitRename}
                    onSubmitEditing={commitRename}
                    autoFocus
                    maxLength={60}
                    style={styles.renameInput}
                    accessibilityLabel="Rename saved cart"
                  />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Restore saved cart ${item.name}`}
                    onPress={() => restoreCart(item)}
                    style={styles.cardMain}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardMeta}>
                      {count} {count === 1 ? 'item' : 'items'} · saved locally
                    </Text>
                  </Pressable>
                )}
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Rename ${item.name}`}
                    hitSlop={8}
                    onPress={() => (renaming ? commitRename() : startRename(item))}
                    style={styles.iconBtn}>
                    <AppIcon name="pencil" color={colors.primaryInk} size={18} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.name}`}
                    hitSlop={8}
                    onPress={() => confirmDelete(item)}
                    style={styles.iconBtn}>
                    <AppIcon name="close" color={colors.danger} size={18} />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push(profileRoutes.profile)}
        style={styles.backLink}>
        <Text style={styles.backLinkLabel}>Back to profile</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.softBackground },
  centered: { alignItems: 'center', justifyContent: 'center' },
  hint: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: space.md,
    paddingBottom: space.sm,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  empty: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardMain: { flex: 1, minWidth: 0 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  cardMeta: { marginTop: 2, fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  renameInput: {
    flex: 1,
    minHeight: 40,
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
    padding: 0,
  },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backLink: { alignItems: 'center', paddingVertical: 12 },
  backLinkLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
});
