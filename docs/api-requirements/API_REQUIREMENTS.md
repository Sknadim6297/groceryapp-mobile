# Complete API Requirements — MayapurBazaar Grocery App

**Audience:** Backend developers  
**Source:** Existing Expo frontend inspection (2026-11-09)  
**Rule:** Response field lists are derived from frontend types and UI needs. Existing live routes keep their current paths and PascalCase bodies.

**Legend**

- **CONFIRMED** — already called or documented against the live host  
- **REQUIRED (from UI)** — frontend feature exists; needs backend  
- **PROPOSED** — recommended for production honesty; confirm with product  

Proposed new paths use `/api/v1/...`. Confirm whether they should instead follow `/api/values/...`.

---

## Global conventions (proposed for new APIs)

### Success envelope (recommended — publish if adopted)

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

### Error envelope

```json
{
  "success": false,
  "message": "Human readable message",
  "code": "MACHINE_CODE",
  "details": {}
}
```

### Existing customer API convention (CONFIRMED)

Bodies may be object or array-of-one. Parser reads `Status`/`status`, `Message`/`message`, `CustomerId`, `Name`, `Mobile`, and token-like fields. HTTP 200 alone is insufficient.

### Authentication header (PROPOSED — required for commerce)

```http
Authorization: Bearer <AccessToken>
```

Until published, the app must not invent Authorization.

### Pagination (PROPOSED)

```text
?page=1&pageSize=20
```

Response:

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

### Currency

INR amounts as numbers (rupees). Frontend formats with `₹`. Clarify paise vs whole rupees before shipping — UI currently treats amounts as whole rupees.

---

# Module 1 — Authentication

## 1.1 Send OTP — CONFIRMED

**API Name:** Send OTP  
**Method:** POST  
**Endpoint:** `/api/values/customer/send-otp`  
**Purpose:** Start login / detect registration standing; dispatch SMS OTP.  
**Frontend Used In:** `src/app/login.tsx`, post-register flow via `src/services/customerAuth.ts`  
**Authentication:** Public  

**Request Body:**

```json
{ "Mobile": "9876543210" }
```

| Field | Type | Required | Validation |
|---|---|---|---|
| Mobile | string | Yes | 10-digit India national number |

**Success (registered — observed desired):** HTTP 200, `Status: "Success"`, OTP-sent message.  
**Current unregistered behaviour (live probe noted in docs):** Failed + “Customer is not registered…” — **blocks OTP-first UX**.  

**Required change (CONFIRMED product desire):** Unregistered mobiles must also receive OTP and return Success OTP-sent wording.

**Error example:**

```json
[{ "Status": "Failed", "Message": "Unable to send OTP. Please try again." }]
```

**Business rules:** Rate limit; do not reveal whether rate-limited vs invalid beyond safe messages.  
**Assumptions:** SMS provider is server-owned.

---

## 1.2 Resend OTP — CONFIRMED

**Method:** POST `/api/values/customer/resend-otp`  
**Frontend:** `src/app/otp.tsx` → `resendCustomerOtp`  
**Body:** `{ "Mobile": string }`  
**Auth:** Public  
**Rules:** Cooldown; invalidate previous OTP or allow last-N window — publish policy.

---

## 1.3 Verify OTP — CONFIRMED (partial contract)

**Method:** POST `/api/values/customer/verify-otp`  
**Frontend:** `src/app/otp.tsx` → `verifyCustomerOtp`  
**Body:**

```json
{ "Mobile": "9876543210", "OTP": "123456" }
```

| Field | Type | Required |
|---|---|---|
| Mobile | string | Yes |
| OTP | string | Yes, length 6 |

**Success — registered (REQUIRED):**

```json
{
  "Status": "Success",
  "Message": "OTP verified successfully",
  "CustomerId": "C123",
  "Name": "Asha",
  "Mobile": "9876543210",
  "AccessToken": "<server-issued>"
}
```

**Success — unregistered OTP-first (REQUIRED):**

```json
{
  "Status": "Success",
  "Message": "Mobile verified. Complete registration.",
  "IsRegistered": false,
  "MobileVerificationToken": "<server-issued>",
  "Mobile": "9876543210"
}
```

App also accepts `RegistrationRequired: true` or `CustomerStanding: "unregistered"` patterns (`interpretCustomerResponse.ts`).

**Errors:** Invalid/expired/reused OTP → Failed with clear message.  
**Frontend behaviour today:** Builds TemporaryUiLogin on Success; does not attach AccessToken to Axios yet.  
**Empty data:** Missing CustomerId/Name still allows temporary login with mobile-derived placeholders — prefer always returning them for registered users.

---

## 1.4 Register Customer — CONFIRMED (partial)

**Method:** POST `/api/values/customer/register`  
**Frontend:** `src/services/customerAuth.ts` `buildCustomerRegistration` / `registerCustomer`  
**Auth:** Public (should require MobileVerificationToken when OTP-first)

**Request (fields the app actually sends):**

```json
{
  "Mobile": "9876543210",
  "Name": "Asha Devi",
  "Email": "asha@example.com",
  "Address": "12 Tulsi Lane, Mayapur",
  "DOB": "1994-05-12",
  "Country": "India",
  "State": "West Bengal",
  "City": "Mayapur",
  "Pincode": "741313",
  "MobileVerificationToken": "<optional>"
}
```

| Field | Required in app | Notes |
|---|---|---|
| Mobile, Name, Email | Yes (email may be empty string today — confirm) | Email validated if non-empty |
| Address | Yes for registration path | From delivery location |
| DOB | Optional | ISO date |
| Country/State/City/Pincode | Optional | From location |
| MobileVerificationToken | Optional | Only if verify returned token |
| CompanyMobile, WhatsApp, Anniversary, GST* | **Not sent** | Help page lists them; app does not collect |

**Success REQUIRED:** Status Success, CustomerId, Name, Mobile, AccessToken preferred.  
**Duplicate:** Failed message matching already-registered patterns → UI returns to Login.  
**Business rule:** If mobile already verified via OTP-first, do not require a second OTP.

---

## 1.5 Refresh Session — REQUIRED (from UI / security)

**Method:** POST `/api/v1/auth/refresh`  
**Purpose:** Renew AccessToken before cart/orders fail.  
**Auth:** Refresh token or rotating credential (publish exact model).  
**Frontend:** Not wired yet; required once TemporaryUiLogin is replaced.  
**Priority:** P0  

---

## 1.6 Logout / Revoke — REQUIRED (from UI)

**Method:** POST `/api/v1/auth/logout`  
**Frontend:** `settings.tsx`, Profile, SideMenu (local clear today)  
**Auth:** Required  
**Body:** empty or `{ "refreshToken": "..." }`  
**Success:** 200; client clears local stores.  
**Priority:** P1  

**Not in UI:** Forgot password, email/password login, account deletion API.

---

# Module 2 — Profile

## 2.1 Get Profile — REQUIRED

**Method:** GET `/api/v1/customers/me`  
**Frontend:** `edit-profile.tsx`, profile surfaces (`CustomerProfile`)  
**Auth:** Required  

**Success data fields:**

| Field | Type | Notes |
|---|---|---|
| customerId | string | |
| mobile | string | |
| name | string | |
| email | string | |
| dateOfBirth | string \| null | ISO date |
| avatarUrl | string \| null | HTTPS |
| avatarPreset | string \| null | Optional; presets are client-only today |

---

## 2.2 Update Profile — REQUIRED

**Method:** PATCH `/api/v1/customers/me`  
**Body:** `{ "name"?, "email"?, "dateOfBirth"? }`  
**Validation:** name non-empty; email format; DOB parseable  
**Auth:** Required  

---

## 2.3 Upload Avatar — REQUIRED (UI exists)

**Method:** POST `/api/v1/customers/me/avatar` multipart  
**Frontend:** Profile photo sheet (camera/gallery)  
**Auth:** Required  
**Limits:** Publish max bytes/types (JPEG/PNG/WebP).  
**Note:** Preset avatars (`sunny|leaf|basket|spice`) are client-only chrome — no upload needed.

---

# Module 3 — Addresses

Shape from `src/types/savedAddress.ts`.

## 3.1–3.5 Address CRUD — REQUIRED

| API | Method | Endpoint |
|---|---|---|
| List | GET | `/api/v1/customers/me/addresses` |
| Create | POST | `/api/v1/customers/me/addresses` |
| Update | PATCH | `/api/v1/customers/me/addresses/{addressId}` |
| Delete | DELETE | `/api/v1/customers/me/addresses/{addressId}` |
| Set default | PUT | `/api/v1/customers/me/addresses/{addressId}/default` |

**Address object:**

```json
{
  "id": "addr_1",
  "label": "Home",
  "customLabel": null,
  "houseNumber": "12",
  "buildingStreet": "Tulsi Lane",
  "area": "Nadia",
  "addressLine1": "12 Tulsi Lane",
  "landmark": "Near temple",
  "city": "Mayapur",
  "state": "West Bengal",
  "postalCode": "741313",
  "country": "India",
  "instructions": "Call on arrival",
  "latitude": 23.42,
  "longitude": 88.39,
  "source": "map",
  "isDefault": true,
  "updatedAt": 1730000000000
}
```

**Validation:** `label` ∈ Home|Work|Other; postalCode 6-digit India when provided; exactly one default after set-default.  
**Frontend:** `addresses.tsx`, `address-form.tsx`, checkout address pick.  
**Empty list:** `[]` — UI opens location picker.  
**Auth:** Required  

---

# Module 4 — Delivery / Location

## 4.1 Serviceability — REQUIRED

**Method:** GET `/api/v1/delivery/serviceability`  
**Query:** `postalCode` and/or `latitude`+`longitude`  
**Frontend:** Location flows + checkout gate  
**Auth:** Optional  

**Success:**

```json
{
  "success": true,
  "data": {
    "serviceable": true,
    "message": null,
    "etaMinutesMin": 25,
    "etaMinutesMax": 40,
    "storeId": "store_1"
  }
}
```

**Unserviceable:** 200 with `serviceable:false` or 422 — publish choice.  
**Note:** Geocoding stays on-device via `expo-location` today.

---

# Module 5 — Catalogue / Home

## 5.1 List Products — CONFIRMED path, unwired

**Method:** GET `/api/values/products?company={company}`  
**Frontend references:** `shopCatalog.ts`, `liveData.ts`, `docs/backend-requirements.md`  
**Auth:** Optional / Required — publish  
**Status:** `LIVE_CATALOGUE_CONNECTED = false`; **never called**

**REQUIRED query (extend):** company (required today), plus optional `categoryId`, `q`, `page`, `pageSize`, `sort` (`catalogue|price-asc|price-desc|name-asc|name-desc`), filters: `priceMin`, `priceMax`, `inStockOnly`, `discountedOnly`, `ratingStars`, `brandId`, `collectionId`.

**Product item fields derived from `DemoProduct` + UI:**

| Field | Type | Required |
|---|---|---|
| id | string | Yes |
| name | string | Yes |
| unit | string | Yes |
| price | number | Yes (INR) |
| compareAt | number | Optional MRP |
| discountLabel | string | Optional |
| available | boolean | Recommended; missing ≠ confirmed in stock |
| imageUrl | string | Yes |
| imageUrls | string[] | Yes (≥1) |
| categoryIds | string[] | Yes |
| brand | string | Optional |
| about | string | Optional (PDP) |
| ratingAverage | number | Optional (filters/reviews) |
| reviewCount | number | Optional |

**Business rules:** Prices authoritative; do not invent discounts.  
**Empty:** `items: []`.

---

## 5.2 Get Product Details — REQUIRED

**Method:** GET `/api/v1/products/{productId}`  
**Frontend:** `src/app/product/[id].tsx`  
**Auth:** Optional  
**Success:** Product fields + `relatedProductIds` or embedded related list.  
**404:** Unknown id — UI shows “not in the catalogue”.

---

## 5.3 List Categories — REQUIRED

**Method:** GET `/api/v1/categories`  
**Frontend:** Home CategoryGrid, Shop shelves, `category/[id].tsx`  
**Data:** Parent categories + subcategories (`CatalogSubcategory`: id, parentId, name, imageUrl, productCount, order, visible)

---

## 5.4 Home Feed — REQUIRED

**Method:** GET `/api/v1/home`  
**Frontend:** `src/app/(tabs)/home.tsx`  
**Auth:** Optional (personalize rails when authed)

**Suggested `data` sections:**

- `banners[]` — id, title, subtitle, ctaLabel, href/deepLink, badgeLabel?, imageUrl?  
- `dailyEssentials[]` — id, name, imageUrl  
- `recommended[]`, `recentlyViewed[]`, `spotlight[]`, `boughtAgain[]`, `topSelling[]` — product cards  
- `categories[]`, `brands[]` (optional), `storesPreview[]` (optional)

**Why one endpoint:** Avoids N+1 for first paint; individual product APIs remain for PDP.

---

## 5.5 Search Suggestions — REQUIRED (UI)

**Method:** GET `/api/v1/search/suggestions?q=`  
**Frontend:** Shop search (`searchSuggestions.ts`)  
**Auth:** Public  

---

## 5.6 Brands — PROPOSED P2

**Method:** GET `/api/v1/brands`  
**Frontend:** `BrandCarousel` — note Shop currently ignores `?brand=` param.

---

## 5.7 Collection — REQUIRED (UI)

**Method:** GET `/api/v1/collections/{collectionId}`  
**Ids used:** `all|fresh|diwali|electronics|organic`  
**Frontend:** `collection/[id].tsx`  
**Data:** definition + chips + products  

---

# Module 6 — Stores (preview feature)

## 6.1–6.2 Stores — PROPOSED P2

**GET** `/api/v1/stores?lat=&lng=`  
**GET** `/api/v1/stores/{storeId}`  

Fields from `DemoStore`: id, name, area, distanceLabel or meters, openLabel, ratingLabel, imageUrl, detail.

If multi-store inventory is out of scope, keep marketing-only and say so.

---

# Module 7 — Cart

## 7.1 Get Cart — REQUIRED

**Method:** GET `/api/v1/cart`  
**Frontend:** Cart tab, badges (`MockCartContext`)  
**Auth:** Required  

```json
{
  "success": true,
  "data": {
    "leaveAtDoor": false,
    "items": [
      {
        "productId": "eggs",
        "quantity": 2,
        "name": "FarmFresh Eggs",
        "unit": "12 pcs",
        "unitPrice": 72,
        "compareAt": 90,
        "imageUrl": "https://…",
        "available": true,
        "lineTotal": 144
      }
    ],
    "bill": {
      "itemCount": 2,
      "mrpTotal": 180,
      "itemTotal": 144,
      "savings": 36,
      "deliveryPartnerFee": 0,
      "handlingFee": 0,
      "subtotal": 144
    }
  }
}
```

---

## 7.2 Upsert Cart Item — REQUIRED

**Method:** PUT `/api/v1/cart/items/{productId}`  
**Body:** `{ "quantity": 3 }`  
**Rules:** quantity 1–99 (UI clamps); 0 deletes; reject if unavailable.  
**Frontend:** PDP add, ProductCard, Cart steppers  

---

## 7.3 Remove Cart Item — REQUIRED

**Method:** DELETE `/api/v1/cart/items/{productId}`  

---

## 7.4 Clear Cart — REQUIRED

**Method:** DELETE `/api/v1/cart`  
**When:** After successful order; optional user clear  

---

## 7.5 Checkout Quote — REQUIRED

**Method:** POST `/api/v1/checkout/quote`  
**Frontend:** `ReviewCartScreen`, `CheckoutScreen`, `PaymentScreen` (`buildDemoCheckoutBill`)  
**Auth:** Required  

**Request:**

```json
{
  "addressId": "addr_1",
  "couponCode": "SAVE50",
  "leaveAtDoor": true,
  "instructions": "Ring bell"
}
```

(Alternatively accept explicit lines if cart is not server-side yet — prefer server cart.)

**Response must include:** itemTotal, mrpTotal, savings, deliveryFee, handlingFee, discount, tax (if any), grandTotal, currency, line breakdown, coupon application result, serviceability.

**Critical business rule:** Frontend must display these numbers; never re-trust client math for place-order.

---

# Module 8 — Wishlist

## 8.1–8.3 Wishlist — REQUIRED (UI)

| Method | Endpoint |
|---|---|
| GET | `/api/v1/wishlist` → `{ "productIds": ["eggs"] }` or product cards |
| POST | `/api/v1/wishlist/items` `{ "productId" }` |
| DELETE | `/api/v1/wishlist/items/{productId}` |

**Frontend:** `wishlist.tsx`, ProductCard heart, PDP  
**Auth:** Required  
**Current:** SecureStore id list  

---

# Module 9 — Coupons

Fields from `DemoCoupon` / `PreviewCoupon`.

## 9.1 List Coupons — REQUIRED (UI)

**GET** `/api/v1/coupons`  
**Auth:** Required  
**Data:** id, code, title, detail, discountType (`percent|flat`), discountValue, minimum, maxDiscount?, expiresOn, terms, collected?

## 9.2 Collect Coupon — REQUIRED (UI)

**POST** `/api/v1/coupons/{couponId}/collect`

## 9.3 Validate Coupon — REQUIRED (UI)

**POST** `/api/v1/coupons/validate`  
**Body:** `{ "code": "SAVE50", "itemTotal": 500 }`  
**Response:** `{ "valid": true, "discountAmount": 50, "message": null }`  
**Rules:** Expiry, minimum, maxDiscount, single active coupon (UI applies one).

---

# Module 10 — Orders

Order shape from `CustomerOrder` / `SimulatedOrder` (`src/types/order.ts`).

## 10.1 Place Order — REQUIRED

**Method:** POST `/api/v1/orders`  
**Frontend:** `PaymentScreen.placeDemoCodOrder`  
**Auth:** Required  
**Headers:** `Idempotency-Key: <uuid>` (PROPOSED — confirm)

**Request:**

```json
{
  "addressId": "addr_1",
  "paymentMethodId": "cod",
  "couponCode": null,
  "leaveAtDoor": false,
  "instructions": "Gate 2",
  "quoteId": "quote_abc"
}
```

**Success:** Order object with `id`, `status` (`placed` or `confirmed`), `totalAmount`, items snapshot, address snapshot, `paymentLabel`/`paymentMethodId`, `statusAt`.

**Rules:**

- Revalidate quote/stock/prices  
- COD may confirm immediately  
- Online methods require successful payment confirm before or as part of placement — publish exact state machine  
- Clear server cart on success  
- Never create duplicate orders for same Idempotency-Key  

**Errors:** 422 out of stock / unserviceable / invalid coupon / payment required  

---

## 10.2 List Orders — REQUIRED

**GET** `/api/v1/orders?statusGroup=all|active|delivered`  
**Frontend:** `orders.tsx`, profile past orders  
**Pagination:** yes  

---

## 10.3 Get Order — REQUIRED

**GET** `/api/v1/orders/{orderId}`  
**Frontend:** `order/[id].tsx`  
**403** if not owner  

---

## 10.4 Active Order — REQUIRED

**GET** `/api/v1/orders/active`  
**Frontend:** Track tab (`readActiveOrder` currently empty)  
**Response:** order or `null` / empty kind  

---

## 10.5 Cancel Order — REQUIRED

**POST** `/api/v1/orders/{orderId}/cancel`  
**Body:** `{ "reasonIds": ["change-of-mind"] }`  
**Allowed:** status not `delivered` or `cancelled`  
**Frontend:** OrderCancelModal + reasons in `orderCancelReasons.ts`  

---

## 10.6 Request Return — REQUIRED (UI)

**POST** `/api/v1/orders/{orderId}/returns`  
**Body:**

```json
{
  "reasonIds": ["product-quality"],
  "itemIds": ["eggs"],
  "photoUrls": ["https://cdn/…"]
}
```

**Rules:** status `delivered`; not already returned; ≥1 reason, item, photo (UI requires photos).  
**Upload photos first** via Media API.

---

## 10.7 List Returns — REQUIRED (UI)

**GET** `/api/v1/returns`  
**Statuses suggested by UI copy:** Requested → Under Review → Approved → Refunded  

---

## 10.8 Tracking — REQUIRED

**GET** `/api/v1/orders/{orderId}/tracking`  
**Frontend:** `OrderTrackingScreen`, `DemoOrderTracking` fields  

**Data:**

| Field | Type | Notes |
|---|---|---|
| status | OrderStatus | |
| statusAt | map | timestamps |
| etaMinutes | number | |
| etaRangeLabel | string | |
| partner | object | name, status, phone?, ratingLabel? |
| storeLocation | {lat,lng} | |
| deliveryLocation | {lat,lng} | |
| riderLocation | {lat,lng}? | when out for delivery |
| routePolyline | string or points[] | replace unitless demo map |
| paymentChipLabel | string | optional |

**Empty/missing tracking:** return 404 or `available:false` — UI shows empty/demo notice today.

**Reorder:** NOT implemented in UI — do not build unless product asks.

---

# Module 11 — Payments & Transactions

## 11.1 Payment Methods — REQUIRED

**GET** `/api/v1/payments/methods`  
**Frontend:** `checkoutPaymentMethods.ts`  
**Data:** `[{ "id": "cod"|"upi"|"card", "title", "subtitle", "enabled": true }]`  

---

## 11.2 Initiate Online Payment — REQUIRED if UPI/Card offered

**POST** `/api/v1/payments/initiate`  
**Body:** `{ "orderId" or "quoteId", "methodId": "upi"|"card", "returnUrl"? }`  
**Response:** provider payload (publish exact fields for chosen gateway)  
**Frontend today:** Blocks with “gateway not connected”  

---

## 11.3 Confirm Payment — REQUIRED if online offered

**POST** `/api/v1/payments/confirm`  
**Also:** provider webhooks  
**Rule:** Never trust client-only success  

---

## 11.4 Payment Preferences — REQUIRED (UI)

**GET/PATCH** `/api/v1/customers/me/payment-preferences`  
**Body/data:** `{ "primaryMethodId": "cod"|"upi"|"card", "cardPreviewHidden": false }`  
**Note:** Not a vault for PAN — UI demo card is fake (`demoPaymentCard.ts`).

---

## 11.5 Transactions — REQUIRED (UI)

**GET** `/api/v1/transactions?kind=all|payments|refunds`  
**Fields:** id, method (`mastercard|visa|upi|cash`), title, amount, currency `INR`, placedAt, status (`success|pending|failed|reversed`), kind (`payment|refund`), orderId?, note  

---

# Module 12 — Wallet (stub UI)

## 12.1 Get Wallet — PROPOSED P2

**GET** `/api/v1/wallet` → `{ balance, currency:"INR", status }`  
**Frontend:** Shows unavailable; Add Money disabled  

## 12.2 Top Up — PROPOSED P2

**POST** `/api/v1/wallet/top-up` — only if product enables wallet  

---

# Module 13 — Reviews

## 13.1 List Product Reviews — REQUIRED (UI)

**GET** `/api/v1/products/{productId}/reviews?sort=helpful|newest&page=`  
**Data:** average, total, distribution[5], reviews[] (`ProductReview` fields)  

## 13.2 Create Product Review — REQUIRED (UI)

**POST** `/api/v1/products/{productId}/reviews`  
**Body:** rating 1–5, body (≥8 chars in order-review UI), tags[], photoUrls[], authorName  

## 13.3 Vote Review — PROPOSED P2

**POST** `/api/v1/reviews/{reviewId}/vote` `{ "vote": "helpful"|"not_helpful" }`  

## 13.4 Delivery Review — REQUIRED (UI)

**POST** `/api/v1/orders/{orderId}/delivery-review`  
**Body:** `{ "rating": 5, "body"?, "tags"? }`  
**Rule:** order delivered; one review per order  

---

# Module 14 — Notifications

## 14.1 List — REQUIRED (UI)

**GET** `/api/v1/notifications`  
**Fields:** id, type, title, body, createdAt, unread, imageUrl, destination  

## 14.2 Mark Read — REQUIRED

**PATCH** `/api/v1/notifications/{id}/read`  

## 14.3 Mark All Read — REQUIRED

**POST** `/api/v1/notifications/read-all`  

## 14.4 Clear Inbox — PROPOSED P2

**DELETE** `/api/v1/notifications`  

## 14.5 Push Token — REQUIRED for push

**POST** `/api/v1/notifications/push-token` `{ "token", "platform": "ios"|"android" }`  
**Frontend:** not implemented yet  

## 14.6 Preferences — REQUIRED (UI)

**GET/PATCH** `/api/v1/customers/me/notification-preferences`  
`{ "orderAlerts": true, "offerAlerts": false }`  

---

# Module 15 — Support

## 15.1 FAQs — PROPOSED P2

**GET** `/api/v1/support/faqs`  
**Frontend works with static `supportFaq.ts` today  

## 15.2 Chat — PROPOSED P2

**GET** `/api/v1/support/chat`  
**POST** `/api/v1/support/chat/messages` text or imageUrl  
**Limits from UI:** text ≤1000, image ≤5MB, history ~120  

## 15.3 Complaints — REQUIRED (UI)

| Method | Endpoint |
|---|---|
| GET | `/api/v1/support/complaints` |
| POST | `/api/v1/support/complaints` |
| GET | `/api/v1/support/complaints/{id}` |

**Create body:** category (`order|delivery|product|payment|app|other`), subject, description, orderId?  
**Statuses:** open → in_progress → resolved → closed (UI has no status transition controls for customer)  

---

# Module 16 — Referral

## 16.1 Get Referral Code — PROPOSED P2

**GET** `/api/v1/referrals/me` → `{ "code": "MB-XXXX", "shareMessage": "…" }`  
**Frontend:** `invite.tsx` builds local demo code today  
**Register attribution:** optional `ReferralCode` on register — confirm  

---

# Module 17 — Content

## 17.1 Privacy / Terms — PROPOSED P2

**GET** `/api/v1/content/privacy`  
**GET** `/api/v1/content/terms`  
Static screens acceptable for MVP.

---

# Module 18 — Media

## 18.1 Upload Media — REQUIRED for returns/reviews/chat

**Method:** POST `/api/v1/media/upload` multipart  
**Auth:** Required  
**Response:** `{ "url": "https://…" }`  
**Validation:** MIME allow-list, max size, virus scan recommended  
**Frontend Used In:** Return photos (max 4), review photos, chat images  

---

# Standard behaviours checklist

| Topic | Requirement |
|---|---|
| Success HTTP | 200 or 201 |
| Auth errors | 401 |
| Ownership | 403 |
| Missing | 404 |
| Validation | 400 |
| Business rule | 422 |
| Rate limit | 429 |
| Idempotency | Place order + payment confirm |
| Empty lists | 200 + `[]` |
| Price trust | Server only |
| OTP limits | Expiry + retry + resend cooldown |
| API versioning | Document `/api/values` vs `/api/v1` strategy |
| Secrets | Never return OTP, raw tokens in logs/help samples beyond redacted docs |

---

# Frontend file index (contracts evidence)

| Concern | Paths |
|---|---|
| API constants | `src/constants/api.ts`, `liveData.ts`, `preview.ts` |
| HTTP | `src/services/api/http.ts`, `interpretCustomerResponse.ts` |
| Auth services | `customerAuth.ts`, `registrationSubmission.ts`, `temporaryUiLogin.ts` |
| Types | `types/customerApi.ts`, `catalog.ts`, `order.ts`, `savedAddress.ts`, `coupons.ts`, `notifications.ts`, … |
| Cart/checkout | `MockCartContext.tsx`, `CheckoutScreen.tsx`, `PaymentScreen.tsx`, `demoCheckoutBill.ts` |
| Existing written OTP requirements | `docs/backend-requirements.md` |

---

# Assumptions requiring confirmation

1. `/api/v1` path prefix for new modules vs extending `/api/values`.  
2. `company` value source for products.  
3. AccessToken header name and refresh model.  
4. Whether tax is inclusive.  
5. Payment gateway selection.  
6. Delivery fee/ETA real rules.  
7. Multi-store inventory vs single dark store.  
8. Wallet and referral in MVP.  

See `OPEN_QUESTIONS.md` for the full list.
