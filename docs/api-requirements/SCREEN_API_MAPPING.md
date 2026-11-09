# Screen-by-Screen API Mapping — MayapurBazaar Grocery App

For each existing route/screen: purpose, data, actions, APIs, auth, loading/error, current source.  
Only APIs justified by the actual UI are listed. Exact paths for new APIs are **proposed** (`/api/v1/...`) unless already live under `/api/values/...`.

---

## Auth & onboarding

### Splash — `src/app/index.tsx`

| Field | Detail |
|---|---|
| Purpose | Brand splash; route by session / mid-onboarding |
| Data displayed | Logo only |
| User actions | None (auto-navigate) |
| APIs | None (reads local auth hydrate) |
| Auth | N/A |
| Loading / error | Waits `AuthSession` hydrate |
| Current source | Local SecureStore temporary login / mobile verification |
| Reuse | — |

### Intro — `src/app/intro.tsx`

| Field | Detail |
|---|---|
| Purpose | Marketing onboarding |
| Data | Static copy/images |
| Actions | Continue → Login |
| APIs | None |
| Current source | Hardcoded |

### Login — `src/app/login.tsx`

| Field | Detail |
|---|---|
| Purpose | Enter India mobile; start OTP or registration path |
| Data | Mobile input; remembered customer prefill |
| Actions | Continue → send OTP |
| APIs | **POST** `/api/values/customer/send-otp` `{ Mobile }` |
| Why | Determines registered vs unregistered; dispatches OTP when registered |
| Auth | Public |
| Loading / error | Button loading; toast/message from `CustomerApiResult` |
| Current source | Live API (blocked when Dev OTP on) |
| Reuse | Same send-otp used after classic registration |

### OTP — `src/app/otp.tsx`

| Field | Detail |
|---|---|
| Purpose | Enter 6-digit OTP; verify; optional Android SMS autofill |
| Data | Mobile, OTP boxes, resend timer, Dev mock toggles (dev only) |
| Actions | Verify; Resend; change number |
| APIs | **POST** `/api/values/customer/verify-otp` `{ Mobile, OTP }` · **POST** `/api/values/customer/resend-otp` `{ Mobile }` |
| Auth | Public |
| Loading / error | Verify spinner; invalid/expired OTP messages |
| Current source | Live API (+ Dev OTP local simulation) |
| Notes | On Success → temporary UI login or complete-profile (OTP-first) |

### Complete profile — `src/app/complete-profile.tsx`

| Field | Detail |
|---|---|
| Purpose | Collect name/email for new customers |
| Data | Name, email draft |
| Actions | Continue → location → register |
| APIs | Eventually **POST** `/api/values/customer/register` (via location confirm) |
| Auth | Public (verified mobile preferred) |
| Current source | Draft local; register live |

### Location search — `src/app/location.tsx`

| Field | Detail |
|---|---|
| Purpose | Search / pick delivery location |
| Data | Search results (local refs + device geocode) |
| Actions | Select result; open map; use GPS; manual entry |
| APIs | **GET** `/api/v1/delivery/serviceability?postalCode=&lat=&lng=` (proposed) |
| Auth | Optional |
| Current source | `expo-location` + `referenceLocations.ts` |
| Reuse | Same serviceability for checkout address |

### Location map — `src/app/location-map.tsx`

| Field | Detail |
|---|---|
| Purpose | Pin delivery point on MapLibre map |
| Data | Lat/lng, reverse-geocoded address |
| Actions | Confirm pin |
| APIs | Serviceability (proposed); geocode remains client |
| Current source | Device reverse geocode |

### Location manual — `src/app/location-manual.tsx`

| Field | Detail |
|---|---|
| Purpose | Type address fields manually |
| Data | Line, landmark, city, state, PIN |
| Actions | Confirm |
| APIs | Serviceability by PIN (proposed) |
| Current source | Form local |

### Edit profile / My Account — `src/app/edit-profile.tsx`

| Field | Detail |
|---|---|
| Purpose | View/edit name, email, DOB, avatar |
| Data | `CustomerProfile` |
| Actions | Save; pick camera/gallery/preset avatar |
| APIs | **GET/PATCH** `/api/v1/customers/me` · **POST** `/api/v1/customers/me/avatar` |
| Auth | Required |
| Loading / error | Local save toast today |
| Current source | SecureStore `customerProfileStore` |

### Addresses — `src/app/addresses.tsx`

| Field | Detail |
|---|---|
| Purpose | Address book list; select mode for checkout |
| Data | `SavedAddress[]` |
| Actions | Add, edit, delete, set default, select |
| APIs | Address CRUD + default (see summary #10–14) |
| Auth | Required |
| Current source | SecureStore |

### Address form — `src/app/address-form.tsx`

| Field | Detail |
|---|---|
| Purpose | Create/edit saved address |
| Data | Label, house, street, area, city, state, PIN, landmark, instructions, lat/lng |
| Actions | Save; change map pin |
| APIs | POST/PATCH address |
| Auth | Required |
| Current source | Local |

---

## Main tabs

### Home — `src/app/(tabs)/home.tsx`

| Field | Detail |
|---|---|
| Purpose | Discovery feed |
| Data displayed | Greeting, delivery header, promo banners, recommended/recent/spotlight/popular/bought-again/top-selling products, categories, brands, stores row, dry fruits section |
| Actions | Open PDP, collections, shop, stores, search/QR/menu via header |
| APIs | **GET** `/api/v1/home` · **GET** `/api/v1/categories` · products endpoints · optional brands/stores |
| Auth | Tab requires signed-in UI session |
| Loading / error | None (static fixtures) |
| Current source | `homeFeed.ts`, `homePromoBanners.ts`, mocks |
| Reuse | Product cards share catalogue APIs |

### Shop — `src/app/(tabs)/shop.tsx`

| Field | Detail |
|---|---|
| Purpose | Category shelves + searchable/filterable grid |
| Data | Shelves, products, filters (price, stock, discount, rating), sort |
| Actions | Select shelf; search; filter/sort; open PDP |
| APIs | **GET** `/api/values/products` (filters/sort/q) · **GET** `/api/v1/categories` · **GET** `/api/v1/search/suggestions` |
| Auth | Required (tab gate) |
| Current source | `shopCatalog` + local filter utils; `LIVE_CATALOGUE_CONNECTED=false` |

### Cart — `src/app/(tabs)/cart.tsx` → `ReviewCartScreen`

| Field | Detail |
|---|---|
| Purpose | Review lines, bill, coupon, address, continue checkout |
| Data | Quantities, product rows, MRP/savings, fees (0 or demo), coupon, leave-at-door, address |
| Actions | +/- qty; coupons; address; continue |
| APIs | Cart GET/upsert/remove · **POST** `/api/v1/checkout/quote` · coupons validate |
| Auth | Required |
| Loading / error | Missing SKU rows cleaned locally |
| Current source | `MockCartContext` + demo bill |

### Track — `src/app/(tabs)/track.tsx` → `OrderTrackingScreen`

| Field | Detail |
|---|---|
| Purpose | Active order tracking map + sheet |
| Data | Status, ETA, partner, timeline, demo map |
| Actions | Call partner, chat, cancel/return/review, view order |
| APIs | **GET** `/api/v1/orders/active` · **GET** `/api/v1/orders/{id}/tracking` · cancel/return |
| Auth | Required |
| Current source | Preview orders + `demoOrderTracking`; live `readActiveOrder()` empty |

### Profile tab — `src/app/(tabs)/profile.tsx`

| Field | Detail |
|---|---|
| Purpose | Account hub + past orders empty state |
| Data | Identity; past orders (empty live) |
| Actions | Navigate account routes; logout |
| APIs | Profile GET · Orders list · logout revoke (proposed) |
| Current source | Auth contexts + `readPastOrders()` empty |

### Top Picks — `src/app/(tabs)/top-picks.tsx`

| Field | Detail |
|---|---|
| Purpose | “Popular this week” grid |
| Data | `topSelling` products |
| APIs | Home/products popular section |
| Current source | `homeFeed.topSelling` (preview gated messaging) |

### Stores tab — `src/app/(tabs)/stores.tsx`

| Field | Detail |
|---|---|
| Purpose | Nearby stores list |
| Data | Demo store cards |
| APIs | **GET** `/api/v1/stores` |
| Current source | `DEMO_STORES` when preview; else placeholder |

---

## Catalogue & product

### Product details — `src/app/product/[id].tsx`

| Field | Detail |
|---|---|
| Purpose | PDP: gallery, price, stock, about, reviews, related, add to cart, wishlist |
| Data | `DemoProduct` + brand/about + review summary |
| Actions | Qty; add cart; wishlist; write review; vote helpful |
| APIs | Product GET · Cart upsert · Wishlist · Reviews GET/POST/vote |
| Auth | Optional for read; Required for write actions (wishlist/review currently local) |
| Current source | Local catalogue + review stores |

### Category parent — `src/app/category/[id].tsx`

| Field | Detail |
|---|---|
| Purpose | Subcategory grid |
| Data | Parent + subcategories with counts |
| APIs | Categories tree |
| Current source | `subcategoryCatalog.ts` |

### Collection — `src/app/collection/[id].tsx`

| Field | Detail |
|---|---|
| Purpose | Home shortcut shopping (fresh, diwali, …) |
| Data | Hero, chips, products |
| APIs | **GET** `/api/v1/collections/{id}` or filtered products |
| Current source | `shoppingCollections.ts` heuristics |

### Buy Again — `src/app/buy-again.tsx`

| Field | Detail |
|---|---|
| Purpose | Repeat purchase list |
| Data | Local “bought again” fixtures |
| APIs | Derived from **GET** `/api/v1/orders` delivered lines (proposed) |
| Current source | `listBuyAgainProducts()` |

### Store detail — `src/app/store/[id].tsx`

| Field | Detail |
|---|---|
| Purpose | Single store profile |
| APIs | **GET** `/api/v1/stores/{id}` |
| Current source | Demo store; preview |

### Scan QR — `src/app/scan-qr.tsx`

| Field | Detail |
|---|---|
| Purpose | Camera/gallery QR → in-app deep link |
| APIs | None directly; navigates to product/order/shop/category/coupons |
| Current source | Client parser `qrScanResult.ts` (blocks payment QRs) |

---

## Checkout & payment

### Checkout — `src/app/checkout.tsx` → `CheckoutScreen`

| Field | Detail |
|---|---|
| Purpose | Address, instructions, leave-at-door, lines, method, coupon, bill → payment |
| Data | Address, customer name/phone, bill (demo fee ₹29), methods COD/UPI/Card |
| Actions | Change address; qty; method; continue to payment |
| APIs | Quote · addresses · payment methods |
| Auth | Required |
| Loading / error | Placeholder if `!UI_PREVIEW_MODE` |
| Current source | Preview fixtures + MockCart |

### Payment — `src/app/payment.tsx` → `PaymentScreen`

| Field | Detail |
|---|---|
| Purpose | Final method select; place COD demo order or block online |
| Actions | Place Order (COD demo); switch method |
| APIs | **POST** `/api/v1/orders` · **POST** `/api/v1/payments/initiate` · **POST** `/api/v1/payments/confirm` |
| Auth | Required |
| Current source | `PreviewSession.placeOrder` for COD only |
| Business rule | Must be idempotent; never trust client totals |

### Order confirmed — `src/app/order-confirmed.tsx`

| Field | Detail |
|---|---|
| Purpose | Post-place confirmation |
| Data | Order id, totals, payment label, address |
| APIs | Uses placed order id → Get Order / Track |
| Current source | Preview session |

---

## Orders & returns

### Orders list — `src/app/orders.tsx`

| Field | Detail |
|---|---|
| Purpose | History with filters (all/active/delivered) |
| APIs | **GET** `/api/v1/orders` |
| Current source | Preview session orders; empty when preview off |

### Order detail — `src/app/order/[id].tsx`

| Field | Detail |
|---|---|
| Purpose | Timeline, items, cancel/return/reviews/track |
| APIs | Get Order · Cancel · Return · Tracking · Reviews |
| Current source | Preview / empty past |

### Returns — `src/app/returns.tsx`

| Field | Detail |
|---|---|
| Purpose | Return hub + policy steps |
| APIs | List returns · Request return |
| Current source | Preview only |

### Delivery review — `src/app/delivery-review.tsx`

| Field | Detail |
|---|---|
| Purpose | Rate delivery partner |
| APIs | **POST** `/api/v1/orders/{id}/delivery-review` |
| Current source | SecureStore |

### Product order review — `src/app/product-review.tsx`

| Field | Detail |
|---|---|
| Purpose | Rate products from an order |
| APIs | Product review create (per line) |
| Current source | Local review stores |

---

## Account extras

### Wishlist — `src/app/wishlist.tsx`

| APIs | Wishlist GET/POST/DELETE |
| Current | SecureStore ids + local products |

### Coupons — `src/app/coupons.tsx`

| APIs | List / collect / validate coupons |
| Current | `DEMO_COUPONS` + local collection; preview only |

### Notifications — `src/app/notifications.tsx`

| APIs | List / mark read / read-all / clear |
| Current | Demo seed + inbox SecureStore overlay; preview |

### Wallet — `src/app/wallet.tsx`

| APIs | Get wallet · top-up (UI disabled) |
| Current | Placeholder / not connected |

### Transactions — `src/app/transactions.tsx`

| APIs | **GET** `/api/v1/transactions` |
| Current | `DEMO_TRANSACTIONS`; preview |

### My Payment — `src/app/my-payment.tsx`

| APIs | Payment preferences GET/PATCH |
| Current | Local prefs + demo card visual |

### Invite — `src/app/invite.tsx`

| APIs | **GET** `/api/v1/referrals/me` |
| Current | Client-derived demo code; preview |

### Settings — `src/app/settings.tsx`

| APIs | Notification preferences · Logout revoke |
| Current | Local toggles; local logout |
| Note | Account deletion explicitly not offered |

### Help — `src/app/help.tsx`

| APIs | FAQs (optional CMS) |
| Current | `supportFaq.ts` |

### FAQ detail — `src/app/support/faq/[id].tsx`

| APIs | FAQ by id (optional) |
| Current | Local |

### Support chat — `src/app/support/chat.tsx`

| APIs | Chat GET/POST + media upload |
| Current | SecureStore thread; no live agent |

### Complaints list/new/detail — `src/app/complaints/*`

| APIs | Complaints CRUD/list |
| Current | SecureStore `LOCAL-*`; preview gated |

### Privacy / Terms — `src/app/privacy.tsx`, `terms.tsx`

| APIs | Optional content GET |
| Current | Static / placeholder |

### Menu placeholder — `src/app/menu.tsx`

| APIs | None |
| Current | Coming soon |

### Explore — `src/app/explore.tsx`

| APIs | None (Expo template leftover) |
| Note | Not part of grocery journey |

### UI Lab — `src/app/uilab.tsx`

| APIs | None (dev visual lab) |

---

## Cross-cutting UI shells

| Component | Path | API impact |
|---|---|---|
| Side menu | `src/components/home/SideMenu.tsx` | Logout local; navigates mapped routes |
| Delivery header | `src/components/home/DeliveryHeader.tsx` | Address + notifications entry |
| Floating tab bar | `src/components/navigation/FloatingTabBar.tsx` | Cart badge from MockCart `totalCount` → should use cart GET |

---

## Screens inspected: 51

Counted from `src/app/**/*.tsx` route files excluding `_layout.tsx` (2 layouts).
