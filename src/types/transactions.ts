export const transactionMethods = ['mastercard', 'visa', 'upi', 'cash'] as const;
export type TransactionMethod = (typeof transactionMethods)[number];

export const transactionKinds = ['payment', 'refund'] as const;
export type TransactionKind = (typeof transactionKinds)[number];

export const transactionStatuses = ['success', 'pending', 'failed', 'reversed'] as const;
export type TransactionStatus = (typeof transactionStatuses)[number];

/**
 * Frontend demo ledger row.
 * Never mix with live payment/order API records.
 */
export type DemoTransaction = {
  id: string;
  method: TransactionMethod;
  title: string;
  amount: number;
  currency: 'INR';
  placedAtLabel: string;
  status: TransactionStatus;
  kind: TransactionKind;
  orderId?: string;
  note: string;
};

export type TransactionsFilterId = 'all' | 'payments' | 'refunds';
