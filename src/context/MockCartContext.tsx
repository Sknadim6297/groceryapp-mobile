import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type CheckoutMode = 'CART_CHECKOUT' | 'BUY_NOW_CHECKOUT';

/** Isolated Buy Now session — never merges into the persistent cart. */
export type BuyNowSession = {
  mode: 'BUY_NOW_CHECKOUT';
  productId: string;
  quantity: number;
  sessionId: string;
};

type MockCartContextValue = {
  /** Persistent basket (badge + Cart tab). */
  quantities: Record<string, number>;
  /** Active Buy Now session, if any. */
  buyNowSession: BuyNowSession | null;
  checkoutMode: CheckoutMode;
  isBuyNow: boolean;
  /**
   * Items for Checkout / Payment only.
   * BUY_NOW_CHECKOUT → session product only.
   * CART_CHECKOUT → persistent cart.
   */
  checkoutQuantities: Record<string, number>;
  totalCount: number;
  leaveAtDoor: boolean;
  add: (productId: string) => void;
  addToCart: (productId: string, quantity?: number) => void;
  /** Cart qty edits always touch the persistent cart (never the Buy Now session). */
  setQuantity: (productId: string, quantity: number) => void;
  /** Buy Now qty edits (checkout screen) — session only. */
  setBuyNowQuantity: (quantity: number) => void;
  /**
   * Start / replace a Buy Now session. Does not change the cart.
   * Returns the session (sync) so navigation can happen immediately.
   */
  startBuyNow: (productId: string, quantity: number) => BuyNowSession | null;
  clearBuyNow: () => void;
  setLeaveAtDoor: (value: boolean) => void;
};

const MockCartContext = createContext<MockCartContextValue | null>(null);

/** Module sync store — survives the setState → navigate race into Checkout. */
let syncBuyNowSession: BuyNowSession | null = null;

function withQuantity(
  current: Record<string, number>,
  productId: string,
  quantity: number,
): Record<string, number> {
  const next = { ...current };
  if (quantity <= 0) {
    delete next[productId];
  } else {
    next[productId] = quantity;
  }
  return next;
}

let buyNowSessionSeq = 0;

export function MockCartProvider({ children }: { children: ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyNowSession, setBuyNowSession] = useState<BuyNowSession | null>(null);
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const buyNowTapLock = useRef(0);

  const add = useCallback((productId: string) => {
    setQuantities((current) => ({
      ...current,
      [productId]: (current[productId] ?? 0) + 1,
    }));
  }, []);

  const addToCart = useCallback((productId: string, quantity: number = 1) => {
    const qty = Math.max(1, Math.min(99, Math.floor(quantity)));
    setQuantities((current) => ({
      ...current,
      [productId]: (current[productId] ?? 0) + qty,
    }));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setQuantities((current) => withQuantity(current, productId, quantity));
  }, []);

  const setBuyNowQuantity = useCallback((quantity: number) => {
    setBuyNowSession((current) => {
      const base = current ?? syncBuyNowSession;
      if (!base) {
        return current;
      }
      const qty = Math.max(1, Math.min(99, Math.floor(quantity)));
      const next = { ...base, quantity: qty };
      syncBuyNowSession = next;
      return next;
    });
  }, []);

  const clearBuyNow = useCallback(() => {
    syncBuyNowSession = null;
    setBuyNowSession(null);
  }, []);

  const startBuyNow = useCallback((productId: string, quantity: number): BuyNowSession | null => {
    const id = productId.trim();
    if (!id) {
      return null;
    }
    const now = Date.now();
    // Debounce rapid double-taps into one session.
    if (now - buyNowTapLock.current < 600 && syncBuyNowSession?.productId === id) {
      return syncBuyNowSession;
    }
    buyNowTapLock.current = now;
    const qty = Math.max(1, Math.min(99, Math.floor(quantity)));
    buyNowSessionSeq += 1;
    const session: BuyNowSession = {
      mode: 'BUY_NOW_CHECKOUT',
      productId: id,
      quantity: qty,
      sessionId: `buy-now-${buyNowSessionSeq}-${now}`,
    };
    syncBuyNowSession = session;
    setBuyNowSession(session);
    return session;
  }, []);

  // Prefer React state; fall back to sync store during navigate race.
  const activeSession = buyNowSession ?? syncBuyNowSession;
  const isBuyNow = activeSession != null;
  const checkoutMode: CheckoutMode = isBuyNow ? 'BUY_NOW_CHECKOUT' : 'CART_CHECKOUT';
  const checkoutQuantities = useMemo(() => {
    if (!activeSession) {
      return quantities;
    }
    return { [activeSession.productId]: activeSession.quantity };
  }, [activeSession, quantities]);

  const totalCount = useMemo(
    () => Object.values(quantities).reduce((sum, count) => sum + count, 0),
    [quantities],
  );

  const value = useMemo(
    () => ({
      quantities,
      buyNowSession: activeSession,
      checkoutMode,
      isBuyNow,
      checkoutQuantities,
      totalCount,
      leaveAtDoor,
      add,
      addToCart,
      setQuantity,
      setBuyNowQuantity,
      startBuyNow,
      clearBuyNow,
      setLeaveAtDoor,
    }),
    [
      activeSession,
      add,
      addToCart,
      checkoutMode,
      checkoutQuantities,
      clearBuyNow,
      isBuyNow,
      leaveAtDoor,
      quantities,
      setBuyNowQuantity,
      setQuantity,
      startBuyNow,
      totalCount,
    ],
  );

  return <MockCartContext.Provider value={value}>{children}</MockCartContext.Provider>;
}

export function useMockCart(): MockCartContextValue {
  const value = useContext(MockCartContext);

  if (!value) {
    throw new Error('useMockCart must be used within MockCartProvider');
  }

  return value;
}
