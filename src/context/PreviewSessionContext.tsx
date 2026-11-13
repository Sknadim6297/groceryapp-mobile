import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import { UI_PREVIEW_MODE } from "@/constants/preview";
import { DEMO_SEED_ORDERS } from "@/data/demoOrders";
import type { SimulatedOrder } from "@/types/order";
import { registerPreviewSessionReset } from "@/utils/clearPreviewAccountState";

export type { SimulatedOrder };

type PreviewSessionValue = {
  orders: SimulatedOrder[];
  couponId: string | null;
  setCouponId: (id: string | null) => void;
  placeOrder: (order: SimulatedOrder) => void;
  /**
   * Records a Cashfree-verified paid order in both preview and live modes.
   * Idempotent by order id — safe for verify retries.
   */
  recordVerifiedPaidOrder: (order: SimulatedOrder) => void;
  cancelOrder: (id: string, reasonIds: string[]) => boolean;
  requestReturn: (
    id: string,
    payload: {
      reasonIds: string[];
      itemIds: string[];
      photoUris: string[];
    },
  ) => boolean;
  findOrder: (id: string | undefined | null) => SimulatedOrder | null;
  /** Clears in-memory demo orders/coupon (logout / account switch). */
  resetPreviewSession: () => void;
};

const PreviewSessionContext = createContext<PreviewSessionValue | null>(null);

export function PreviewSessionProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<SimulatedOrder[]>(() =>
    UI_PREVIEW_MODE
      ? DEMO_SEED_ORDERS.map((order) => ({ ...order, items: [...order.items] }))
      : [],
  );
  const [couponId, setCouponId] = useState<string | null>(null);

  useEffect(() => {
    registerPreviewSessionReset(() => {
      setCouponId(null);
      setOrders(
        UI_PREVIEW_MODE
          ? DEMO_SEED_ORDERS.map((order) => ({ ...order, items: [...order.items] }))
          : [],
      );
    });
    return () => registerPreviewSessionReset(null);
  }, []);

  const value = useMemo<PreviewSessionValue>(
    () => ({
      orders,
      couponId,
      setCouponId,
      placeOrder: (order) => {
        if (!UI_PREVIEW_MODE) {
          return;
        }
        setOrders((current) => [
          order,
          ...current.filter((item) => item.id !== order.id),
        ]);
        setCouponId(null);
      },
      recordVerifiedPaidOrder: (order) => {
        if (!order?.id) {
          return;
        }
        setOrders((current) => [
          order,
          ...current.filter((item) => item.id !== order.id),
        ]);
        setCouponId(null);
      },
      cancelOrder: (id, reasonIds) => {
        if (!UI_PREVIEW_MODE || !id) {
          return false;
        }
        const target = orders.find((order) => order.id === id);
        if (
          !target ||
          target.status === "cancelled" ||
          target.status === "delivered"
        ) {
          return false;
        }
        setOrders((current) =>
          current.map((order) =>
            order.id !== id
              ? order
              : {
                  ...order,
                  status: "cancelled",
                  statusDetail:
                    "Cancelled by you. Refund timing depends on the payment method once live checkout is connected.",
                  cancelReasonIds: [...reasonIds],
                  statusAt: {
                    ...order.statusAt,
                    cancelled: new Date().toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    }),
                  },
                },
          ),
        );
        return true;
      },
      requestReturn: (id, payload) => {
        if (!UI_PREVIEW_MODE || !id) {
          return false;
        }
        const target = orders.find((order) => order.id === id);
        if (
          !target ||
          target.status !== "delivered" ||
          target.returnRequested
        ) {
          return false;
        }
        const reasonIds = payload.reasonIds.filter(Boolean);
        const itemIds = payload.itemIds.filter(Boolean);
        const photoUris = payload.photoUris.filter(Boolean).slice(0, 4);
        if (reasonIds.length === 0 || itemIds.length === 0 || photoUris.length === 0) {
          return false;
        }
        setOrders((current) =>
          current.map((order) =>
            order.id !== id
              ? order
              : {
                  ...order,
                  returnRequested: true,
                  returnReasonIds: [...reasonIds],
                  returnItemIds: [...itemIds],
                  returnPhotoUris: [...photoUris],
                  statusDetail:
                    "Return requested with product photos. Our team will review this preview request — live refunds are not connected yet.",
                },
          ),
        );
        return true;
      },
      findOrder: (id) => {
        if (!id) {
          return null;
        }
        return orders.find((order) => order.id === id) ?? null;
      },
      resetPreviewSession: () => {
        setCouponId(null);
        setOrders(
          UI_PREVIEW_MODE
            ? DEMO_SEED_ORDERS.map((order) => ({ ...order, items: [...order.items] }))
            : [],
        );
      },
    }),
    [couponId, orders],
  );

  return (
    <PreviewSessionContext.Provider value={value}>
      {children}
    </PreviewSessionContext.Provider>
  );
}

export function usePreviewSession(): PreviewSessionValue {
  const value = useContext(PreviewSessionContext);
  if (!value) {
    throw new Error(
      "usePreviewSession must be used within PreviewSessionProvider",
    );
  }
  return value;
}
