import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type SelectedHomeCategory = {
  id: string;
  name: string;
};

type HomeCatalogBrowseValue = {
  /** Selected main category (`live-…` id + display name). */
  selectedCategory: SelectedHomeCategory | null;
  selectCategory: (category: SelectedHomeCategory) => void;
  clearCategory: () => void;
};

const HomeCatalogBrowseContext = createContext<HomeCatalogBrowseValue | null>(null);

/** Home-only main category → subcategory browse. Does not invent ERP data. */
export function HomeCatalogBrowseProvider({ children }: { children: ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState<SelectedHomeCategory | null>(null);

  const selectCategory = useCallback((category: SelectedHomeCategory) => {
    setSelectedCategory((current) => {
      if (current?.id === category.id) {
        return current;
      }
      return category;
    });
  }, []);

  const clearCategory = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  const value = useMemo(
    () => ({
      selectedCategory,
      selectCategory,
      clearCategory,
    }),
    [clearCategory, selectCategory, selectedCategory],
  );

  return <HomeCatalogBrowseContext.Provider value={value}>{children}</HomeCatalogBrowseContext.Provider>;
}

export function useHomeCatalogBrowse(): HomeCatalogBrowseValue {
  const value = useContext(HomeCatalogBrowseContext);
  if (!value) {
    throw new Error('useHomeCatalogBrowse must be used within HomeCatalogBrowseProvider');
  }
  return value;
}

export function useOptionalHomeCatalogBrowse(): HomeCatalogBrowseValue | null {
  return useContext(HomeCatalogBrowseContext);
}
