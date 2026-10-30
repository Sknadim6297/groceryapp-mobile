import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type MockCartContextValue = {
  totalCount: number;
  add: (productId: string) => void;
};

const MockCartContext = createContext<MockCartContextValue | null>(null);

export function MockCartProvider({ children }: { children: ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const value = useMemo(() => {
    const totalCount = Object.values(quantities).reduce((sum, count) => sum + count, 0);

    return {
      totalCount,
      add: (productId: string) => {
        setQuantities((current) => ({
          ...current,
          [productId]: (current[productId] ?? 0) + 1,
        }));
      },
    };
  }, [quantities]);

  return <MockCartContext.Provider value={value}>{children}</MockCartContext.Provider>;
}

export function useMockCart(): MockCartContextValue {
  const value = useContext(MockCartContext);

  if (!value) {
    throw new Error('useMockCart must be used within MockCartProvider');
  }

  return value;
}
