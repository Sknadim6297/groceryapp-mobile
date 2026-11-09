# Mock Data Audit — MayapurBazaar Grocery App

Every hardcoded, demo, fixture, SecureStore-local, or in-memory dataset that should be replaced or backed by a real API for production.  
**Do not remove these fixtures during integration** — swap data sources behind flags / services.

**Priority:** P0 = blocks main journey · P1 = secondary product surfaces · P2 = nice-to-have / CMS / future

---

## Audit table

| File | Mock Data | Required API | Priority |
|---|---|---|---|
| `src/data/homeFeed.ts` | Recommended, recent, spotlight, bought-again, top-selling products; daily essentials shortcuts | `GET /api/v1/home`, `GET /api/values/products` | P0 |
| `src/data/homePromoBanners.ts` | Static promo carousel slides (savings, 10 mins, free delivery, fruits) | `GET /api/v1/home` (banners section) | P0 |
| `src/data/mockProducts.ts` | Demo product cards (Popular Picks) | `GET /api/values/products` | P0 |
| `src/data/mockCategories.ts` | Category grid tiles | `GET /api/v1/categories` | P0 |
| `src/data/mockBrands.ts` | Brand carousel tiles | `GET /api/v1/brands` | P2 |
| `src/data/listCatalogProducts.ts` | Merged on-device catalogue pool | `GET /api/values/products` | P0 |
| `src/data/findDemoProduct.ts` | Product lookup from local pool | `GET /api/v1/products/{productId}` | P0 |
| `src/data/shopCatalog.ts` | Hardcoded product→shelf map + shelves | `GET /api/v1/categories`, product `categoryIds` | P0 |
| `src/data/subcategoryCatalog.ts` | Parent/subcategory hierarchy from mocks | `GET /api/v1/categories` (tree) | P0 |
| `src/data/productDetails.ts` | Per-id brand + about copy | Product details fields on `GET /api/v1/products/{id}` | P0 |
| `src/data/shoppingCollections.ts` | Collection definitions + chip membership heuristics | `GET /api/v1/collections/{id}` | P1 |
| `src/data/searchSuggestions.ts` | Local search suggestions from catalogue/brands | `GET /api/v1/search/suggestions` | P1 |
| `src/data/previewImageCatalog.ts` | Preview dry-fruit products / remote image helpers | Catalogue image URLs from products API | P1 |
| `src/data/demoStores.ts` | Fictional nearby stores | `GET /api/v1/stores`, `GET /api/v1/stores/{id}` | P2 |
| `src/data/demoOrders.ts` | Seed preview orders (`DEMO-*`) | `GET /api/v1/orders`, `GET /api/v1/orders/{id}` | P0 |
| `src/data/demoOrderTracking.ts` | Unitless demo map geometry, ETA chips | `GET /api/v1/orders/{id}/tracking` | P0 |
| `src/data/activeOrder.ts` | Always returns empty active order | `GET /api/v1/orders/active` | P0 |
| `src/data/pastOrders.ts` | Always empty past orders (non-preview) | `GET /api/v1/orders` | P0 |
| `src/data/demoCoupons.ts` | Demo promocodes + local discount math | `GET /api/v1/coupons`, `POST /api/v1/coupons/validate` | P1 |
| `src/data/previewCoupons.ts` | Legacy preview coupon shape helpers | Same coupon APIs | P1 |
| `src/data/demoTransactions.ts` | Demo payment/refund ledger | `GET /api/v1/transactions` | P1 |
| `src/data/demoPaymentCard.ts` | Fake card preview for My Payment | Real instruments via payment prefs / gateway | P1 |
| `src/data/demoNotifications.ts` + `demoNotificationSeed.ts` + `demoNotificationsLogic.ts` | Demo inbox rows + routing helpers | `GET /api/v1/notifications` | P1 |
| `src/data/productReviews.ts` | Deterministic preview review seeds | `GET /api/v1/products/{id}/reviews` | P1 |
| `src/data/supportFaq.ts` | Static FAQ articles/categories | `GET /api/v1/support/faqs` | P2 |
| `src/data/orderCancelReasons.ts` | Cancel reason ids/labels | Cancel API reason catalog (or keep static ids) | P0 |
| `src/data/orderReturnReasons.ts` | Return reason ids/labels | Return API reason catalog (or keep static ids) | P1 |
| `src/data/referenceLocations.ts` | Reference location search seeds | Device geocoder + optional places API; serviceability API | P0 |
| `src/context/MockCartContext.tsx` | In-memory cart quantities + leave-at-door | `GET/PUT/DELETE /api/v1/cart*` | P0 |
| `src/context/PreviewSessionContext.tsx` | In-memory preview orders + couponId | Orders + coupons APIs | P0 |
| `src/context/WishlistContext.tsx` + `src/services/wishlistStore.ts` | Local wishlist product ids | Wishlist APIs | P1 |
| `src/context/ProductReviewsContext.tsx` + `src/services/productReviewStore.ts` | Device reviews + votes | Review APIs | P1 |
| `src/context/CustomerProfileContext.tsx` + `src/services/customerProfileStore.ts` | Local profile vault (name, email, DOB, avatar) | `GET/PATCH /api/v1/customers/me`, avatar upload | P0 |
| `src/context/SavedAddressesContext.tsx` + `src/services/savedAddressStore.ts` | Local address book | Address CRUD APIs | P0 |
| `src/services/temporaryUiLogin.ts` | Device “signed in” without Authorization header | Verify/register returning `AccessToken` + refresh | P0 |
| `src/services/authSession.ts` | Session credential store mostly unused in production path | Real bearer session | P0 |
| `src/services/mobileVerificationStore.ts` | OTP-first verification proof on device | Server `MobileVerificationToken` on register | P0 |
| `src/services/couponCollectionStore.ts` | Collected coupon ids | `POST /api/v1/coupons/{id}/collect` | P1 |
| `src/services/paymentPreferenceStore.ts` | Primary method + hide card flag | Payment preferences API | P1 |
| `src/services/notificationInboxStore.ts` | Read/cleared overlay for demo inbox | Notifications read/clear APIs | P1 |
| `src/services/appSettingsStore.ts` | Order/offer alert toggles | Notification preferences API | P1 |
| `src/services/complaintStore.ts` | Local complaints `LOCAL-*` | Complaints APIs | P1 |
| `src/services/supportChatStore.ts` | Local chat thread | Support chat APIs | P2 |
| `src/services/deliveryReviewStore.ts` | Local delivery ratings | Delivery review API | P1 |
| `src/services/orderProductReviewStore.ts` | “Order products reviewed” flags | Order product-review API | P1 |
| `src/utils/demoCheckoutBill.ts` | Demo delivery fee ₹29 + grand total | `POST /api/v1/checkout/quote` | P0 |
| `src/utils/cartBill.ts` | Client MRP/item totals; fees hard-zero | Server quote (never trust client prices) | P0 |
| `src/utils/referralCode.ts` | Client-derived `MB-…` referral code | `GET /api/v1/referrals/me` | P2 |
| `src/components/payment/checkoutPaymentMethods.ts` | Static COD/UPI/Card options; only COD places demo order | `GET /api/v1/payments/methods` + initiate/confirm | P0 |
| `src/app/privacy.tsx` / `src/app/terms.tsx` | Static / placeholder legal copy | Content APIs (optional CMS) | P2 |
| `src/app/wallet.tsx` | Balance shown as unavailable (`₹ —`) | `GET /api/v1/wallet` | P2 |
| `src/services/devOtp.ts` | Development OTP + mock registered/unregistered | **Dev only** — not a production API | — |

---

## Storage classification

| Kind | Examples | Production expectation |
|---|---|---|
| Hardcoded TypeScript fixtures | `homeFeed`, `demoOrders`, `DEMO_COUPONS`, `DEMO_STORES` | Replace with API responses |
| In-memory React context | `MockCartContext`, `PreviewSessionContext` | Server cart + orders |
| SecureStore device vault | Profile, addresses, wishlist, complaints, chat, settings | Sync to authenticated APIs; keep offline cache optional |
| Device OS services | `expo-location` geocode/GPS, camera QR | Keep client-side; add server serviceability |
| Live HTTP today | Customer send/resend/verify OTP, register | Keep; complete OTP-first + AccessToken contracts |

---

## Explicit non-goals found in code

These must **not** be treated as live commerce data:

- `EXPO_PUBLIC_UI_PREVIEW` demo banner copy (`DEMO_BANNER_LABEL`)
- Demo order ids (`DEMO-*`) and `createDemoOrderId()`
- Unitless tracking map coordinates (not GPS)
- Wallet Add Money disabled state
- Brand carousel navigation currently ignored by Shop (`?brand=` unused)
- Account deletion (explicitly absent from Settings)

---

## Integration guidance

1. Keep fixtures behind `UI_PREVIEW_MODE` / `LIVE_CATALOGUE_CONNECTED` until endpoints return published samples.
2. Never display fixture prices/stock as live when catalogue flag is off (already reflected in `liveData.ts`).
3. Server must recalculate cart/checkout totals — client bill helpers are UI-only.
4. Replace `TemporaryUiLogin` with Authorization-backed session before enabling live cart/orders.
