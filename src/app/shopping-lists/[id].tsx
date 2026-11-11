import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { colors, fonts, homeLayout, radii, space } from '@/constants/theme';
import { useCatalog } from '@/context/CatalogContext';
import { useMockCart } from '@/context/MockCartContext';
import { useShoppingLists } from '@/context/ShoppingListsContext';
import { isProductInStock } from '@/data/resolveWishlistProducts';
import { matchShoppingListItem } from '@/utils/matchShoppingListItem';
import { profileRoutes } from '@/navigation/profileRoutes';

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

export default function ShoppingListDetailScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const listId = firstParam(id);
  const { products, findProduct } = useCatalog();
  const { addToCart } = useMockCart();
  const { hydrated, getList, addItem, updateItem, removeItem, renameList, deleteList } = useShoppingLists();
  const list = getList(listId);
  const [draft, setDraft] = useState('');
  const [qtyDraft, setQtyDraft] = useState('1');

  const sortedItems = useMemo(() => {
    if (!list) {
      return [];
    }
    return [...list.items].sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [list]);

  if (!hydrated) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.primaryInk} />
      </View>
    );
  }

  if (!list) {
    return <Redirect href={profileRoutes.shoppingLists} />;
  }

  function onAdd() {
    const matched = matchShoppingListItem(draft, products);
    const qty = Math.min(99, Math.max(1, Math.floor(Number(qtyDraft) || 1)));
    const item = addItem(listId, draft, qty, matched?.id ?? null);
    if (!item) {
      showToast('error', 'Could not add item. Check the name or list size.');
      return;
    }
    setDraft('');
    setQtyDraft('1');
    if (matched) {
      showToast('success', `Matched catalogue: ${matched.name}`);
    } else {
      showToast('info', 'Saved as a custom item (no exact catalogue match).');
    }
  }

  function confirmRemoveItem(itemId: string, name: string) {
    Alert.alert('Remove item?', `Delete “${name}” from this list.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeItem(listId, itemId) },
    ]);
  }

  function confirmDeleteList() {
    const listName = list?.name ?? 'this list';
    Alert.alert('Delete list?', `Remove “${listName}” permanently from this device.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteList(listId);
          router.replace(profileRoutes.shoppingLists);
        },
      },
    ]);
  }

  function addMatchedToCart(productId: string, quantity: number, name: string) {
    const product = findProduct(productId);
    if (!product) {
      showToast('error', 'That catalogue product is no longer available.');
      return;
    }
    if (!isProductInStock(product)) {
      showToast('info', `${product.name} is out of stock in the catalogue.`);
      return;
    }
    addToCart(product.id, quantity);
    showToast('success', `Added ${quantity}× ${name} to cart`);
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title={list.name} />
      <View style={styles.toolbar}>
        <TextInput
          defaultValue={list.name}
          onEndEditing={(event) => renameList(listId, event.nativeEvent.text)}
          style={styles.rename}
          maxLength={60}
          accessibilityLabel="Rename shopping list"
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Delete list" onPress={confirmDeleteList}>
          <Text style={styles.deleteList}>Delete list</Text>
        </Pressable>
      </View>

      <View style={styles.addRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Item name"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.nameInput]}
          maxLength={80}
          accessibilityLabel="New item name"
        />
        <TextInput
          value={qtyDraft}
          onChangeText={setQtyDraft}
          keyboardType="number-pad"
          style={[styles.input, styles.qtyInput]}
          accessibilityLabel="Quantity"
          maxLength={2}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add item"
          onPress={onAdd}
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}>
          <AppIcon name="plus" color={colors.primaryInk} size={20} />
        </Pressable>
      </View>
      <Text style={styles.hint}>Exact catalogue name matches only — no automatic substitutions.</Text>

      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: homeLayout.gutter, paddingBottom: Math.max(insets.bottom, 24) }}
        ListEmptyComponent={<Text style={styles.empty}>No items yet. Add groceries above.</Text>}
        renderItem={({ item }) => {
          const matched = item.matchedProductId ? findProduct(item.matchedProductId) : null;
          const stillMatched = matched != null;
          return (
            <View style={[styles.item, item.completed && styles.itemDone]}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.completed }}
                accessibilityLabel={`Mark ${item.name} ${item.completed ? 'incomplete' : 'complete'}`}
                onPress={() => updateItem(listId, item.id, { completed: !item.completed })}
                style={styles.check}>
                <AppIcon
                  name={item.completed ? 'check' : 'plus'}
                  color={item.completed ? colors.success : colors.border}
                  size={18}
                />
              </Pressable>
              <View style={styles.itemBody}>
                <TextInput
                  defaultValue={item.name}
                  onEndEditing={(event) => {
                    const nextName = event.nativeEvent.text;
                    const rematch = matchShoppingListItem(nextName, products);
                    updateItem(listId, item.id, {
                      name: nextName,
                      matchedProductId: rematch?.id ?? null,
                    });
                  }}
                  style={[styles.itemName, item.completed && styles.itemNameDone]}
                  maxLength={80}
                />
                <Text style={styles.meta}>
                  Qty {item.quantity}
                  {stillMatched
                    ? ` · Matched: ${matched.name}`
                    : ' · Custom item (not in catalogue)'}
                </Text>
                <View style={styles.itemActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease ${item.name}`}
                    onPress={() => updateItem(listId, item.id, { quantity: item.quantity - 1 })}
                    style={styles.qtyBtn}>
                    <AppIcon name="minus" color={colors.text} size={16} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Increase ${item.name}`}
                    onPress={() => updateItem(listId, item.id, { quantity: item.quantity + 1 })}
                    style={styles.qtyBtn}>
                    <AppIcon name="plus" color={colors.text} size={16} />
                  </Pressable>
                  {stillMatched ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.name} to cart`}
                      onPress={() => addMatchedToCart(matched.id, item.quantity, item.name)}
                      style={styles.cartBtn}>
                      <Text style={styles.cartBtnLabel}>Add to cart</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name}`}
                    onPress={() => confirmRemoveItem(item.id, item.name)}>
                    <Text style={styles.remove}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.softBackground },
  centered: { alignItems: 'center', justifyContent: 'center' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: homeLayout.gutter,
    paddingTop: space.sm,
  },
  rename: {
    flex: 1,
    minHeight: 40,
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  deleteList: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: homeLayout.gutter,
    paddingTop: space.md,
  },
  input: {
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  nameInput: { flex: 1 },
  qtyInput: { width: 52, textAlign: 'center' },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    paddingHorizontal: homeLayout.gutter,
    paddingVertical: 8,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  item: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  itemDone: { opacity: 0.65 },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1, minWidth: 0 },
  itemName: { fontFamily: fonts.medium, fontSize: 15, color: colors.text, padding: 0 },
  itemNameDone: { textDecorationLine: 'line-through' },
  meta: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: {
    paddingHorizontal: 10,
    minHeight: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtnLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.primaryInk },
  remove: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger },
  pressed: { opacity: 0.75 },
});
