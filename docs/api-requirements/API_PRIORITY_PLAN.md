# API Priority Plan — MayapurBazaar Grocery App

Practical build order for the backend developer. Priorities map to the master table in `API_ENDPOINT_SUMMARY.md`.

---

## Priority definitions

| Priority | Meaning |
|---|---|
| **P0** | Required for the main shopper journey: auth → browse → cart → checkout → order → track |
| **P1** | Important secondary: wishlist, coupons, returns, reviews, notifications, support tickets |
| **P2** | Optional / future: wallet, stores network, brands, FAQ CMS, referral rewards |

---

## P0 — Critical APIs (build first)

| API Name | Method | Endpoint | Related screen | Backend dependency | Reason |
|---|---|---|---|---|---|
| Send OTP | POST | `/api/values/customer/send-otp` | Login | SMS provider | Entry to app; extend for unregistered mobiles (OTP-first) |
| Resend OTP | POST | `/api/values/customer/resend-otp` | OTP | Send OTP | Resend UX already wired |
| Verify OTP | POST | `/api/values/customer/verify-otp` | OTP | OTP store | Must return Success + customer fields + **AccessToken**; unregistered pending shape |
| Register Customer | POST | `/api/values/customer/register` | Complete profile / location | Verify token | Completes new-customer onboarding |
| Refresh Session | POST | `/api/v1/auth/refresh` | App-wide | AccessToken issuance | Keeps commerce calls authenticated |
| Get Profile | GET | `/api/v1/customers/me` | Profile / Edit profile | Auth | Identity for checkout headers |
| Update Profile | PATCH | `/api/v1/customers/me` | Edit profile | Auth | Name/email/DOB sync |
| List Addresses | GET | `/api/v1/customers/me/addresses` | Addresses, Checkout | Auth | Delivery selection |
| Create Address | POST | `/api/v1/customers/me/addresses` | Address form | Auth | Onboarding + checkout |
| Update Address | PATCH | `/api/v1/customers/me/addresses/{id}` | Address form | Auth | Edit book |
| Delete Address | DELETE | `/api/v1/customers/me/addresses/{id}` | Addresses | Auth | Manage book |
| Set Default Address | PUT | `/api/v1/customers/me/addresses/{id}/default` | Addresses | Auth | Default delivery |
| Check Serviceability | GET | `/api/v1/delivery/serviceability` | Location, Checkout | Geo / store config | Block unserviceable pin/coords |
| List Products | GET | `/api/values/products` | Shop, Home | Company id | Core catalogue |
| Get Product Details | GET | `/api/v1/products/{id}` | Product PDP | Products | PDP fields + stock |
| List Categories | GET | `/api/v1/categories` | Home, Shop, Category | Catalogue | Navigation |
| Get Home Feed | GET | `/api/v1/home` | Home | Products + CMS | Banners + rails |
| Get Cart | GET | `/api/v1/cart` | Cart | Auth + products | Persist cart |
| Upsert Cart Item | PUT | `/api/v1/cart/items/{productId}` | PDP, Shop, Cart | Stock | Add/update qty |
| Remove Cart Item | DELETE | `/api/v1/cart/items/{productId}` | Cart | Cart | Remove line |
| Clear Cart | DELETE | `/api/v1/cart` | After order | Cart | Reset |
| Checkout Quote | POST | `/api/v1/checkout/quote` | Cart, Checkout, Payment | Cart + fees + coupons | **Server totals** |
| List Payment Methods | GET | `/api/v1/payments/methods` | Checkout, Payment | Config | COD / UPI / Card availability |
| Initiate Online Payment | POST | `/api/v1/payments/initiate` | Payment | Gateway | UPI/Card (if offered in v1) |
| Confirm Payment | POST | `/api/v1/payments/confirm` | Payment callback | Gateway webhooks | Never trust client “paid” |
| Place Order | POST | `/api/v1/orders` | Payment | Quote + stock + payment | Create order idempotently |
| List Orders | GET | `/api/v1/orders` | Orders, Profile | Orders | History |
| Get Order | GET | `/api/v1/orders/{id}` | Order detail | Orders | Detail |
| Get Active Order | GET | `/api/v1/orders/active` | Track tab | Orders | Live journey |
| Cancel Order | POST | `/api/v1/orders/{id}/cancel` | Order detail, Track | Status rules | Cancel before delivered |
| Get Order Tracking | GET | `/api/v1/orders/{id}/tracking` | Track | Logistics | Map/ETA/partner |

**P0 count: 29** (includes both COD-only and online payment pair; if MVP is COD-only, initiate/confirm can slip to immediate P1 but remain security-critical before enabling UPI/Card UI).

---

## P1 — Important APIs

| API Name | Method | Endpoint | Related screen | Backend dependency | Reason |
|---|---|---|---|---|---|
| Logout / Revoke | POST | `/api/v1/auth/logout` | Settings, Profile | Token store | Invalidate server session |
| Upload Avatar | POST | `/api/v1/customers/me/avatar` | Edit profile | Media | Profile photo |
| Search Suggestions | GET | `/api/v1/search/suggestions` | Shop | Catalogue search | Typeahead |
| Get Collection | GET | `/api/v1/collections/{id}` | Collection | Catalogue | Home shortcuts |
| Wishlist GET/POST/DELETE | GET/POST/DELETE | `/api/v1/wishlist…` | Wishlist, PDP | Auth | Favourites |
| List Coupons | GET | `/api/v1/coupons` | Coupons | Offers engine | Promos |
| Collect Coupon | POST | `/api/v1/coupons/{id}/collect` | Coupons | Offers | Save for later |
| Validate Coupon | POST | `/api/v1/coupons/validate` | Cart, Checkout | Quote | Discount amount |
| Request Return | POST | `/api/v1/orders/{id}/returns` | Returns, Order detail | Orders + media | Returns |
| List Returns | GET | `/api/v1/returns` | Returns | Returns | Hub |
| Payment Preferences | GET/PATCH | `/api/v1/customers/me/payment-preferences` | My Payment | Auth | Preferred method |
| List Transactions | GET | `/api/v1/transactions` | Transactions | Payments ledger | History |
| Product Reviews list/create | GET/POST | `/api/v1/products/{id}/reviews` | PDP, product-review | Auth for write | Social proof |
| Delivery Review | POST | `/api/v1/orders/{id}/delivery-review` | delivery-review | Delivered order | Partner rating |
| Notifications list/read/read-all | GET/PATCH/POST | `/api/v1/notifications…` | Notifications | Auth | Inbox |
| Register Push Token | POST | `/api/v1/notifications/push-token` | App | FCM/APNs | Push |
| Notification Preferences | GET/PATCH | `/api/v1/customers/me/notification-preferences` | Settings | Auth | Order/offer toggles |
| Complaints list/create/get | GET/POST/GET | `/api/v1/support/complaints…` | Complaints | Ticketing | Support |
| Upload Media | POST | `/api/v1/media/upload` | Returns, reviews, chat | Object storage | Evidence photos |

**P1 count: 27** (wishlist counted as 3 endpoints; complaints as 3; notifications as 4+prefs+push; etc. — see summary table).

---

## P2 — Optional / Future

| API Name | Method | Endpoint | Related screen | Reason |
|---|---|---|---|---|
| List Brands | GET | `/api/v1/brands` | Home | Decorative until brand filter ships |
| List/Get Stores | GET | `/api/v1/stores…` | Stores | Multi-store may be marketing-only |
| Clear Inbox | DELETE | `/api/v1/notifications` | Notifications | Nice-to-have |
| Vote Review | POST | `/api/v1/reviews/{id}/vote` | PDP | Engagement |
| Get Wallet / Top-up | GET/POST | `/api/v1/wallet…` | Wallet | UI explicitly not connected |
| FAQs | GET | `/api/v1/support/faqs` | Help | Static content works today |
| Support chat GET/POST | GET/POST | `/api/v1/support/chat…` | Chat | Needs agent ops |
| Referral code | GET | `/api/v1/referrals/me` | Invite | Rewards undefined |
| Privacy / Terms content | GET | `/api/v1/content/…` | Legal screens | Can stay static |

**P2 count: 14**

---

## Suggested implementation sequence

### Phase A — Auth completion (week 1)

1. OTP-first send-otp for unregistered mobiles  
2. Verify Success shapes (registered + unregistered)  
3. `AccessToken` (+ refresh) on verify/register  
4. Register accepts `MobileVerificationToken`  
5. Profile GET/PATCH  
6. Address CRUD + default  

**Frontend can then drop TemporaryUiLogin for Authorization.**

### Phase B — Catalogue (week 1–2)

1. Publish products JSON + company id  
2. Categories tree  
3. Product details  
4. Home feed / banners  

**Frontend flips `LIVE_CATALOGUE_CONNECTED`.**

### Phase C — Cart & checkout (week 2–3)

1. Server cart  
2. Serviceability  
3. Checkout quote (fees, discounts, stock)  
4. Payment methods  
5. Place order (COD first)  
6. Idempotency  

**Frontend can replace MockCart + PreviewSession placeOrder.**

### Phase D — Orders & tracking (week 3)

1. List / get / active order  
2. Cancel  
3. Tracking payload  
4. Online payment initiate/confirm (if in scope)

### Phase E — Secondary (week 4+)

Wishlist, coupons, returns, reviews, notifications, complaints, media upload.

### Phase F — Future

Wallet, stores, referral, FAQ CMS, chat agents, brands filter.

---

## Dependency graph (high level)

```text
Auth (OTP + AccessToken)
  └─ Profile / Addresses
       └─ Serviceability
            └─ Catalogue (products, categories, home)
                 └─ Cart + Quote
                      └─ Place Order (+ Payment)
                           └─ Orders / Tracking / Cancel
                                └─ Returns / Reviews / Notifications
```

---

## MVP cut recommendation (evidence-based)

**Minimum to exit UI preview for a real purchase:**

- Phase A + B + C with **COD only**  
- Phase D list/detail/active/tracking/cancel  

**Defer safely for first release:** wallet top-up, multi-store, referral rewards, live chat agents, brand API, FAQ CMS, review voting.
