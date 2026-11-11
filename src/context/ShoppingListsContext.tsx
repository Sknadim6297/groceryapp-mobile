import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useAuthSession } from '@/context/AuthSessionContext';
import { isDevOtpEnabled } from '@/services/devOtp';
import {
  activateDeviceShoppingListStore,
  createShoppingListId,
  createShoppingListItemId,
  loadShoppingLists,
  MAX_LIST_ITEMS,
  MAX_SHOPPING_LISTS,
  saveShoppingLists,
  shoppingListOwnerKey,
} from '@/services/shoppingListStore';
import type { ShoppingList, ShoppingListItem } from '@/types/shoppingList';

type ShoppingListsContextValue = {
  hydrated: boolean;
  lists: ShoppingList[];
  getList: (id: string) => ShoppingList | null;
  createList: (name: string) => ShoppingList | null;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  addItem: (listId: string, name: string, quantity?: number, matchedProductId?: string | null) => ShoppingListItem | null;
  updateItem: (
    listId: string,
    itemId: string,
    patch: Partial<Pick<ShoppingListItem, 'name' | 'quantity' | 'completed' | 'matchedProductId'>>,
  ) => void;
  removeItem: (listId: string, itemId: string) => void;
};

const ShoppingListsContext = createContext<ShoppingListsContextValue | null>(null);

function touch(list: ShoppingList): ShoppingList {
  return { ...list, updatedAt: Date.now() };
}

export function ShoppingListsProvider({ children }: { children: ReactNode }) {
  const { hydrated: authHydrated, session, devSession } = useAuthSession();
  const [hydrated, setHydrated] = useState(false);
  const [ownerKey, setOwnerKey] = useState<string | null>(null);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const persistReady = useRef(false);

  const resolveOwner = useCallback(() => {
    if (session) {
      return shoppingListOwnerKey({ kind: 'temporary-ui', mobile: session.mobile });
    }
    if (isDevOtpEnabled() && devSession) {
      return shoppingListOwnerKey({ kind: 'development-test', mobile: devSession.mobile });
    }
    return shoppingListOwnerKey(null);
  }, [devSession, session]);

  useEffect(() => {
    if (!authHydrated) {
      return;
    }
    let cancelled = false;
    void (async () => {
      persistReady.current = false;
      if (Platform.OS !== 'web') {
        await activateDeviceShoppingListStore();
      }
      const nextOwner = resolveOwner();
      const loaded = await loadShoppingLists(nextOwner);
      if (cancelled) {
        return;
      }
      setOwnerKey(nextOwner);
      setLists(loaded);
      persistReady.current = true;
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authHydrated, resolveOwner]);

  useEffect(() => {
    if (!hydrated || !persistReady.current || !ownerKey) {
      return;
    }
    void saveShoppingLists(ownerKey, lists);
  }, [hydrated, lists, ownerKey]);

  const getList = useCallback((id: string) => lists.find((list) => list.id === id) ?? null, [lists]);

  const createList = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return null;
    }
    let created: ShoppingList | null = null;
    setLists((current) => {
      if (current.length >= MAX_SHOPPING_LISTS) {
        return current;
      }
      created = {
        id: createShoppingListId(),
        name: trimmed.slice(0, 60),
        items: [],
        updatedAt: Date.now(),
      };
      return [created, ...current];
    });
    return created;
  }, []);

  const renameList = useCallback((id: string, name: string) => {
    const trimmed = name.trim().slice(0, 60);
    if (!trimmed) {
      return;
    }
    setLists((current) =>
      current.map((list) => (list.id === id ? touch({ ...list, name: trimmed }) : list)),
    );
  }, []);

  const deleteList = useCallback((id: string) => {
    setLists((current) => current.filter((list) => list.id !== id));
  }, []);

  const addItem = useCallback(
    (listId: string, name: string, quantity = 1, matchedProductId: string | null = null) => {
      const trimmed = name.trim().slice(0, 80);
      if (!trimmed) {
        return null;
      }
      let created: ShoppingListItem | null = null;
      setLists((current) =>
        current.map((list) => {
          if (list.id !== listId || list.items.length >= MAX_LIST_ITEMS) {
            return list;
          }
          created = {
            id: createShoppingListItemId(),
            name: trimmed,
            quantity: Math.min(99, Math.max(1, Math.floor(quantity))),
            completed: false,
            matchedProductId: matchedProductId?.trim() || null,
          };
          return touch({ ...list, items: [...list.items, created] });
        }),
      );
      return created;
    },
    [],
  );

  const updateItem = useCallback(
    (
      listId: string,
      itemId: string,
      patch: Partial<Pick<ShoppingListItem, 'name' | 'quantity' | 'completed' | 'matchedProductId'>>,
    ) => {
      setLists((current) =>
        current.map((list) => {
          if (list.id !== listId) {
            return list;
          }
          return touch({
            ...list,
            items: list.items.map((item) => {
              if (item.id !== itemId) {
                return item;
              }
              const next = { ...item };
              if (patch.name != null) {
                const name = patch.name.trim().slice(0, 80);
                if (name) {
                  next.name = name;
                }
              }
              if (patch.quantity != null) {
                next.quantity = Math.min(99, Math.max(1, Math.floor(patch.quantity)));
              }
              if (patch.completed != null) {
                next.completed = patch.completed;
              }
              if (patch.matchedProductId !== undefined) {
                next.matchedProductId = patch.matchedProductId?.trim() || null;
              }
              return next;
            }),
          });
        }),
      );
    },
    [],
  );

  const removeItem = useCallback((listId: string, itemId: string) => {
    setLists((current) =>
      current.map((list) =>
        list.id === listId
          ? touch({ ...list, items: list.items.filter((item) => item.id !== itemId) })
          : list,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      lists,
      getList,
      createList,
      renameList,
      deleteList,
      addItem,
      updateItem,
      removeItem,
    }),
    [addItem, createList, deleteList, getList, hydrated, lists, removeItem, renameList, updateItem],
  );

  return <ShoppingListsContext.Provider value={value}>{children}</ShoppingListsContext.Provider>;
}

export function useShoppingLists(): ShoppingListsContextValue {
  const value = useContext(ShoppingListsContext);
  if (!value) {
    throw new Error('useShoppingLists must be used within ShoppingListsProvider');
  }
  return value;
}
