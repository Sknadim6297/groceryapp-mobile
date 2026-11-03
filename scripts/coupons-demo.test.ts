import {
  DEMO_COUPONS,
  computeDemoCouponDiscount,
  demoCouponById,
  isCouponExpired,
  previewCoupons,
  toPreviewCoupon,
} from '../src/data/demoCoupons';
import { sideMenuItems } from '../src/navigation/sideMenuItems';
import {
  installCouponCollectionStoreForTests,
  loadCollectedCouponIds,
  parseCollectedCouponIds,
  saveCollectedCouponIds,
} from '../src/services/couponCollectionStore';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  assert(DEMO_COUPONS.length >= 5, 'demo coupons required');
  assert(DEMO_COUPONS.every((coupon) => coupon.id.startsWith('demo-')), 'demo ids namespaced');
  assert(DEMO_COUPONS.every((coupon) => coupon.code.trim().length > 0), 'codes required');
  assert(DEMO_COUPONS.some((coupon) => isCouponExpired(coupon)), 'expired fixture required');
  assert(previewCoupons.length > 0, 'active preview coupons');
  assert(
    previewCoupons.every((coupon) => !isCouponExpired(demoCouponById(coupon.id)!)),
    'preview list excludes expired',
  );

  const grocery = demoCouponById('demo-grocery-30')!;
  assert(grocery.discountType === 'percent' && grocery.discountValue === 30, 'grocery percent');
  assert(computeDemoCouponDiscount(grocery, 500) === 0, 'below minimum yields 0');
  assert(computeDemoCouponDiscount(grocery, 999) === 150, 'percent capped at maxDiscount');
  assert(computeDemoCouponDiscount(grocery, 2000) === 150, 'cap holds on larger carts');

  const expired = demoCouponById('demo-expired-flat')!;
  assert(isCouponExpired(expired), 'expired coupon flagged');
  assert(computeDemoCouponDiscount(expired, 500) === 0, 'expired never discounts');

  const flat = toPreviewCoupon(expired);
  assert(flat.amount === 10 && flat.minimum === 50, 'preview mapping for flat coupon');

  assert(parseCollectedCouponIds(null).length === 0, 'empty parse');
  assert(parseCollectedCouponIds('not-json').length === 0, 'invalid json');
  assert(parseCollectedCouponIds(JSON.stringify(['demo-grocery-30', ''])).length === 1, 'filters blanks');

  installCouponCollectionStoreForTests(null);
  await saveCollectedCouponIds(['demo-grocery-30', 'demo-grocery-30', 'demo-daily-25']);
  const collected = await loadCollectedCouponIds();
  assert(collected.length === 2, 'dedupes collected ids');
  assert(collected.includes('demo-grocery-30') && collected.includes('demo-daily-25'), 'persisted ids');

  assert(sideMenuItems.find((item) => item.label === 'Promocode')?.href === '/coupons', 'sidebar Promocode route');

  console.log('coupons demo fixtures passed');
}

void main();
