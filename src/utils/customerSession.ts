type SignedInSession = {
  clearAccount: () => void;
  clearAuthSession: () => void;
  clearRememberedCustomer: () => void;
  setNationalNumber: (value: string) => void;
  clearDraft: () => void;
  clearDelivery: () => void;
  clearDevTestSession: () => void;
};

/** Drops the server session and the remembered customer. Nothing here writes a token. */
export function clearSignedInSession(session: SignedInSession): void {
  session.clearAuthSession();
  session.clearAccount();
  session.clearRememberedCustomer();
  session.setNationalNumber('');
  session.clearDraft();
  session.clearDelivery();
  session.clearDevTestSession();
}
