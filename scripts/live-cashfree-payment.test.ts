/**
 * Live API smoke test for Cashfree create + verify endpoints.
 * Run: npm run test:live (includes this file when named live-*)
 */
import assert from 'node:assert/strict';

const BASE = (process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://api.supertrading.online').replace(
  /\/+$/,
  '',
);

async function main() {
  const createRes = await fetch(`${BASE}/api/values/PaymentGatway`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      CustomerId: 'live_test_mb',
      CustomerName: 'Live Test',
      CustomerEmail: 'live-test@example.com',
      CustomerPhone: '9999999999',
      Amount: 1,
    }),
  });
  assert.equal(createRes.ok, true, `create HTTP ${createRes.status}`);
  const created = (await createRes.json()) as Record<string, unknown>;
  assert.equal(created.Status, 'Success');
  assert.equal(typeof created.OrderId, 'string');
  assert.equal(typeof created.PaymentSessionId, 'string');
  assert.ok(String(created.PaymentSessionId).length > 10);
  assert.equal(created.Currency, 'INR');

  const orderId = String(created.OrderId);
  const verifyRes = await fetch(
    `${BASE}/api/values/VerifyPayment?order_id=${encodeURIComponent(orderId)}`,
    { headers: { Accept: 'application/json' } },
  );
  assert.equal(verifyRes.ok, true, `verify HTTP ${verifyRes.status}`);
  const verified = (await verifyRes.json()) as Record<string, unknown>;
  assert.equal(verified.OrderId, orderId);
  assert.equal(verified.PaymentStatus, 'ACTIVE');
  assert.notEqual(verified.PaymentStatus, 'PAID');
  assert.ok(verified.Status === 'Pending' || verified.Status === 'Success');

  console.log('live cashfree payment fixtures passed');
}

void main();
