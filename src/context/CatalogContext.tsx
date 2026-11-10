import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { LIVE_CATALOGUE_CONNECTED, PRODUCTS_COMPANY } from '@/constants/liveData';
import { findDemoProduct } from '@/data/findDemoProduct';
import { listCatalogProducts } from '@/data/listCatalogProducts';
import { listShopShelves, relatedCatalogProducts, type ShopShelf } from '@/data/shopCatalog';
import { fetchProducts } from '@/services/productsApi';
import type { DemoProduct } from '@/types/catalog';
import {
  liveShelfIdForCategory,
  liveShelfIdForSubcategory,
  titleCaseCategory,
} from '@/utils/liveCatalogMeta';

type CatalogState =
  | { status: 'local' }
  | { status: 'loading' }
  | { status: 'ready'; products: DemoProduct[] }
  | { status: 'refreshing'; products: DemoProduct[] }
  | { status: 'error'; message: string; products: DemoProduct[] };

type CatalogContextValue = {
  /** True when EXPO_PUBLIC_PRODUCTS_COMPANY is set. */
  liveEnabled: boolean;
  hydrated: boolean;
  /** First live fetch in progress (no products yet). */
  initialLoading: boolean;
  /** Pull/background refresh while previous products stay visible. */
  refreshing: boolean;
  state: CatalogState;
  /**
   * Live products when the API succeeded (or last good cache during refresh/error).
   * Empty only on first load / hard empty — never silently swapped for mocks in live mode.
   * Demo fixtures only when live catalogue is not configured.
   */
  products: DemoProduct[];
  message: string | null;
  refresh: () => Promise<void>;
  findProduct: (id: string) => DemoProduct | undefined;
  listShelves: (requestedId?: string) => ShopShelf[];
  relatedProducts: (
    productId: string,
    limit?: number,
  ) => { shelfId: string | null; shelfName: string | null; products: DemoProduct[] };
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

const LIVE_SHELF_ID = 'live-catalogue';

function productsFromState(state: CatalogState): DemoProduct[] {
  if (state.status === 'ready' || state.status === 'refreshing') {
    return state.products;
  }
  if (state.status === 'error') {
    return state.products;
  }
  return [];
}

function buildLiveShelves(products: DemoProduct[], requestedId?: string): ShopShelf[] {
  // Prefer SubCategory shelves when present; otherwise one shelf per Category.
  const byShelf = new Map<string, { name: string; products: DemoProduct[] }>();
  for (const product of products) {
    const category = product.category?.trim();
    const subcategory = product.subcategory?.trim();
    let id: string;
    let name: string;
    if (category && subcategory) {
      id = liveShelfIdForSubcategory(category, subcategory);
      name = titleCaseCategory(subcategory);
    } else if (category) {
      id = liveShelfIdForCategory(category);
      name = titleCaseCategory(category);
    } else {
      id = LIVE_SHELF_ID;
      name = 'All products';
    }
    const list = byShelf.get(id);
    if (list) {
      list.products.push(product);
    } else {
      byShelf.set(id, { name, products: [product] });
    }
  }

  // Also keep parent-category shelves so /shop?category=live-parent still works
  // when the user opens a parent that has real subcategories.
  for (const product of products) {
    const category = product.category?.trim();
    if (!category || !product.subcategory?.trim()) {
      continue;
    }
    const parentId = liveShelfIdForCategory(category);
    const list = byShelf.get(parentId);
    if (list) {
      if (!list.products.some((row) => row.id === product.id)) {
        list.products.push(product);
      }
    } else {
      byShelf.set(parentId, { name: titleCaseCategory(category), products: [product] });
    }
  }

  const shelves: ShopShelf[] = [];
  for (const [id, shelf] of byShelf) {
    shelves.push({
      id,
      name: shelf.name,
      image: shelf.products[0]?.image ?? { uri: '' },
      products: shelf.products,
    });
  }
  shelves.sort((a, b) => a.name.localeCompare(b.name));

  if (requestedId) {
    const match = shelves.find((shelf) => shelf.id === requestedId);
    if (match) {
      return [match, ...shelves.filter((shelf) => shelf.id !== requestedId)];
    }
  }
  return shelves;
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const liveEnabled = LIVE_CATALOGUE_CONNECTED;
  const [state, setState] = useState<CatalogState>(liveEnabled ? { status: 'loading' } : { status: 'local' });
  const [hydrated, setHydrated] = useState(!liveEnabled);
  const requestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!LIVE_CATALOGUE_CONNECTED) {
      setState({ status: 'local' });
      setHydrated(true);
      return;
    }

    // Latest-request-wins: cancel any in-flight catalogue download.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const id = ++requestId.current;

    setState((prev) => {
      const cached = productsFromState(prev);
      if (cached.length > 0) {
        // Never clear cards while refresh runs.
        return { status: 'refreshing', products: cached };
      }
      return { status: 'loading' };
    });

    const result = await fetchProducts(PRODUCTS_COMPANY, {
      signal: controller.signal,
      force: true,
    });

    if (id !== requestId.current || controller.signal.aborted) {
      return;
    }

    if (result.ok === false && result.cancelled) {
      return;
    }

    if (!result.ok) {
      // Keep last good catalogue; surface soft error for refresh / hard error for first load.
      setState((prev) => ({
        status: 'error',
        message: result.message,
        products: productsFromState(prev),
      }));
      setHydrated(true);
      return;
    }

    // Authoritative success only — replace catalogue (adds/removes/updates).
    setState({ status: 'ready', products: result.products });
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Mount bootstrap: load live catalogue once. refresh() owns request sequencing/abort.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial fetch
    void refresh();
    return () => {
      abortRef.current?.abort();
    };
  }, [refresh]);

  const value = useMemo<CatalogContextValue>(() => {
    const liveProducts = productsFromState(state);
    const products = liveEnabled ? liveProducts : listCatalogProducts();
    const hasLiveProducts = liveProducts.length > 0;

    return {
      liveEnabled,
      hydrated,
      initialLoading: liveEnabled && state.status === 'loading',
      refreshing: state.status === 'refreshing',
      state,
      products,
      message: state.status === 'error' ? state.message : null,
      refresh,
      findProduct: (id) => {
        if (liveEnabled) {
          return liveProducts.find((product) => product.id === id);
        }
        return findDemoProduct(id);
      },
      listShelves: (requestedId) => {
        if (liveEnabled) {
          return hasLiveProducts ? buildLiveShelves(liveProducts, requestedId) : [];
        }
        return listShopShelves(requestedId);
      },
      relatedProducts: (productId, limit = 4) => {
        if (liveEnabled) {
          const current = liveProducts.find((product) => product.id === productId);
          const sameCategory = current?.category
            ? liveProducts.filter(
                (product) => product.id !== productId && product.category === current.category,
              )
            : [];
          const related =
            sameCategory.length > 0
              ? sameCategory.slice(0, limit)
              : liveProducts.filter((product) => product.id !== productId).slice(0, limit);
          const shelfName = current?.category ?? 'All products';
          const shelfId = current?.category ? liveShelfIdForCategory(current.category) : LIVE_SHELF_ID;
          return { shelfId, shelfName, products: related };
        }
        return relatedCatalogProducts(productId, limit);
      },
    };
  }, [hydrated, liveEnabled, refresh, state]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const value = useContext(CatalogContext);
  if (!value) {
    throw new Error('useCatalog must be used within CatalogProvider');
  }
  return value;
}
