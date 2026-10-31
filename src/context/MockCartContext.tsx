import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type MockCartContextValue = {
  quantities: Record<string, number>;
  totalCount: number;
  leaveAtDoor: boolean;
  add: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setLeaveAtDoor: (value: boolean) => void;
};

const MockCartContext = createContext<MockCartContextValue | null>(null);

export function MockCartProvider({ children }: { children: ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const value = useMemo(() => {
    const totalCount = Object.values(quantities).reduce((sum, count) => sum + count, 0);

    return {
      quantities,
      totalCount,
      leaveAtDoor,
      add: (productId: string) => {
        setQuantities((current) => ({
          ...current,
          [productId]: (current[productId] ?? 0) + 1,
        }));
      },
      setQuantity: (productId: string, quantity: number) => {
        setQuantities((current) => {
          const next = { ...current };
          if (quantity <= 0) {
            delete next[productId];
          } else {
            next[productId] = quantity;
          }
          return next;
        });
      },
      setLeaveAtDoor,
    };
  }, [leaveAtDoor, quantities]);

  return <MockCartContext.Provider value={value}>{children}</MockCartContext.Provider>;
}

export function useMockCart(): MockCartContextValue {
  const value = useContext(MockCartContext);

  if (!value) {
    throw new Error('useMockCart must be used within MockCartProvider');
  }

  return value;
}
