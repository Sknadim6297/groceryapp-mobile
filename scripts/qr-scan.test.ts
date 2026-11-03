import { sideMenuItems } from '../src/navigation/sideMenuItems';
import { parseQrPayload } from '../src/utils/qrScanResult';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const product = parseQrPayload('product:apples');
assert(product.canNavigate && product.kind === 'product', 'product payload');

const deep = parseQrPayload('groceryapp://coupons');
assert(deep.canNavigate && deep.kind === 'coupons', 'deep link coupons');

const path = parseQrPayload('/order/DEMO-2042');
assert(path.canNavigate && path.kind === 'order', 'order path');

const upi = parseQrPayload('upi://pay?pa=merchant@upi&am=10');
assert(!upi.canNavigate && upi.kind === 'unsupported', 'upi blocked');

const external = parseQrPayload('https://example.com/deal');
assert(!external.canNavigate && external.title.includes('External'), 'external blocked');

const empty = parseQrPayload('   ');
assert(!empty.canNavigate, 'empty rejected');

assert(!sideMenuItems.some((item) => item.href === '/scan-qr'), 'scanner is not a sidebar/tab destination');

console.log('qr scan fixtures passed');
