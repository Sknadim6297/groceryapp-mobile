import {
  installPaymentPreferenceStoreForTests,
  loadPaymentPreference,
  parsePaymentPreference,
  savePaymentPreference,
} from '../src/services/paymentPreferenceStore';
import { DEMO_PAYMENT_CARD, PAYMENT_METHOD_OPTIONS } from '../src/data/demoPaymentCard';
import { profileRoutes } from '../src/navigation/profileRoutes';
import { sideMenuItems } from '../src/navigation/sideMenuItems';

async function main() {
  installPaymentPreferenceStoreForTests(null);

  const defaults = parsePaymentPreference(null);
  if (defaults.primaryMethodId !== 'card' || defaults.cardPreviewHidden !== false) {
    throw new Error('default payment preference should prefer demo card method');
  }

  if (parsePaymentPreference('{ "primaryMethodId": "upi", "cardPreviewHidden": true }').primaryMethodId !== 'upi') {
    throw new Error('valid method ids must parse');
  }
  if (parsePaymentPreference('{ "primaryMethodId": "bitcoin" }').primaryMethodId !== 'card') {
    throw new Error('invalid method ids must fall back');
  }

  const saved = await savePaymentPreference({ primaryMethodId: 'cod', cardPreviewHidden: true });
  if (!saved) {
    throw new Error('preference save should succeed');
  }
  const loaded = await loadPaymentPreference();
  if (loaded.primaryMethodId !== 'cod' || loaded.cardPreviewHidden !== true) {
    throw new Error('preference must persist locally');
  }

  if (!DEMO_PAYMENT_CARD.maskedNumber.includes('•')) {
    throw new Error('demo card must show a masked number');
  }
  if (DEMO_PAYMENT_CARD.badge !== 'Demo Card') {
    throw new Error('demo card badge required');
  }
  if (PAYMENT_METHOD_OPTIONS.length !== 3) {
    throw new Error('three demo payment methods required');
  }

  if (profileRoutes.myPayment !== '/my-payment') {
    throw new Error('My Payment route must stay separate from checkout /payment');
  }
  if (sideMenuItems.find((item) => item.label === 'My Payment')?.href !== '/my-payment') {
    throw new Error('sidebar My Payment must open /my-payment');
  }

  console.log('payment preference fixtures passed');
}

void main();
