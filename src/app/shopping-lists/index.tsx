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
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts, homeLayout, radii, space } from '@/constants/theme';
import { useShoppingLists } from '@/context/ShoppingListsContext';
import { profileRoutes } from '@/navigation/profileRoutes';

export default function ShoppingListsScreen() {
  const insets = useSafeAreaInsets();
  const { hydrated, lists, createList, deleteList } = useShoppingLists();
  const [draftName, setDraftName] = useState('');

  function onCreate() {
    const list = createList(draftName);
    if (!list) {
      Alert.alert('Could not create list', 'Enter a name, or remove an old list if you hit the limit.');
      return;
    }
    setDraftName('');
    router.push({ pathname: '/shopping-lists/[id]', params: { id: list.id } });
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert('Delete list?', `Remove “${name}” and all its items from this device.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteList(id),
      },
    ]);
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
      <AppScreenHeader title="Shopping lists" />
      <View style={styles.createRow}>
        <TextInput
          value={draftName}
          onChangeText={setDraftName}
          placeholder="New list name"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          maxLength={60}
          accessibilityLabel="New shopping list name"
          onSubmitEditing={onCreate}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create shopping list"
          onPress={onCreate}
          style={({ pressed }) => [styles.createBtn, pressed && styles.pressed]}>
          <Text style={styles.createLabel}>Add</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>Lists stay on this device. Guest and signed-in accounts stay separate.</Text>

      {lists.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <EmptyState
            title="No shopping lists yet"
            body="Create a named list for groceries you want to remember offline."
            art={
              <View style={styles.emptyIcon}>
                <AppIcon name="bag" color={colors.primaryInk} size={32} />
              </View>
            }
            action={
              <PrimaryButton label="Go to Shop" onPress={() => router.push('/shop')} accessibilityLabel="Go to Shop" />
            }
          />
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24), paddingHorizontal: homeLayout.gutter }}
          renderItem={({ item }) => {
            const open = item.items.filter((row) => !row.completed).length;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open list ${item.name}`}
                onPress={() => router.push({ pathname: '/shopping-lists/[id]', params: { id: item.id } })}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardMeta}>
                    {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
                    {open > 0 ? ` · ${open} open` : ''}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete list ${item.name}`}
                  hitSlop={8}
                  onPress={() => confirmDelete(item.id, item.name)}
                  style={styles.deleteBtn}>
                  <AppIcon name="close" color={colors.danger} size={18} />
                </Pressable>
              </Pressable>
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
  createRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: homeLayout.gutter,
    paddingTop: space.md,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  createBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primaryInk },
  hint: {
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: homeLayout.gutter,
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
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  cardMeta: { marginTop: 2, fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  deleteBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backLink: { alignItems: 'center', paddingVertical: 12 },
  backLinkLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  pressed: { opacity: 0.75 },
});
