import { cashfreeSessionCheckoutUrl, type CashfreeClientEnvironment } from '@/constants/cashfree';

/**
 * Official Cashfree session-checkout bootstrap HTML (form POST).
 * Same pattern Cashfree documents for WKWebView / web session checkout —
 * not a merchant-specific shortcut page.
 */
export function buildCashfreeSessionCheckoutHtml(
  paymentSessionId: string,
  env: CashfreeClientEnvironment,
): string {
  const session = paymentSessionId.trim();
  const action = cashfreeSessionCheckoutUrl(env);
  const safeSession = session
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const safeAction = action
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <title>Mayapur Bazaar · Secure Payment</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 24px;
      background: #FFF9EC; color: #1C1917; text-align: center; }
    .card { margin-top: 40px; padding: 20px; border-radius: 12px; background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .title { font-weight: 700; font-size: 18px; margin: 0 0 8px; }
    .copy { font-size: 14px; color: #57534E; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <p class="title">Opening Cashfree checkout…</p>
    <p class="copy">Please wait. Do not close this screen.</p>
  </div>
  <form id="redirectForm" name="order" action="${safeAction}" method="post">
    <input type="hidden" name="payment_session_id" value="${safeSession}" />
  </form>
  <script>
    window.onload = function () {
      var form = document.getElementById('redirectForm');
      if (form) { form.submit(); }
    };
  </script>
</body>
</html>`;
}

/** Heuristic: Cashfree redirected after a completed attempt — always verify server-side. */
export function shouldVerifyAfterCashfreeNavigation(url: string): boolean {
  const value = url.trim().toLowerCase();
  if (!value.startsWith('http')) {
    // Custom scheme / deep link return from Cashfree
    if (value.includes('order_id') || value.includes('orderid') || value.includes('payment')) {
      return true;
    }
    return false;
  }
  return (
    value.includes('payment-status') ||
    value.includes('paymentstatus') ||
    value.includes('verify-payment') ||
    value.includes('payment-success') ||
    value.includes('payment-failure') ||
    value.includes('payments/return') ||
    value.includes('pg/orders/') ||
    /[?&]order_id=/.test(value) ||
    /[?&]orderid=/.test(value)
  );
}
