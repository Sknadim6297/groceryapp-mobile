import type { DemoTransaction } from '@/types/transactions';

/**
 * Fictional Mayapur Bazaar ledger for UI preview only.
 * Not persisted as customer financial history and never sent to payment APIs.
 */
export const DEMO_TRANSACTIONS: readonly DemoTransaction[] = [
  {
    id: 'TXN-DEMO-1042',
    method: 'mastercard',
    title: 'Master Card',
    amount: 350,
    currency: 'INR',
    placedAtLabel: 'Jan 08, 2026 at 12:00 PM',
    status: 'success',
    kind: 'payment',
    orderId: 'DEMO-1988',
    note: 'Simulated card payment for a demo grocery order.',
  },
  {
    id: 'TXN-DEMO-1043',
    method: 'visa',
    title: 'Visa Card',
    amount: 280,
    currency: 'INR',
    placedAtLabel: 'Jan 08, 2026 at 11:20 AM',
    status: 'success',
    kind: 'payment',
    orderId: 'DEMO-1875',
    note: 'Simulated Visa payment. No bank was contacted.',
  },
  {
    id: 'TXN-DEMO-1044',
    method: 'upi',
    title: 'UPI Payment',
    amount: 412,
    currency: 'INR',
    placedAtLabel: 'Jan 07, 2026 at 6:45 PM',
    status: 'success',
    kind: 'payment',
    orderId: 'DEMO-2042',
    note: 'Simulated UPI capture for preview checkout.',
  },
  {
    id: 'TXN-DEMO-1045',
    method: 'cash',
    title: 'Cash Payment',
    amount: 645,
    currency: 'INR',
    placedAtLabel: 'Jan 07, 2026 at 9:10 AM',
    status: 'pending',
    kind: 'payment',
    orderId: 'DEMO-2042',
    note: 'Cash on Delivery marked pending in demo mode.',
  },
  {
    id: 'TXN-DEMO-1046',
    method: 'upi',
    title: 'UPI Refund',
    amount: 156,
    currency: 'INR',
    placedAtLabel: 'Jan 06, 2026 at 4:05 PM',
    status: 'success',
    kind: 'refund',
    orderId: 'DEMO-1901',
    note: 'Simulated refund credit after a cancelled demo order.',
  },
  {
    id: 'TXN-DEMO-1047',
    method: 'visa',
    title: 'Visa Payment',
    amount: 365,
    currency: 'INR',
    placedAtLabel: 'Jan 05, 2026 at 8:30 PM',
    status: 'failed',
    kind: 'payment',
    note: 'Simulated failed authorization. No charge was made.',
  },
];

export function filterDemoTransactions(
  items: readonly DemoTransaction[],
  filter: 'all' | 'payments' | 'refunds',
): DemoTransaction[] {
  switch (filter) {
    case 'payments':
      return items.filter((item) => item.kind === 'payment');
    case 'refunds':
      return items.filter((item) => item.kind === 'refund');
    case 'all':
    default:
      return [...items];
  }
}

export function formatTransactionAmount(item: DemoTransaction): string {
  const value = item.amount.toFixed(2);
  if (item.status === 'failed' || item.status === 'reversed') {
    return `− ₹${value}`;
  }
  if (item.kind === 'refund') {
    return `+ ₹${value}`;
  }
  return `₹${value}`;
}

export function transactionAmountTone(
  item: DemoTransaction,
): 'credit' | 'failed' | 'default' {
  if (item.status === 'failed' || item.status === 'reversed') {
    return 'failed';
  }
  if (item.kind === 'refund' && item.status === 'success') {
    return 'credit';
  }
  return 'default';
}
