import { buildDemoReferralCode, buildDemoInviteMessage } from '../src/utils/referralCode';
import {
  buildLocalComplaintId,
  createComplaint,
  installComplaintStoreForTests,
  loadComplaints,
} from '../src/services/complaintStore';
import {
  DEFAULT_APP_SETTINGS,
  installAppSettingsStoreForTests,
  loadAppSettings,
  parseAppSettings,
  saveAppSettings,
} from '../src/services/appSettingsStore';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  assert(buildDemoReferralCode('9876543210')?.startsWith('MB-'), 'referral code from mobile');
  assert(buildDemoReferralCode('') == null, 'empty seed has no code');
  assert(buildDemoInviteMessage('MB-TEST').includes('MB-TEST'), 'invite message includes code');
  assert(buildDemoInviteMessage('MB-TEST').toLowerCase().includes('demo'), 'invite labeled demo');

  installComplaintStoreForTests(null);
  assert((await loadComplaints()).length === 0, 'complaints start empty');
  const created = await createComplaint({
    category: 'order',
    subject: 'Late delivery',
    description: 'Order arrived much later than expected.',
    orderId: 'DEMO-1',
  });
  assert(created != null && created.id.startsWith('LOCAL-'), 'local complaint id');
  assert((await loadComplaints()).length === 1, 'complaint persisted');
  assert(await createComplaint({ category: 'order', subject: 'ab', description: 'short' }) == null, 'rejects short draft');
  assert(buildLocalComplaintId(1).startsWith('LOCAL-'), 'id helper');

  installAppSettingsStoreForTests(null);
  assert((await loadAppSettings()).orderAlerts === DEFAULT_APP_SETTINGS.orderAlerts, 'default settings');
  assert(await saveAppSettings({ orderAlerts: false, offerAlerts: true }), 'save settings');
  assert((await loadAppSettings()).offerAlerts === true, 'settings round-trip');
  assert(parseAppSettings({ orderAlerts: true }).offerAlerts === false, 'parse fills defaults');

  console.log('account features fixtures passed');
}

void main();
