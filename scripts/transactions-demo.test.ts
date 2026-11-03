import {
  DEMO_TRANSACTIONS,
  filterDemoTransactions,
  formatTransactionAmount,
  transactionAmountTone,
} from '../src/data/demoTransactions';
import { sideMenuItems } from '../src/navigation/sideMenuItems';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(DEMO_TRANSACTIONS.length >= 5, 'demo transactions required');
assert(DEMO_TRANSACTIONS.every((item) => item.currency === 'INR'), 'INR only');
assert(DEMO_TRANSACTIONS.every((item) => item.id.startsWith('TXN-DEMO')), 'demo ids must stay namespaced');

const payments = filterDemoTransactions(DEMO_TRANSACTIONS, 'payments');
const refunds = filterDemoTransactions(DEMO_TRANSACTIONS, 'refunds');
assert(payments.every((item) => item.kind === 'payment'), 'payments filter');
assert(refunds.every((item) => item.kind === 'refund'), 'refunds filter');
assert(refunds.length >= 1, 'at least one demo refund');

const refund = refunds[0]!;
assert(formatTransactionAmount(refund).startsWith('+ ₹'), 'refund amount marked positive');
assert(transactionAmountTone(refund) === 'credit', 'successful refund uses credit tone');

const payment = payments.find((item) => item.status === 'success')!;
assert(formatTransactionAmount(payment).startsWith('₹'), 'successful payment is plain INR');
assert(transactionAmountTone(payment) === 'default', 'successful payment is not treated as money received');

const failed = DEMO_TRANSACTIONS.find((item) => item.status === 'failed')!;
assert(formatTransactionAmount(failed).startsWith('− ₹'), 'failed amount marked negative');
assert(transactionAmountTone(failed) === 'failed', 'failed tone');

assert(sideMenuItems.find((item) => item.label === 'Transactions')?.href === '/transactions', 'sidebar route');

console.log('transactions demo fixtures passed');
