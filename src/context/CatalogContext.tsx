import type { ImageSource } from "expo-image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  LIVE_CATALOGUE_CONNECTED,
  PRODUCTS_COMPANY,
} from "@/constants/liveData";
import { findDemoProduct } from "@/data/findDemoProduct";
import { listCatalogProducts } from "@/data/listCatalogProducts";
import {
  listShopShelves,
  relatedCatalogProducts,
  type ShopShelf,
} from "@/data/shopCatalog";
import {
  fetchCategories,
  fetchProductImages,
  fetchSubcategories,
  type LiveCategoryRecord,
  type LiveSubcategoryRecord,
} from "@/services/catalogMetaApi";
import { fetchProducts } from "@/services/productsApi";
import type { DemoProduct } from "@/types/catalog";
import {
  liveShelfIdForCategory,
  liveShelfIdForSubcategory,
  titleCaseCategory,
} from "@/utils/liveCatalogMeta";
import { recyclingKeyForImageUri } from "@/utils/productImageSource";

type CatalogState =
  | { status: "local" }
  | { status: "loading" }
  | { status: "ready"; products: DemoProduct[] }
  | { status: "refreshing"; products: DemoProduct[] }
  | { status: "error"; message: string; products: DemoProduct[] };

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
  /** Categories from GET /api/values/categories (names; images only when small enough). */
  remoteCategories: LiveCategoryRecord[];
  message: string | null;
  refresh: () => Promise<void>;
  findProduct: (id: string) => DemoProduct | undefined;
  listShelves: (requestedId?: string) => ShopShelf[];
  relatedProducts: (
    productId: string,
    limit?: number,
  ) => {
    shelfId: string | null;
    shelfName: string | null;
    products: DemoProduct[];
  };
  /** Lazy GET productimages — merges Image2–4 into catalogue product.images. */
  loadProductGalleryImages: (productId: string) => Promise<ImageSource[]>;
  /** Lazy GET subcategories?category= — for category drill-down. */
  loadSubcategories: (categoryName: string) => Promise<LiveSubcategoryRecord[]>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

const LIVE_SHELF_ID = "live-catalogue";

function productsFromState(state: CatalogState): DemoProduct[] {
  if (state.status === "ready" || state.status === "refreshing") {
    return state.products;
  }
  if (state.status === "error") {
    return state.products;
  }
  return [];
}

function imageKey(source: ImageSource): string | null {
  if (
    typeof source !== "object" ||
    source == null ||
    !("uri" in source) ||
    typeof source.uri !== "string"
  ) {
    return null;
  }
  if (source.uri.trim().length === 0) {
    return null;
  }
  return typeof source.cacheKey === "string" && source.cacheKey.length > 0
    ? source.cacheKey
    : recyclingKeyForImageUri(source.uri);
}

function mergeGalleryImages(
  primary: ImageSource,
  extras: ImageSource[],
): ImageSource[] {
  const out: ImageSource[] = [];
  const seen = new Set<string>();
  for (const source of [primary, ...extras]) {
    const key = imageKey(source);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(source);
  }
  return out.length > 0 ? out : [primary];
}

function buildLiveShelves(
  products: DemoProduct[],
  requestedId?: string,
): ShopShelf[] {
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
      name = "All products";
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
      byShelf.set(parentId, {
        name: titleCaseCategory(category),
        products: [product],
      });
    }
  }

  const shelves: ShopShelf[] = [];
  for (const [id, shelf] of byShelf) {
    shelves.push({
      id,
      name: shelf.name,
      image: shelf.products[0]?.image ?? { uri: "" },
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
  const [state, setState] = useState<CatalogState>(
    liveEnabled ? { status: "loading" } : { status: "local" },
  );
  const [hydrated, setHydrated] = useState(!liveEnabled);
  const [remoteCategories, setRemoteCategories] = useState<
    LiveCategoryRecord[]
  >([]);
  const requestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const galleryInFlight = useRef(new Map<string, Promise<ImageSource[]>>());
  const subcategoryCache = useRef(new Map<string, LiveSubcategoryRecord[]>());
  const subcategoryInFlight = useRef(new Map<string, Promise<LiveSubcategoryRecord[]>>());

  const refresh = useCallback(async () => {
    if (!LIVE_CATALOGUE_CONNECTED) {
      setState({ status: "local" });
      setRemoteCategories([]);
      setHydrated(true);
      return;
    }

    // Latest-request-wins: cancel any in-flight catalogue download.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const id = ++requestId.current;
    galleryInFlight.current.clear();
    subcategoryCache.current.clear();
    subcategoryInFlight.current.clear();

    setState((prev) => {
      const cached = productsFromState(prev);
      if (cached.length > 0) {
        // Never clear cards while refresh runs.
        return { status: "refreshing", products: cached };
      }
      return { status: "loading" };
    });

    // Fast path: products list (Image1 only). Categories load in background.
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
      setState((prev) => ({
        status: "error",
        message: result.message,
        products: productsFromState(prev),
      }));
      setHydrated(true);
      return;
    }

    setState({ status: "ready", products: result.products });
    setHydrated(true);

    void fetchCategories(PRODUCTS_COMPANY, { signal: controller.signal }).then(
      (categoriesResult) => {
        if (id !== requestId.current || controller.signal.aborted) {
          return;
        }
        if (categoriesResult.ok) {
          setRemoteCategories(categoriesResult.categories);
        }
      },
    );
  }, []);

  const loadProductGalleryImages = useCallback(
    async (productId: string): Promise<ImageSource[]> => {
      const id = productId.trim();
      if (!LIVE_CATALOGUE_CONNECTED || !id) {
        return [];
      }
      const existing = galleryInFlight.current.get(id);
      if (existing) {
        return existing;
      }

      const promise = (async () => {
        const result = await fetchProductImages(id, PRODUCTS_COMPANY);
        if (!result.ok) {
          return [];
        }
        setState((prev) => {
          const current = productsFromState(prev);
          if (current.length === 0) {
            return prev;
          }
          let changed = false;
          const products = current.map((product) => {
            if (product.id !== id) {
              return product;
            }
            const merged = mergeGalleryImages(product.image, result.images);
            if (merged.length === product.images.length) {
              return product;
            }
            changed = true;
            return { ...product, images: merged };
          });
          if (!changed) {
            return prev;
          }
          if (prev.status === "ready" || prev.status === "refreshing") {
            return { ...prev, products };
          }
          if (prev.status === "error") {
            return { ...prev, products };
          }
          return prev;
        });
        return result.images;
      })().finally(() => {
        galleryInFlight.current.delete(id);
      });

      galleryInFlight.current.set(id, promise);
      return promise;
    },
    [],
  );

  const loadSubcategories = useCallback(
    async (categoryName: string): Promise<LiveSubcategoryRecord[]> => {
      const name = categoryName.trim();
      if (!LIVE_CATALOGUE_CONNECTED || !name) {
        return [];
      }
      const cacheKey = name.toLowerCase();
      const cached = subcategoryCache.current.get(cacheKey);
      if (cached) {
        return cached;
      }
      const inFlight = subcategoryInFlight.current.get(cacheKey);
      if (inFlight) {
        return inFlight;
      }
      const promise = (async () => {
        const result = await fetchSubcategories(name, PRODUCTS_COMPANY);
        if (!result.ok) {
          // Do not cache transport/API failures so a later tap can retry.
          return [];
        }
        subcategoryCache.current.set(cacheKey, result.subcategories);
        return result.subcategories;
      })().finally(() => {
        subcategoryInFlight.current.delete(cacheKey);
      });
      subcategoryInFlight.current.set(cacheKey, promise);
      return promise;
    },
    [],
  );

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
      initialLoading: liveEnabled && state.status === "loading",
      refreshing: state.status === "refreshing",
      state,
      products,
      remoteCategories: liveEnabled ? remoteCategories : [],
      message: state.status === "error" ? state.message : null,
      refresh,
      loadProductGalleryImages,
      loadSubcategories,
      findProduct: (id) => {
        if (liveEnabled) {
          return liveProducts.find((product) => product.id === id);
        }
        return findDemoProduct(id);
      },
      listShelves: (requestedId) => {
        if (liveEnabled) {
          return hasLiveProducts
            ? buildLiveShelves(liveProducts, requestedId)
            : [];
        }
        return listShopShelves(requestedId);
      },
      relatedProducts: (productId, limit = 4) => {
        if (liveEnabled) {
          const current = liveProducts.find(
            (product) => product.id === productId,
          );
          const sameCategory = current?.category
            ? liveProducts.filter(
                (product) =>
                  product.id !== productId &&
                  product.category === current.category,
              )
            : [];
          const related =
            sameCategory.length > 0
              ? sameCategory.slice(0, limit)
              : liveProducts
                  .filter((product) => product.id !== productId)
                  .slice(0, limit);
          const shelfName = current?.category ?? "All products";
          const shelfId = current?.category
            ? liveShelfIdForCategory(current.category)
            : LIVE_SHELF_ID;
          return { shelfId, shelfName, products: related };
        }
        return relatedCatalogProducts(productId, limit);
      },
    };
  }, [
    hydrated,
    liveEnabled,
    loadProductGalleryImages,
    loadSubcategories,
    refresh,
    remoteCategories,
    state,
  ]);

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const value = useContext(CatalogContext);
  if (!value) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return value;
}
