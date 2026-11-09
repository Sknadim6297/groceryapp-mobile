# Finalized P0 Backend Contract — MayapurBazaar Customer App

**Audience:** Backend developer (existing ASP.NET host `https://api.supertrading.online`)  
**Date:** 2026-11-09  
**Scope:** Document review outcomes for items 1–6 of the backend handoff request.  
**Constraint:** This Expo repo has **no backend code**. Implementation must happen on the existing C# / ASP.NET API. Frontend remains on mock/preview until these contracts are live.

**Companion artifacts**

| File | Purpose |
|---|---|
| `openapi-p0.yaml` | OpenAPI 3.0 for P0 |
| `postman-p0.collection.json` | Postman collection for P0 |
| `API_PARAMETERS_HANDOFF.md` | Parameter evidence tags |
| `docs/backend-requirements.md` | OTP-first C# change list (existing) |

---

## 0. Compatibility decision (FINAL)

Keep existing live routes unchanged in path and PascalCase request style:

| Keep as-is |
|---|
| `POST /api/values/customer/send-otp` |
| `POST /api/values/customer/resend-otp` |
| `POST /api/values/customer/verify-otp` |
| `POST /api/values/customer/register` |
| `GET /api/values/products?company={company}` |

**New P0 commerce routes** are finalized under the same ASP.NET prefix for host compatibility:

```text
/api/values/customer/...
/api/values/catalog/...
/api/values/cart/...
/api/values/checkout/...
/api/values/orders/...
/api/values/payments/...
/api/values/delivery/...
```

> Earlier audit docs used `/api/v1/...` as a **proposal**. **Final decision for this handoff:** implement new customer-app commerce APIs under `/api/values/...` so they sit next to the existing help-page routes. Do not require the frontend to talk to two different API styles for path roots.

**Response dual-mode (FINAL)**

1. **Legacy customer auth endpoints (#1–4):** keep array/object + `Status` / `Message` (PascalCase) so current app parsers keep working.  
2. **All new endpoints:** use the unified envelope below. Frontend will add a second interpreter during integration.

```json
{
  "success": true,
  "message": null,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Human readable message",
  "code": "MACHINE_CODE",
  "details": {}
}
```

---

## 1. Existing APIs — verified

| # | Method | Endpoint | Request (verified) | App status | Backend action |
|---|---|---|---|---|---|
| 1 | POST | `/api/values/customer/send-otp` | `{ "Mobile": string }` | Integrated | Extend: send OTP for **unregistered** mobiles too; return `Status: "Success"` + OTP-sent message |
| 2 | POST | `/api/values/customer/resend-otp` | `{ "Mobile": string }` | Integrated | Keep; add rate limit / cooldown |
| 3 | POST | `/api/values/customer/verify-otp` | `{ "Mobile", "OTP" }` | Partial | Return `AccessToken` + `RefreshToken` + registered/unregistered shapes (below) |
| 4 | POST | `/api/values/customer/register` | App sends: `Mobile`, `Name`, `Email`, optional `Address`, `DOB`, `Country`, `State`, `City`, `Pincode`, `MobileVerificationToken` | Partial | Accept token; return `AccessToken` + `RefreshToken`; do not require second OTP |
| 16 | GET | `/api/values/products?company={company}` | Query `company` **required** (help page) | Documented, **never called** (`LIVE_CATALOGUE_CONNECTED=false`) | Publish JSON sample; provide real `company` value to app team |

**Help-page register fields NOT sent by app (keep optional):** `CompanyMobile`, `WhatsApp`, `Anniversary`, `GSTType`, `GSTIN`.

**Verified parser rules (do not break):**

- Body may be object **or** one-element array  
- Success requires string `Status` / `status` === `"Success"` (HTTP 200 alone is not enough)  
- Message keys: `Message`, `message`, …  
- Token-like keys accepted: names matching `/token|session|jwt|bearer/i` — prefer explicit `AccessToken`, `RefreshToken`, `MobileVerificationToken`

---

## 2. Proposed P0 APIs — finalized endpoints & request bodies

### Auth (new)

| Method | Final endpoint | Body / query |
|---|---|---|
| POST | `/api/values/customer/refresh-token` | `{ "RefreshToken": string }` |
| POST | `/api/values/customer/logout` | `{ "RefreshToken": string }` (optional but recommended) |

### Profile

| Method | Final endpoint | Body |
|---|---|---|
| GET | `/api/values/customer/profile` | — |
| PUT | `/api/values/customer/profile` | `{ "Name", "Email", "DOB?" }` |

> Use **PUT** (not PATCH) for ASP.NET help-page friendliness unless your stack already standardizes on PATCH. Fields match what Edit Profile saves.

### Addresses

| Method | Final endpoint | Body / path |
|---|---|---|
| GET | `/api/values/customer/addresses` | — |
| POST | `/api/values/customer/addresses` | Address draft (below) |
| PUT | `/api/values/customer/addresses/{addressId}` | Same draft |
| DELETE | `/api/values/customer/addresses/{addressId}` | — |
| PUT | `/api/values/customer/addresses/{addressId}/default` | — |

**Address body (final):**

```json
{
  "Label": "Home",
  "CustomLabel": null,
  "HouseNumber": "12",
  "BuildingStreet": "Tulsi Lane",
  "Area": "Nadia",
  "AddressLine1": "12 Tulsi Lane",
  "Landmark": "Near temple",
  "City": "Mayapur",
  "State": "West Bengal",
  "PostalCode": "741313",
  "Country": "India",
  "Instructions": "Call on arrival",
  "Latitude": 23.42,
  "Longitude": 88.39,
  "Source": "map"
}
```

`Label`: `Home` | `Work` | `Other`.  
PascalCase aligned with existing customer APIs.

### Delivery

| Method | Final endpoint | Query |
|---|---|---|
| GET | `/api/values/delivery/serviceability` | `postalCode` and/or `latitude` + `longitude` |

### Catalog

| Method | Final endpoint | Notes |
|---|---|---|
| GET | `/api/values/products` | Existing; add optional filters when ready: `categoryId`, `q`, `sort`, `priceMin`, `priceMax`, `inStockOnly`, `discountedOnly`, `page`, `pageSize` |
| GET | `/api/values/products/{productId}` | PDP |
| GET | `/api/values/catalog/categories` | Parent + subcategory tree |
| GET | `/api/values/catalog/home` | Banners + product rails |

### Cart

| Method | Final endpoint | Body |
|---|---|---|
| GET | `/api/values/cart` | — |
| PUT | `/api/values/cart/items/{productId}` | `{ "Quantity": number }` (1–99; `0` = remove) |
| DELETE | `/api/values/cart/items/{productId}` | — |
| DELETE | `/api/values/cart` | Clear |

### Checkout

| Method | Final endpoint | Body |
|---|---|---|
| POST | `/api/values/checkout/quote` | `{ "AddressId", "CouponCode?", "LeaveAtDoor?", "Instructions?" }` |

Server uses **server cart** lines; do not trust client prices.

### Payments (P0 MVP = COD only)

| Method | Final endpoint | MVP |
|---|---|---|
| GET | `/api/values/payments/methods` | **In P0** — return enabled methods; COD must be `enabled: true` |
| POST | `/api/values/payments/initiate` | **Defer** until gateway chosen (do not block COD launch) |
| POST | `/api/values/payments/confirm` | **Defer** until gateway chosen |

### Orders & tracking

| Method | Final endpoint | Body / query |
|---|---|---|
| POST | `/api/values/orders` | Place order body (below) + header `Idempotency-Key` |
| GET | `/api/values/orders` | Optional `statusGroup=all\|active\|delivered`; `page`, `pageSize` |
| GET | `/api/values/orders/active` | — |
| GET | `/api/values/orders/{orderId}` | — |
| POST | `/api/values/orders/{orderId}/cancel` | `{ "ReasonIds": string[] }` |
| GET | `/api/values/orders/{orderId}/tracking` | — |

**Place order body (final — COD MVP):**

```json
{
  "AddressId": "addr_1",
  "PaymentMethodId": "cod",
  "CouponCode": null,
  "LeaveAtDoor": false,
  "Instructions": "Gate 2",
  "QuoteId": "quote_abc"
}
```

Server must re-validate quote, stock, and totals. Ignore any client-sent `Total` / price fields if present.

---

## 3. Response JSON & error handling (FINAL)

### 3.1 Legacy auth success examples (endpoints #1–4)

**send-otp / resend-otp Success**

```json
[
  {
    "Status": "Success",
    "Message": "OTP has been sent successfully."
  }
]
```

**verify-otp Success — registered**

```json
[
  {
    "Status": "Success",
    "Message": "OTP verified successfully",
    "CustomerId": "C123",
    "Name": "Asha Devi",
    "Mobile": "9876543210",
    "AccessToken": "<jwt-or-opaque>",
    "RefreshToken": "<opaque>",
    "ExpiresIn": 3600
  }
]
```

**verify-otp Success — unregistered (OTP-first)**

```json
[
  {
    "Status": "Success",
    "Message": "Mobile verified. Complete registration.",
    "IsRegistered": false,
    "Mobile": "9876543210",
    "MobileVerificationToken": "<opaque>",
    "ExpiresIn": 900
  }
]
```

**register Success**

```json
[
  {
    "Status": "Success",
    "Message": "Customer registered successfully",
    "CustomerId": "C123",
    "Name": "Asha Devi",
    "Mobile": "9876543210",
    "AccessToken": "<jwt-or-opaque>",
    "RefreshToken": "<opaque>",
    "ExpiresIn": 3600
  }
]
```

**Legacy failure**

```json
[
  {
    "Status": "Failed",
    "Message": "OTP expired, already used, or invalid. Please request a new OTP."
  }
]
```

### 3.2 New-endpoint success envelope

```json
{
  "success": true,
  "message": null,
  "data": { }
}
```

### 3.3 New-endpoint error envelope + HTTP map

| HTTP | When | `code` examples |
|---|---|---|
| 200 / 201 | Success | — |
| 400 | Validation | `VALIDATION_ERROR` |
| 401 | Missing/invalid AccessToken | `UNAUTHORIZED` |
| 403 | Not resource owner | `FORBIDDEN` |
| 404 | Unknown id | `NOT_FOUND` |
| 409 | Duplicate / idempotent replay conflict handled | `CONFLICT` |
| 422 | Business rule | `OUT_OF_STOCK`, `UNSERVICEABLE`, `INVALID_COUPON`, `INVALID_STATUS` |
| 429 | OTP / order rate limit | `RATE_LIMITED` |
| 500 | Unexpected | `SERVER_ERROR` |

```json
{
  "success": false,
  "message": "Item eggs is out of stock.",
  "code": "OUT_OF_STOCK",
  "details": { "productId": "eggs" }
}
```

Empty lists: **HTTP 200** + `"data": []` or `"data": { "items": [] }` — never 404 for empty collections.

### 3.4 Key `data` shapes (new APIs)

**Profile**

```json
{
  "customerId": "C123",
  "mobile": "9876543210",
  "name": "Asha Devi",
  "email": "asha@example.com",
  "dateOfBirth": "1994-05-12",
  "avatarUrl": null
}
```

**Cart**

```json
{
  "leaveAtDoor": false,
  "items": [
    {
      "productId": "eggs",
      "quantity": 2,
      "name": "FarmFresh Eggs",
      "unit": "12 pcs",
      "unitPrice": 72,
      "compareAt": 90,
      "imageUrl": "https://cdn.example/eggs.jpg",
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
    "subtotal": 144,
    "currency": "INR"
  }
}
```

**Quote**

```json
{
  "quoteId": "quote_abc",
  "itemTotal": 144,
  "mrpTotal": 180,
  "savings": 36,
  "deliveryFee": 29,
  "handlingFee": 0,
  "discount": 0,
  "tax": 0,
  "grandTotal": 173,
  "currency": "INR",
  "couponCode": null,
  "serviceable": true,
  "expiresAt": "2026-11-09T12:00:00Z"
}
```

**Order (list/detail)**

```json
{
  "id": "ORD-1001",
  "placedAt": "2026-11-09T10:12:00Z",
  "status": "confirmed",
  "statusDetail": "Store confirmed your order",
  "totalAmount": 173,
  "currency": "INR",
  "paymentMethodId": "cod",
  "paymentLabel": "Cash on Delivery",
  "statusAt": {
    "placed": "2026-11-09T10:12:00Z",
    "confirmed": "2026-11-09T10:14:00Z"
  },
  "eta": { "value": "35", "unit": "min" },
  "addressTitle": "Home",
  "addressLine": "12 Tulsi Lane, Mayapur, 741313",
  "items": [
    { "id": "eggs", "name": "FarmFresh Eggs", "quantity": 2, "unit": "12 pcs" }
  ],
  "partner": null,
  "leaveAtDoor": false,
  "instructions": null
}
```

**Order statuses (FINAL enum — matches frontend):**  
`placed` | `confirmed` | `packing` | `picked_up` | `out_for_delivery` | `delivered` | `cancelled`

**Tracking**

```json
{
  "orderId": "ORD-1001",
  "status": "out_for_delivery",
  "statusAt": {},
  "etaMinutes": 28,
  "etaRangeLabel": "25–35 min",
  "paymentChipLabel": "COD",
  "partner": {
    "name": "Rohan Das",
    "status": "On the way",
    "phone": "98XXXXXXXX",
    "ratingLabel": null
  },
  "storeLocation": { "latitude": 23.42, "longitude": 88.39 },
  "deliveryLocation": { "latitude": 23.43, "longitude": 88.40 },
  "riderLocation": { "latitude": 23.425, "longitude": 88.395 },
  "routePolyline": null
}
```

---

## 4. Authentication flow (CONFIRMED for implementation)

### 4.1 Tokens

| Token | Purpose | Returned by |
|---|---|---|
| `AccessToken` | `Authorization: Bearer <AccessToken>` on all new customer APIs | verify-otp (registered), register, refresh-token |
| `RefreshToken` | Obtain new AccessToken | Same success responses; refresh-token endpoint |
| `MobileVerificationToken` | Prove OTP-first mobile verify before register | verify-otp (unregistered only) |

**Header (FINAL):**

```http
Authorization: Bearer <AccessToken>
```

Do **not** put tokens on `Status: "Failed"` bodies.  
Do **not** treat TemporaryUiLogin as a credential (frontend today; will be replaced after tokens ship).

### 4.2 Registered login

```text
Login Mobile
 → POST send-otp { Mobile }           Status Success + OTP sent
 → POST verify-otp { Mobile, OTP }    Status Success + AccessToken + RefreshToken + CustomerId/Name/Mobile
 → Home (frontend stores tokens; Authorization on later calls)
```

### 4.3 New customer (OTP-first) — REQUIRED

```text
Login Mobile
 → POST send-otp                      MUST send OTP even if unregistered; Status Success
 → POST verify-otp                    Status Success + IsRegistered:false + MobileVerificationToken
 → Complete profile + location
 → POST register (+ MobileVerificationToken)
                                      Status Success + AccessToken + RefreshToken + CustomerId
 → Home  (NO second OTP)
```

### 4.4 Refresh

```text
POST /api/values/customer/refresh-token
Body: { "RefreshToken": "..." }

Success (legacy or new envelope — publish one; prefer legacy PascalCase for consistency with auth module):
AccessToken, RefreshToken (rotate), ExpiresIn
```

Invalid/expired refresh → 401; frontend clears session → Login.

### 4.5 Logout

```text
POST /api/values/customer/logout
Authorization: Bearer <AccessToken>
Body: { "RefreshToken": "..." }

Server: revoke refresh (and access if tracked)
Frontend: already clears local TemporaryUiLogin / stores — will also delete tokens after integration
```

### 4.6 Security rules

- OTP: expiry, attempt limit, resend cooldown, rate limit (429)  
- HTTPS only  
- Order/cart/address: ownership checks via token subject (`CustomerId`)  
- Server-side price, stock, discount, fee calculation  
- Idempotent `POST /orders` via `Idempotency-Key`  
- Never log OTP or raw tokens  

---

## 5. P0 implementation order (backend)

Implement in this sequence on the **existing** ASP.NET API:

### Phase A — Auth completion (blocker for everything)

1. OTP-first `send-otp` for unregistered  
2. `verify-otp` registered + unregistered response shapes  
3. `AccessToken` + `RefreshToken` + `ExpiresIn`  
4. `register` accepts `MobileVerificationToken`  
5. `refresh-token` + `logout`  

### Phase B — Profile & addresses

6. Profile GET/PUT  
7. Address CRUD + default  

### Phase C — Catalogue

8. Publish `GET /api/values/products` sample + real `company`  
9. Product by id  
10. Categories  
11. Home feed  

### Phase D — Cart & checkout (COD)

12. Serviceability  
13. Cart GET/upsert/remove/clear  
14. Checkout quote  
15. Payment methods (COD enabled)  
16. Place order (COD) with idempotency  

### Phase E — Orders & tracking

17. List / get / active  
18. Cancel  
19. Tracking  

**Defer from COD MVP:** payment initiate/confirm, wallet, wishlist, coupons sync, returns, reviews, notifications, chat.

---

## 6. Deliverables for frontend integration

When Phase A–E are ready, share:

1. Updated Help page / Swagger UI URL  
2. This folder’s `openapi-p0.yaml` kept in sync with deployed routes  
3. Postman collection results (200 samples, redacted tokens)  
4. Real `company` value for products  
5. Token lifetime numbers (`ExpiresIn`, refresh TTL)  
6. Confirmation that CORS is either fixed for web or native-only  

Frontend will then:

- Replace TemporaryUiLogin with token storage  
- Attach `Authorization` on commerce calls  
- Flip `LIVE_CATALOGUE_CONNECTED` when products JSON is honest  
- Replace MockCart / PreviewSession place-order with live cart/orders  

---

## 7. Explicit non-goals in this repo

- No C# / database / payment gateway implementation inside the Expo project  
- No removal of frontend mock data until APIs pass acceptance checks in `BACKEND_DEVELOPER_HANDOFF.md` §20  

---

## 8. Acceptance checklist (P0)

- [ ] Unregistered mobile receives OTP on send-otp  
- [ ] Registered verify returns AccessToken + RefreshToken  
- [ ] Unregistered verify returns MobileVerificationToken + IsRegistered false  
- [ ] Register with token opens session without second OTP  
- [ ] Refresh and logout work  
- [ ] Profile + addresses CRUD authenticated  
- [ ] Products return real prices/stock for a known company  
- [ ] Cart + quote totals are server-calculated  
- [ ] COD place-order is idempotent and appears in list/active/tracking  
- [ ] Cancel with ReasonIds works before delivered  
- [ ] OpenAPI/Postman match deployed routes  

---

**Signed off as frontend-audit finalization for backend implementation.**  
Path root for new APIs: **`/api/values/...`** (compatible with existing host).  
Auth header: **`Authorization: Bearer <AccessToken>`**.  
MVP payment: **COD only**.
