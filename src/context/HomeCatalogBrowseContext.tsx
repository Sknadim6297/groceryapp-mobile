import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type HomeCatalogBrowseValue = {
  /** Selected backend Field id (`live-…`). Null = show all Fields’ Categories. */
  selectedFieldId: string | null;
  selectField: (fieldId: string | null) => void;
};

const HomeCatalogBrowseContext = createContext<HomeCatalogBrowseValue | null>(null);

/** Home-only Field → Category browse filter. Does not touch ERP data. */
export function HomeCatalogBrowseProvider({ children }: { children: ReactNode }) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const selectField = useCallback((fieldId: string | null) => {
    setSelectedFieldId((current) => {
      if (fieldId == null) {
        return null;
      }
      // Tap again clears the filter (show all Categories).
      return current === fieldId ? null : fieldId;
    });
  }, []);

  const value = useMemo(
    () => ({
      selectedFieldId,
      selectField,
    }),
    [selectField, selectedFieldId],
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
