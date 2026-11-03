import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { UI_PREVIEW_MODE } from '@/constants/preview';
import { DEMO_SEED_ORDERS } from '@/data/demoOrders';
import type { SimulatedOrder } from '@/types/order';

export type { SimulatedOrder };

type PreviewSessionValue = {
  orders: SimulatedOrder[];
  couponId: string | null;
  setCouponId: (id: string | null) => void;
  placeOrder: (order: SimulatedOrder) => void;
  findOrder: (id: string | undefined | null) => SimulatedOrder | null;
};

const PreviewSessionContext = createContext<PreviewSessionValue | null>(null);

export function PreviewSessionProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<SimulatedOrder[]>(() =>
    UI_PREVIEW_MODE ? DEMO_SEED_ORDERS.map((order) => ({ ...order, items: [...order.items] })) : [],
  );
  const [couponId, setCouponId] = useState<string | null>(null);

  const value = useMemo<PreviewSessionValue>(
    () => ({
      orders,
      couponId,
      setCouponId,
      placeOrder: (order) => {
        if (!UI_PREVIEW_MODE) {
          return;
        }
        setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)]);
        setCouponId(null);
      },
      findOrder: (id) => {
        if (!id) {
          return null;
        }
        return orders.find((order) => order.id === id) ?? null;
      },
    }),
    [couponId, orders],
  );

  return <PreviewSessionContext.Provider value={value}>{children}</PreviewSessionContext.Provider>;
}

export function usePreviewSession(): PreviewSessionValue {
  const value = useContext(PreviewSessionContext);
  if (!value) {
    throw new Error('usePreviewSession must be used within PreviewSessionProvider');
  }
  return value;
}
