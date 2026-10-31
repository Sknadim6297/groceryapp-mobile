import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { CustomerOrder } from '@/types/order';

export type SimulatedOrder = CustomerOrder & {
  total: number;
  paymentLabel: string;
};

type PreviewSessionValue = {
  orders: SimulatedOrder[];
  couponId: string | null;
  setCouponId: (id: string | null) => void;
  placeOrder: (order: SimulatedOrder) => void;
};

const PreviewSessionContext = createContext<PreviewSessionValue | null>(null);

export function PreviewSessionProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<SimulatedOrder[]>([]);
  const [couponId, setCouponId] = useState<string | null>(null);
  const value = useMemo(
    () => ({
      orders,
      couponId,
      setCouponId,
      placeOrder: (order: SimulatedOrder) => {
        setOrders((current) => [order, ...current]);
        setCouponId(null);
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
