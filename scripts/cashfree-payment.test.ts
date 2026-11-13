import assert from 'node:assert/strict';

import {
  CHECKOUT_PAYMENT_METHODS,
  resolveCheckoutPaymentMethodId,
} from '../src/components/payment/checkoutPaymentMethods';
import { PAYMENT_API } from '../src/constants/api';
import {
  installPendingPaymentStoreForTests,
  parsePendingPaymentSnapshot,
  savePendingPayment,
  loadPendingPayment,
  clearPendingPayment,
} from '../src/services/pendingPaymentStore';
import {
  mapVerifyOutcome,
  normalizeCashfreePaymentStatus,
  nextPaymentPollDelayMs,
  PAYMENT_VERIFY_POLL_DELAYS_MS,
  paymentOutcomeBody,
} from '../src/utils/paymentStatus';
import {
  buildCashfreeSessionCheckoutHtml,
  shouldVerifyAfterCashfreeNavigation,
} from '../src/utils/cashfreeCheckoutHtml';
import { cashfreeSessionCheckoutUrl } from '../src/constants/cashfree';

function assertPaidNeverFromActive() {
  const mapped = mapVerifyOutcome({ apiStatus: 'Pending', paymentStatus: 'ACTIVE' });
  assert.equal(mapped.isPaid, false);
  assert.equal(mapped.outcome, 'pending');
  assert.equal(normalizeCashfreePaymentStatus('ACTIVE'), 'ACTIVE');
}

function assertPaidOnlyWhenPaid() {
  const mapped = mapVerifyOutcome({ apiStatus: 'Success', paymentStatus: 'PAID' });
  assert.equal(mapped.isPaid, true);
  assert.equal(mapped.outcome, 'paid');
}

function assertFailedAndExpired() {
  assert.equal(mapVerifyOutcome({ apiStatus: 'Failed', paymentStatus: 'FAILED' }).outcome, 'failed');
  assert.equal(mapVerifyOutcome({ apiStatus: 'Failed', paymentStatus: 'EXPIRED' }).outcome, 'expired');
  assert.equal(
    mapVerifyOutcome({ apiStatus: 'Failed', paymentStatus: 'USER_DROPPED' }).outcome,
    'cancelled',
  );
}

function assertUnknownStaysSafe() {
  const mapped = mapVerifyOutcome({ apiStatus: 'Failed', paymentStatus: 'WEIRD' });
  assert.equal(mapped.isPaid, false);
  assert.ok(mapped.outcome === 'unknown' || mapped.outcome === 'pending');
  assert.match(paymentOutcomeBody('unknown'), /unresolved|confirm/i);
}

function assertBoundedPolling() {
  assert.ok(PAYMENT_VERIFY_POLL_DELAYS_MS.length <= 10);
  assert.equal(nextPaymentPollDelayMs(0), 2000);
  assert.equal(nextPaymentPollDelayMs(PAYMENT_VERIFY_POLL_DELAYS_MS.length), null);
}

function assertPaymentMethods() {
  assert.equal(CHECKOUT_PAYMENT_METHODS.length, 2);
  assert.ok(CHECKOUT_PAYMENT_METHODS.some((m) => m.id === 'cod' && m.canPlaceDemoOrder));
  assert.ok(CHECKOUT_PAYMENT_METHODS.some((m) => m.id === 'online' && m.usesCashfree));
  assert.equal(resolveCheckoutPaymentMethodId('upi'), 'online');
  assert.equal(resolveCheckoutPaymentMethodId('card'), 'online');
  assert.equal(resolveCheckoutPaymentMethodId('cod'), 'cod');
}

function assertApiPathsNotInvented() {
  assert.equal(PAYMENT_API.create, '/api/values/PaymentGatway');
  assert.equal(PAYMENT_API.verify, '/api/values/VerifyPayment');
}

async function assertPendingStoreIdempotent() {
  installPendingPaymentStoreForTests(null);
  const snapshot = {
    orderId: 'PBtest123',
    paymentSessionId: 'session_test',
    amount: 5,
    currency: 'INR',
    createdAt: Date.now(),
    customerPhone: '9999999999',
    addressTitle: 'Home',
    addressLine: 'Mayapur',
    itemSummary: [{ id: 'p1', name: 'Milk', quantity: 1 }],
    submitToken: 'tok1',
  };
  assert.equal(await savePendingPayment(snapshot), true);
  const loaded = await loadPendingPayment();
  assert.equal(loaded?.orderId, 'PBtest123');
  assert.equal(parsePendingPaymentSnapshot(null), null);
  await clearPendingPayment('PBtest123');
  assert.equal(await loadPendingPayment(), null);
}

function assertWebCheckoutHtml() {
  const html = buildCashfreeSessionCheckoutHtml('session_abc', 'sandbox');
  assert.match(html, /payment_session_id/);
  assert.match(html, /session_abc/);
  assert.match(html, /sandbox\.cashfree\.com\/pg\/view\/sessions\/checkout/);
  assert.equal(
    cashfreeSessionCheckoutUrl('production'),
    'https://api.cashfree.com/pg/view/sessions/checkout',
  );
  assert.equal(shouldVerifyAfterCashfreeNavigation('https://example.com/verify-payment?order_id=PB1'), true);
  assert.equal(shouldVerifyAfterCashfreeNavigation('https://sandbox.cashfree.com/pg/view/sessions/checkout'), false);
}

async function main() {
  assertPaidNeverFromActive();
  assertPaidOnlyWhenPaid();
  assertFailedAndExpired();
  assertUnknownStaysSafe();
  assertBoundedPolling();
  assertPaymentMethods();
  assertApiPathsNotInvented();
  assertWebCheckoutHtml();
  await assertPendingStoreIdempotent();
  console.log('cashfree payment fixtures passed');
}

void main();
