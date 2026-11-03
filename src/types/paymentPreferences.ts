export const paymentMethodIds = ['card', 'upi', 'cod'] as const;

export type PaymentMethodId = (typeof paymentMethodIds)[number];

export type PaymentMethodOption = {
  id: PaymentMethodId;
  title: string;
  subtitle: string;
};

/** Local UI preference only — never a verified gateway instrument. */
export type PaymentPreferenceState = {
  primaryMethodId: PaymentMethodId;
  cardPreviewHidden: boolean;
};
