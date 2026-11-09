# API Endpoint Summary — MayapurBazaar Grocery App

Master inventory of unique backend APIs required by the existing Expo frontend.  
**Evidence date:** 2026-11-09. Derived from source inspection only. No invented live integrations.

**Status legend**

| Status | Meaning |
|---|---|
| `integrated` | Frontend already calls this live endpoint |
| `partial` | Live path exists or is documented, but response contract / session / wiring is incomplete |
| `mocked` | UI works against fixtures / SecureStore / in-memory preview |
| `not_implemented` | UI exists or clearly needs the API, but no backend call exists |

**Auth legend:** `Public` = no customer session · `Required` = authenticated customer · `Optional` = works either way with different data

**Path notes**

- Confirmed live customer routes use the existing ASP.NET style: `/api/values/customer/...`
- Confirmed (undocumented response) catalogue probe path: `GET /api/values/products?company={company}`
- All other endpoints below are **proposed** under `/api/v1/...` for a consistent new commerce surface. Confirm with the backend team whether they should live under `/api/values/...` instead. Do not treat proposed paths as already deployed.

---

## Master table

| # | Module | API Name | Method | Endpoint | Auth | Screen(s) | Priority | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Authentication | Send OTP | POST | `/api/values/customer/send-otp` | Public | `src/app/login.tsx` | P0 | integrated |
| 2 | Authentication | Resend OTP | POST | `/api/values/customer/resend-otp` | Public | `src/app/otp.tsx` | P0 | integrated |
| 3 | Authentication | Verify OTP | POST | `/api/values/customer/verify-otp` | Public | `src/app/otp.tsx` | P0 | partial |
| 4 | Authentication | Register Customer | POST | `/api/values/customer/register` | Public | `src/app/complete-profile.tsx`, location confirm | P0 | partial |
| 5 | Authentication | Refresh Session | POST | `/api/v1/auth/refresh` | Required | App-wide session | P0 | not_implemented |
| 6 | Authentication | Logout / Revoke | POST | `/api/v1/auth/logout` | Required | Settings, Profile, Side menu | P1 | not_implemented |
| 7 | Profile | Get Profile | GET | `/api/v1/customers/me` | Required | `edit-profile.tsx`, Profile tab | P0 | mocked |
| 8 | Profile | Update Profile | PATCH | `/api/v1/customers/me` | Required | `edit-profile.tsx` | P0 | mocked |
| 9 | Profile | Upload Avatar | POST | `/api/v1/customers/me/avatar` | Required | `edit-profile.tsx` | P1 | mocked |
| 10 | Addresses | List Addresses | GET | `/api/v1/customers/me/addresses` | Required | `addresses.tsx`, checkout | P0 | mocked |
| 11 | Addresses | Create Address | POST | `/api/v1/customers/me/addresses` | Required | `address-form.tsx` | P0 | mocked |
| 12 | Addresses | Update Address | PATCH | `/api/v1/customers/me/addresses/{addressId}` | Required | `address-form.tsx` | P0 | mocked |
| 13 | Addresses | Delete Address | DELETE | `/api/v1/customers/me/addresses/{addressId}` | Required | `addresses.tsx` | P0 | mocked |
| 14 | Addresses | Set Default Address | PUT | `/api/v1/customers/me/addresses/{addressId}/default` | Required | `addresses.tsx` | P0 | mocked |
| 15 | Location | Check Serviceability | GET | `/api/v1/delivery/serviceability` | Optional | Location screens, checkout | P0 | not_implemented |
| 16 | Catalog | List Products | GET | `/api/values/products` | Optional | Shop, Home, Collection, Buy Again | P0 | partial |
| 17 | Catalog | Get Product Details | GET | `/api/v1/products/{productId}` | Optional | `product/[id].tsx` | P0 | mocked |
| 18 | Catalog | List Categories | GET | `/api/v1/categories` | Public | Home, Shop, Category | P0 | mocked |
| 19 | Catalog | Get Home Feed | GET | `/api/v1/home` | Optional | `(tabs)/home.tsx` | P0 | mocked |
| 20 | Catalog | Search Suggestions | GET | `/api/v1/search/suggestions` | Public | Shop search | P1 | mocked |
| 21 | Catalog | List Brands | GET | `/api/v1/brands` | Public | Home BrandCarousel | P2 | mocked |
| 22 | Catalog | Get Collection | GET | `/api/v1/collections/{collectionId}` | Public | `collection/[id].tsx` | P1 | mocked |
| 23 | Stores | List Stores | GET | `/api/v1/stores` | Optional | `(tabs)/stores.tsx` | P2 | mocked |
| 24 | Stores | Get Store | GET | `/api/v1/stores/{storeId}` | Optional | `store/[id].tsx` | P2 | mocked |
| 25 | Cart | Get Cart | GET | `/api/v1/cart` | Required | Cart, Checkout, Payment | P0 | mocked |
| 26 | Cart | Upsert Cart Item | PUT | `/api/v1/cart/items/{productId}` | Required | Product, Shop, Cart | P0 | mocked |
| 27 | Cart | Remove Cart Item | DELETE | `/api/v1/cart/items/{productId}` | Required | Cart | P0 | mocked |
| 28 | Cart | Clear Cart | DELETE | `/api/v1/cart` | Required | After order, Cart | P0 | mocked |
| 29 | Cart | Cart / Checkout Quote | POST | `/api/v1/checkout/quote` | Required | Cart, Checkout, Payment | P0 | mocked |
| 30 | Wishlist | Get Wishlist | GET | `/api/v1/wishlist` | Required | `wishlist.tsx` | P1 | mocked |
| 31 | Wishlist | Add Wishlist Item | POST | `/api/v1/wishlist/items` | Required | Product, ProductCard | P1 | mocked |
| 32 | Wishlist | Remove Wishlist Item | DELETE | `/api/v1/wishlist/items/{productId}` | Required | Wishlist, Product | P1 | mocked |
| 33 | Coupons | List Coupons | GET | `/api/v1/coupons` | Required | `coupons.tsx` | P1 | mocked |
| 34 | Coupons | Collect Coupon | POST | `/api/v1/coupons/{couponId}/collect` | Required | `coupons.tsx` | P1 | mocked |
| 35 | Coupons | Validate Coupon | POST | `/api/v1/coupons/validate` | Required | Cart, Checkout | P1 | mocked |
| 36 | Orders | Place Order | POST | `/api/v1/orders` | Required | `payment.tsx` | P0 | mocked |
| 37 | Orders | List Orders | GET | `/api/v1/orders` | Required | `orders.tsx`, Profile | P0 | mocked |
| 38 | Orders | Get Order | GET | `/api/v1/orders/{orderId}` | Required | `order/[id].tsx` | P0 | mocked |
| 39 | Orders | Get Active Order | GET | `/api/v1/orders/active` | Required | `(tabs)/track.tsx` | P0 | mocked |
| 40 | Orders | Cancel Order | POST | `/api/v1/orders/{orderId}/cancel` | Required | Order detail, Track | P0 | mocked |
| 41 | Orders | Request Return | POST | `/api/v1/orders/{orderId}/returns` | Required | Order detail, Returns | P1 | mocked |
| 42 | Orders | List Returns | GET | `/api/v1/returns` | Required | `returns.tsx` | P1 | mocked |
| 43 | Orders | Get Order Tracking | GET | `/api/v1/orders/{orderId}/tracking` | Required | Track, Order detail | P0 | mocked |
| 44 | Payments | List Payment Methods | GET | `/api/v1/payments/methods` | Required | Checkout, Payment, My Payment | P0 | mocked |
| 45 | Payments | Initiate Online Payment | POST | `/api/v1/payments/initiate` | Required | `payment.tsx` | P0 | not_implemented |
| 46 | Payments | Confirm / Verify Payment | POST | `/api/v1/payments/confirm` | Required | Payment callback | P0 | not_implemented |
| 47 | Payments | Get/Update Payment Prefs | GET/PATCH | `/api/v1/customers/me/payment-preferences` | Required | `my-payment.tsx` | P1 | mocked |
| 48 | Transactions | List Transactions | GET | `/api/v1/transactions` | Required | `transactions.tsx` | P1 | mocked |
| 49 | Wallet | Get Wallet | GET | `/api/v1/wallet` | Required | `wallet.tsx` | P2 | not_implemented |
| 50 | Wallet | Top Up Wallet | POST | `/api/v1/wallet/top-up` | Required | `wallet.tsx` (disabled UI) | P2 | not_implemented |
| 51 | Reviews | List Product Reviews | GET | `/api/v1/products/{productId}/reviews` | Optional | `product/[id].tsx` | P1 | mocked |
| 52 | Reviews | Create Product Review | POST | `/api/v1/products/{productId}/reviews` | Required | PDP, `product-review.tsx` | P1 | mocked |
| 53 | Reviews | Vote Review | POST | `/api/v1/reviews/{reviewId}/vote` | Required | PDP reviews panel | P2 | mocked |
| 54 | Reviews | Delivery Review | POST | `/api/v1/orders/{orderId}/delivery-review` | Required | `delivery-review.tsx` | P1 | mocked |
| 55 | Notifications | List Notifications | GET | `/api/v1/notifications` | Required | `notifications.tsx` | P1 | mocked |
| 56 | Notifications | Mark Notification Read | PATCH | `/api/v1/notifications/{id}/read` | Required | `notifications.tsx` | P1 | mocked |
| 57 | Notifications | Mark All Read | POST | `/api/v1/notifications/read-all` | Required | `notifications.tsx` | P1 | mocked |
| 58 | Notifications | Clear Inbox | DELETE | `/api/v1/notifications` | Required | `notifications.tsx` | P2 | mocked |
| 59 | Notifications | Register Push Token | POST | `/api/v1/notifications/push-token` | Required | App launch / settings | P1 | not_implemented |
| 60 | Notifications | Notification Preferences | GET/PATCH | `/api/v1/customers/me/notification-preferences` | Required | `settings.tsx` | P1 | mocked |
| 61 | Support | List FAQs | GET | `/api/v1/support/faqs` | Public | `help.tsx`, FAQ detail | P2 | mocked |
| 62 | Support | Get Chat Thread | GET | `/api/v1/support/chat` | Required | `support/chat.tsx` | P2 | mocked |
| 63 | Support | Send Chat Message | POST | `/api/v1/support/chat/messages` | Required | `support/chat.tsx` | P2 | mocked |
| 64 | Support | List Complaints | GET | `/api/v1/support/complaints` | Required | `complaints/index.tsx` | P1 | mocked |
| 65 | Support | Create Complaint | POST | `/api/v1/support/complaints` | Required | `complaints/new.tsx` | P1 | mocked |
| 66 | Support | Get Complaint | GET | `/api/v1/support/complaints/{id}` | Required | `complaints/[id].tsx` | P1 | mocked |
| 67 | Referral | Get Referral Code | GET | `/api/v1/referrals/me` | Required | `invite.tsx` | P2 | mocked |
| 68 | Content | Privacy Policy | GET | `/api/v1/content/privacy` | Public | `privacy.tsx` | P2 | mocked |
| 69 | Content | Terms & Conditions | GET | `/api/v1/content/terms` | Public | `terms.tsx` | P2 | mocked |
| 70 | Media | Upload Media | POST | `/api/v1/media/upload` | Required | Returns photos, reviews, chat | P1 | not_implemented |

---

## Totals (calculated from table above)

| Metric | Count |
|---|---|
| **Total unique APIs required** | **70** |
| APIs already integrated | **2** (#1 Send OTP, #2 Resend OTP — fully usable today for registered mobiles) |
| APIs partially integrated | **4** (#3 Verify OTP, #4 Register, #16 List Products documented-but-unwired / incomplete session) |
| APIs using mock / local data | **49** |
| APIs not implemented (no mock UI path that fully covers them, or blocked placeholder) | **15** |
| **P0 API count** | **29** |
| **P1 API count** | **27** |
| **P2 API count** | **14** |
| **Total screens / routes inspected** | **51** |

### Notes on counts

- **Integrated (2):** Only send-otp and resend-otp behave as fully usable live calls for the registered-customer path without needing unpublished response fields.
- **Partial (4):** Verify OTP and Register are called live, but session tokens, OTP-first unregistered Success shape, and `MobileVerificationToken` are incomplete per `docs/backend-requirements.md`. `GET /api/values/products` is referenced in code comments and docs but `LIVE_CATALOGUE_CONNECTED = false` and is never called.
- **Mocked (49):** UI exists and uses SecureStore, in-memory preview, or hardcoded fixtures.
- **Not implemented (15):** Needed for production honesty / blocked UI paths (refresh, logout revoke, payment initiate/confirm, push token, wallet, media upload, serviceability). Some have placeholder screens.
- Priority counts: 29 + 27 + 14 = 70.
- Status counts: 2 + 4 + 49 + 15 = 70.
- Screens inspected include all `src/app/**` route files excluding `_layout.tsx` files (root + tabs layouts). Dev-only `uilab.tsx` is counted; Expo template `explore.tsx` is counted as present but not grocery-critical.

### Module totals

| Module | API count |
|---|---|
| Authentication | 6 |
| Profile | 3 |
| Addresses | 5 |
| Location | 1 |
| Catalog | 7 |
| Stores | 2 |
| Cart | 5 |
| Wishlist | 3 |
| Coupons | 3 |
| Orders | 8 |
| Payments | 4 |
| Transactions | 1 |
| Wallet | 2 |
| Reviews | 4 |
| Notifications | 6 |
| Support | 6 |
| Referral | 1 |
| Content | 2 |
| Media | 1 |
| **Total** | **70** |
