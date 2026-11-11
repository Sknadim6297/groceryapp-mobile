type SignedInSession = {
  clearAccount: () => void;
  clearAuthSession: () => void;
  clearRememberedCustomer: () => void;
  setNationalNumber: (value: string) => void;
  clearDraft: () => void;
  clearDelivery: () => void;
  clearDevTestSession: () => void;
  clearSavedAddresses?: () => void;
  clearCustomerProfile?: () => void;
  /** Demo coupon / notification inbox — account-adjacent preview state on a shared device. */
  clearPreviewAccountState?: () => void;
};

/**
 * Drops the server session and remembered customer.
 * Does not wipe device-wide app settings preferences (order/offer toggles).
 * Nothing here writes a token.
 */
export function clearSignedInSession(session: SignedInSession): void {
  session.clearAuthSession();
  session.clearAccount();
  session.clearRememberedCustomer();
  session.setNationalNumber('');
  session.clearDraft();
  session.clearDelivery();
  session.clearDevTestSession();
  session.clearSavedAddresses?.();
  session.clearCustomerProfile?.();
  session.clearPreviewAccountState?.();
}
