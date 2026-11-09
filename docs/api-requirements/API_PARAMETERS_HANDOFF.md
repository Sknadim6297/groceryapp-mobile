# API Parameters Handoff — MayapurBazaar Customer App

**Purpose:** Exact request-parameter inventory for all **70** APIs listed in `API_ENDPOINT_SUMMARY.md`, extracted from the existing frontend and project documentation.  
**Rule:** No invented parameters. Every field is tagged.

| Tag | Meaning |
|---|---|
| **CONFIRMED** | Sent on a live HTTP call from app code, and/or published on the ASP.NET help contract documented in `docs/backend-requirements.md` |
| **INFERRED FROM FRONTEND** | Captured in UI state, TypeScript types, or local stores that would become request fields when the API is wired — **no live HTTP send today** |
| **NOT DEFINED** | No request path/query/body field found in frontend code or confirmed docs for this slot |

**Auth column** matches `API_ENDPOINT_SUMMARY.md` (Public / Required / Optional).  
**Endpoints** for #5–#70 under `/api/v1/...` are proposed path names from the audit docs — they are **not** live routes.

---

## Legend for empty sections

- If Path / Query / Body says **None — NOT DEFINED**, the frontend never defines that kind of input for the call.
- Help-page-only register fields (`CompanyMobile`, `WhatsApp`, `Anniversary`, `GSTType`, `GSTIN`) are listed under #4 as **CONFIRMED (help page)** but **not sent by the app**.

---

# 1. Send OTP

| | |
|---|---|
| **API name** | Send OTP |
| **Method** | POST |
| **Endpoint** | `/api/values/customer/send-otp` |
| **Authentication** | Public |

### Path parameters

None — **NOT DEFINED**

### Query parameters

None — **NOT DEFINED**

### Request body

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `Mobile` | `string` (10-digit India national) | Required | **CONFIRMED** | `src/types/customerApi.ts` (`CustomerOtpRequest`); `src/services/customerAuth.ts` `sendCustomerOtp`; `docs/backend-requirements.md` |

---

# 2. Resend OTP

| | |
|---|---|
| **API name** | Resend OTP |
| **Method** | POST |
| **Endpoint** | `/api/values/customer/resend-otp` |
| **Authentication** | Public |

### Path parameters

None — **NOT DEFINED**

### Query parameters

None — **NOT DEFINED**

### Request body

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `Mobile` | `string` | Required | **CONFIRMED** | `src/types/customerApi.ts`; `src/services/customerAuth.ts` `resendCustomerOtp`; `docs/backend-requirements.md` |

---

# 3. Verify OTP

| | |
|---|---|
| **API name** | Verify OTP |
| **Method** | POST |
| **Endpoint** | `/api/values/customer/verify-otp` |
| **Authentication** | Public |

### Path parameters

None — **NOT DEFINED**

### Query parameters

None — **NOT DEFINED**

### Request body

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `Mobile` | `string` | Required | **CONFIRMED** | `src/types/customerApi.ts` (`CustomerOtpVerifyRequest`); `src/services/customerAuth.ts` `verifyCustomerOtp` |
| `OTP` | `string` (length 6) | Required | **CONFIRMED** | Same; `OTP_LENGTH` in `src/types/auth.ts` |

---

# 4. Register Customer

| | |
|---|---|
| **API name** | Register Customer |
| **Method** | POST |
| **Endpoint** | `/api/values/customer/register` |
| **Authentication** | Public |

### Path parameters

None — **NOT DEFINED**

### Query parameters

None — **NOT DEFINED**

### Request body — fields the app builds and may send

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `Mobile` | `string` | Required | **CONFIRMED** | `src/types/customerApi.ts` (`CustomerRegistrationRequest`); `src/services/customerAuth.ts` `buildCustomerRegistration` |
| `Name` | `string` | Required | **CONFIRMED** | Same |
| `Email` | `string` | Required in type (may be empty string after trim if user left blank) | **CONFIRMED** | Same; validation only if non-empty |
| `Address` | `string` | Optional in type; required by builder when location present | **CONFIRMED** | Built from `formatDeliveryAddress(location)` |
| `DOB` | `string` (ISO date) | Optional | **CONFIRMED** | Sent only when `parseIsoDate` succeeds |
| `Country` | `string` | Optional | **CONFIRMED** | From `DeliveryLocation.country` when trimmed non-empty |
| `State` | `string` | Optional | **CONFIRMED** | From `DeliveryLocation.state` |
| `City` | `string` | Optional | **CONFIRMED** | From `DeliveryLocation.city` |
| `Pincode` | `string` | Optional | **CONFIRMED** | From `DeliveryLocation.postalCode` |
| `MobileVerificationToken` | `string` | Optional | **CONFIRMED** | Sent only when verify-otp returned a token-like field; never invented (`customerAuth.ts`, `customerApi.ts`) |

### Help-page fields the app does **not** send

| Field | Evidence tag | Source |
|---|---|---|
| `CompanyMobile` | **CONFIRMED (help page only — not sent by app)** | `docs/backend-requirements.md` register row; omitted in `CustomerRegistrationRequest` |
| `WhatsApp` | **CONFIRMED (help page only — not sent by app)** | Same |
| `Anniversary` | **CONFIRMED (help page only — not sent by app)** | Same |
| `GSTType` | **CONFIRMED (help page only — not sent by app)** | Same |
| `GSTIN` | **CONFIRMED (help page only — not sent by app)** | Same |

---

# 5. Refresh Session

| | |
|---|---|
| **API name** | Refresh Session |
| **Method** | POST |
| **Endpoint** | `/api/v1/auth/refresh` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

No frontend HTTP call, type, or form field defines refresh request parameters. Auth session store exists (`src/services/authSession.ts`) but production path does not send refresh payloads.

---

# 6. Logout / Revoke

| | |
|---|---|
| **API name** | Logout / Revoke |
| **Method** | POST |
| **Endpoint** | `/api/v1/auth/logout` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Logout is local only (`src/utils/customerSession.ts`, `settings.tsx`, Profile, SideMenu). No revoke body is defined.

---

# 7. Get Profile

| | |
|---|---|
| **API name** | Get Profile |
| **Method** | GET |
| **Endpoint** | `/api/v1/customers/me` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Profile is loaded from SecureStore (`src/services/customerProfileStore.ts`). No GET query params defined.

---

# 8. Update Profile

| | |
|---|---|
| **API name** | Update Profile |
| **Method** | PATCH |
| **Endpoint** | `/api/v1/customers/me` |
| **Authentication** | Required (proposed) |

### Path parameters

None — **NOT DEFINED**

### Query parameters

None — **NOT DEFINED**

### Request body (local save draft — would map to PATCH)

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `name` | `string` | Required in draft UI | **INFERRED FROM FRONTEND** | `CustomerProfileDraft` in `src/types/customerProfile.ts`; `edit-profile.tsx` → `saveProfile` |
| `email` | `string` | Optional (validated if non-empty) | **INFERRED FROM FRONTEND** | Same |
| `dateOfBirth` | `string` | Optional | **INFERRED FROM FRONTEND** | Same |
| `avatarUri` | `string \| null` | Optional | **INFERRED FROM FRONTEND** | Local URI only today — not an upload field on this PATCH |
| `avatarPreset` | `'sunny' \| 'leaf' \| 'basket' \| 'spice' \| null` | Optional | **INFERRED FROM FRONTEND** | Client-only preset; may not be a server field |

---

# 9. Upload Avatar

| | |
|---|---|
| **API name** | Upload Avatar |
| **Method** | POST |
| **Endpoint** | `/api/v1/customers/me/avatar` |
| **Authentication** | Required (proposed) |

### Path / Query

None — **NOT DEFINED**

### Request body / multipart

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| Image file / local photo URI | local file URI from camera/gallery | Required for photo path | **INFERRED FROM FRONTEND** | `edit-profile.tsx` / `ProfilePhotoActionSheet`; stored as `avatarUri` — **multipart field name NOT DEFINED** |

MIME, max size, and form field name are **NOT DEFINED** in frontend.

---

# 10. List Addresses

| | |
|---|---|
| **API name** | List Addresses |
| **Method** | GET |
| **Endpoint** | `/api/v1/customers/me/addresses` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Loaded from SecureStore by `ownerKey` (`src/services/savedAddressStore.ts`). No list query filters defined.

---

# 11. Create Address

| | |
|---|---|
| **API name** | Create Address |
| **Method** | POST |
| **Endpoint** | `/api/v1/customers/me/addresses` |
| **Authentication** | Required (proposed) |

### Path / Query

None — **NOT DEFINED**

### Request body (`SavedAddressDraft` fields used on save)

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `label` | `'Home' \| 'Work' \| 'Other'` | Required | **INFERRED FROM FRONTEND** | `src/types/savedAddress.ts`; `address-form.tsx` |
| `customLabel` | `string` | Optional (used when label is Other) | **INFERRED FROM FRONTEND** | Same |
| `houseNumber` | `string` | Optional | **INFERRED FROM FRONTEND** | Same |
| `buildingStreet` | `string` | Optional | **INFERRED FROM FRONTEND** | Same |
| `area` | `string` | Optional | **INFERRED FROM FRONTEND** | Same |
| `addressLine1` | `string` | Required for saved address | **INFERRED FROM FRONTEND** | Same |
| `landmark` | `string` | Optional | **INFERRED FROM FRONTEND** | Same |
| `city` | `string` | Required in saved model | **INFERRED FROM FRONTEND** | Same |
| `state` | `string` | Required in saved model | **INFERRED FROM FRONTEND** | Same |
| `postalCode` | `string` | Required in saved model | **INFERRED FROM FRONTEND** | Same |
| `instructions` | `string` | Optional | **INFERRED FROM FRONTEND** | Same |
| `latitude` | `number` | Optional | **INFERRED FROM FRONTEND** | Same |
| `longitude` | `number` | Optional | **INFERRED FROM FRONTEND** | Same |
| `source` | `'gps' \| 'manual' \| 'saved' \| 'search' \| 'map'` | Required on draft | **INFERRED FROM FRONTEND** | `src/types/location.ts` `LocationSource` |
| `country` | `string` | Present on saved address (default India in store logic) | **INFERRED FROM FRONTEND** | `SavedAddress.country` — draft type omits; set when converting draft → saved |

`isDefault` / `id` / `updatedAt` are assigned locally on save — **not user request fields** for create.

---

# 12. Update Address

| | |
|---|---|
| **API name** | Update Address |
| **Method** | PATCH |
| **Endpoint** | `/api/v1/customers/me/addresses/{addressId}` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `addressId` | `string` | Required | **INFERRED FROM FRONTEND** | `SavedAddress.id`; `saveAddress(draft, { id })` in address context/store |

### Query parameters

None — **NOT DEFINED**

### Request body

Same draft fields as **#11 Create Address** — **INFERRED FROM FRONTEND** (`SavedAddressDraft` + optional `id` on save).

---

# 13. Delete Address

| | |
|---|---|
| **API name** | Delete Address |
| **Method** | DELETE |
| **Endpoint** | `/api/v1/customers/me/addresses/{addressId}` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `addressId` | `string` | Required | **INFERRED FROM FRONTEND** | `addresses.tsx` delete flow; `deleteAddress(addressId)` |

### Query / Body

None — **NOT DEFINED**

---

# 14. Set Default Address

| | |
|---|---|
| **API name** | Set Default Address |
| **Method** | PUT |
| **Endpoint** | `/api/v1/customers/me/addresses/{addressId}/default` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `addressId` | `string` | Required | **INFERRED FROM FRONTEND** | `setDefaultAddress` in `SavedAddressesContext` / store |

### Query / Body

None — **NOT DEFINED**

---

# 15. Check Serviceability

| | |
|---|---|
| **API name** | Check Serviceability |
| **Method** | GET |
| **Endpoint** | `/api/v1/delivery/serviceability` |
| **Authentication** | Optional (proposed) |

### Path parameters

None — **NOT DEFINED**

### Query parameters (location UI captures these values; no HTTP call exists)

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `postalCode` | `string` | Optional if lat/lng present | **INFERRED FROM FRONTEND** | `DeliveryLocation.postalCode` / manual address PIN (`src/types/location.ts`, location screens) |
| `latitude` | `number` | Optional if PIN present | **INFERRED FROM FRONTEND** | `DeliveryLocation.latitude` |
| `longitude` | `number` | Optional if PIN present | **INFERRED FROM FRONTEND** | `DeliveryLocation.longitude` |

Exact required combination is **NOT DEFINED** (no API client).

### Request body

None — **NOT DEFINED**

---

# 16. List Products

| | |
|---|---|
| **API name** | List Products |
| **Method** | GET |
| **Endpoint** | `/api/values/products` |
| **Authentication** | Optional (summary); **NOT DEFINED** in live client (endpoint never called) |

### Path parameters

None — **NOT DEFINED**

### Query parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `company` | `string` | Required on published help contract | **CONFIRMED** | `docs/backend-requirements.md`; comments in `src/data/shopCatalog.ts`, `src/constants/liveData.ts` |

### Shop UI filter/sort/search values (local only today — not sent)

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `category` / category id | `string` | Optional | **INFERRED FROM FRONTEND** | `shop.tsx` `useLocalSearchParams` `category`; `ProductFiltersState.categoryIds` |
| `q` | `string` | Optional | **INFERRED FROM FRONTEND** | `shop.tsx` search param `q` |
| `sort` | `'catalogue' \| 'price-asc' \| 'price-desc' \| 'name-asc' \| 'name-desc'` | Optional | **INFERRED FROM FRONTEND** | `src/types/productFilters.ts` `ProductSortId` |
| `priceMin` | `number \| null` | Optional | **INFERRED FROM FRONTEND** | `ProductFiltersState` |
| `priceMax` | `number \| null` | Optional | **INFERRED FROM FRONTEND** | `ProductFiltersState` |
| `inStockOnly` | `boolean` | Optional | **INFERRED FROM FRONTEND** | `ProductFiltersState` |
| `discountedOnly` | `boolean` | Optional | **INFERRED FROM FRONTEND** | `ProductFiltersState` |
| `ratingStars` | `(3 \| 4 \| 5)[]` | Optional | **INFERRED FROM FRONTEND** | `ProductFiltersState` |
| `brand` | `string` | Optional | **INFERRED FROM FRONTEND** | Home `BrandCarousel` navigates with brand param; Shop **does not consume** it today |

### Request body

None — **NOT DEFINED**

**Note:** Actual `company` value to send is **NOT DEFINED** in frontend env/code.

---

# 17. Get Product Details

| | |
|---|---|
| **API name** | Get Product Details |
| **Method** | GET |
| **Endpoint** | `/api/v1/products/{productId}` |
| **Authentication** | Optional (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `productId` | `string` | Required | **INFERRED FROM FRONTEND** | `src/app/product/[id].tsx` `useLocalSearchParams` `id`; `findDemoProduct` |

### Query / Body

None — **NOT DEFINED**

---

# 18. List Categories

| | |
|---|---|
| **API name** | List Categories |
| **Method** | GET |
| **Endpoint** | `/api/v1/categories` |
| **Authentication** | Public (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Categories come from `mockCategories` / `subcategoryCatalog` with no request params.

---

# 19. Get Home Feed

| | |
|---|---|
| **API name** | Get Home Feed |
| **Method** | GET |
| **Endpoint** | `/api/v1/home` |
| **Authentication** | Optional (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Home loads static fixtures (`src/app/(tabs)/home.tsx`, `src/data/homeFeed.ts`). No query params defined.

---

# 20. Search Suggestions

| | |
|---|---|
| **API name** | Search Suggestions |
| **Method** | GET |
| **Endpoint** | `/api/v1/search/suggestions` |
| **Authentication** | Public (proposed) |

### Path parameters

None — **NOT DEFINED**

### Query parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `q` | `string` | Required for meaningful results | **INFERRED FROM FRONTEND** | Shop search query; `src/data/searchSuggestions.ts` filters by query text |

### Request body

None — **NOT DEFINED**

---

# 21. List Brands

| | |
|---|---|
| **API name** | List Brands |
| **Method** | GET |
| **Endpoint** | `/api/v1/brands` |
| **Authentication** | Public (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Data from `src/data/mockBrands.ts` with no request inputs.

---

# 22. Get Collection

| | |
|---|---|
| **API name** | Get Collection |
| **Method** | GET |
| **Endpoint** | `/api/v1/collections/{collectionId}` |
| **Authentication** | Public (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `collectionId` | `'all' \| 'fresh' \| 'diwali' \| 'electronics' \| 'organic'` (string) | Required | **INFERRED FROM FRONTEND** | `ShoppingCollectionId` in `src/types/shoppingCollection.ts`; `collection/[id].tsx` |

### Query / Body

None — **NOT DEFINED**  
(Chip/search filtering is local in `CategoryShoppingScreen` — not a defined server query contract.)

---

# 23. List Stores

| | |
|---|---|
| **API name** | List Stores |
| **Method** | GET |
| **Endpoint** | `/api/v1/stores` |
| **Authentication** | Optional (proposed) |

### Path / Query / Body

None — **NOT DEFINED** in frontend.

`DEMO_STORES` is a static list (`src/data/demoStores.ts`). Lat/lng query was mentioned only as a documentation proposal — **not present as a frontend API client parameter**.

---

# 24. Get Store

| | |
|---|---|
| **API name** | Get Store |
| **Method** | GET |
| **Endpoint** | `/api/v1/stores/{storeId}` |
| **Authentication** | Optional (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `storeId` | `string` | Required | **INFERRED FROM FRONTEND** | `store/[id].tsx`; `findDemoStore(id)` |

### Query / Body

None — **NOT DEFINED**

---

# 25. Get Cart

| | |
|---|---|
| **API name** | Get Cart |
| **Method** | GET |
| **Endpoint** | `/api/v1/cart` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Cart is in-memory `MockCartContext` (`quantities`, `leaveAtDoor`).

---

# 26. Upsert Cart Item

| | |
|---|---|
| **API name** | Upsert Cart Item |
| **Method** | PUT |
| **Endpoint** | `/api/v1/cart/items/{productId}` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `productId` | `string` | Required | **INFERRED FROM FRONTEND** | `MockCartContext.setQuantity` / `add`; PDP / ProductCard |

### Query parameters

None — **NOT DEFINED**

### Request body

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `quantity` | `number` | Required | **INFERRED FROM FRONTEND** | `setQuantity(productId, quantity)`; PDP clamps select qty 1–99 |

---

# 27. Remove Cart Item

| | |
|---|---|
| **API name** | Remove Cart Item |
| **Method** | DELETE |
| **Endpoint** | `/api/v1/cart/items/{productId}` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `productId` | `string` | Required | **INFERRED FROM FRONTEND** | Quantity set to `0` deletes key in `MockCartContext` |

### Query / Body

None — **NOT DEFINED**

---

# 28. Clear Cart

| | |
|---|---|
| **API name** | Clear Cart |
| **Method** | DELETE |
| **Endpoint** | `/api/v1/cart` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

After demo place-order, lines are cleared by setting each quantity to 0 (`PaymentScreen`) — no dedicated clear API payload.

---

# 29. Cart / Checkout Quote

| | |
|---|---|
| **API name** | Cart / Checkout Quote |
| **Method** | POST |
| **Endpoint** | `/api/v1/checkout/quote` |
| **Authentication** | Required (proposed) |

### Path / Query

None — **NOT DEFINED**

### Request body (values the UI already holds when showing a bill)

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| Cart lines (`productId` + `quantity`) | lines from `quantities` map | Required for non-empty quote | **INFERRED FROM FRONTEND** | `MockCartContext`; Checkout/Payment bill builders |
| Delivery location / address completeness | `DeliveryLocation` fields | Required for checkout continue | **INFERRED FROM FRONTEND** | `useDeliveryLocation().confirmed`; `isCompleteDeliveryLocation` |
| `leaveAtDoor` | `boolean` | Optional | **INFERRED FROM FRONTEND** | `MockCartContext.leaveAtDoor`; Checkout / ReviewCart |
| `instructions` | `string` | Optional | **INFERRED FROM FRONTEND** | `CheckoutScreen` local state |
| Coupon code / id | `string` | Optional | **INFERRED FROM FRONTEND** | `PreviewSession.couponId` + `demoCouponById` → `DemoCoupon.code` |

Exact JSON property names (`addressId` vs embedded address, `couponCode` vs `couponId`) are **NOT DEFINED** by a live client — only the above UI values exist.

---

# 30. Get Wishlist

| | |
|---|---|
| **API name** | Get Wishlist |
| **Method** | GET |
| **Endpoint** | `/api/v1/wishlist` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Local store is a product-id array (`src/services/wishlistStore.ts`).

---

# 31. Add Wishlist Item

| | |
|---|---|
| **API name** | Add Wishlist Item |
| **Method** | POST |
| **Endpoint** | `/api/v1/wishlist/items` |
| **Authentication** | Required (proposed) |

### Path / Query

None — **NOT DEFINED**

### Request body

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `productId` | `string` | Required | **INFERRED FROM FRONTEND** | `toggleWishlistId` / `addWishlistId` in `wishlistStore.ts`; ProductCard / PDP |

Exact body key name is inferred from the product id argument — no HTTP schema in code.

---

# 32. Remove Wishlist Item

| | |
|---|---|
| **API name** | Remove Wishlist Item |
| **Method** | DELETE |
| **Endpoint** | `/api/v1/wishlist/items/{productId}` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `productId` | `string` | Required | **INFERRED FROM FRONTEND** | `removeWishlistId` / toggle off |

### Query / Body

None — **NOT DEFINED**

---

# 33. List Coupons

| | |
|---|---|
| **API name** | List Coupons |
| **Method** | GET |
| **Endpoint** | `/api/v1/coupons` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED** as HTTP params.

UI filters (available / collected / expired) are client-side over `DEMO_COUPONS` (`coupons.tsx`) — **not a defined server query contract**.

---

# 34. Collect Coupon

| | |
|---|---|
| **API name** | Collect Coupon |
| **Method** | POST |
| **Endpoint** | `/api/v1/coupons/{couponId}/collect` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `couponId` | `string` | Required | **INFERRED FROM FRONTEND** | `DemoCoupon.id`; `couponCollectionStore` |

### Query / Body

None — **NOT DEFINED**

---

# 35. Validate Coupon

| | |
|---|---|
| **API name** | Validate Coupon |
| **Method** | POST |
| **Endpoint** | `/api/v1/coupons/validate` |
| **Authentication** | Required (proposed) |

### Path / Query

None — **NOT DEFINED**

### Request body (values used in local discount math)

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| Coupon identity (`code` and/or `id`) | `string` | Required | **INFERRED FROM FRONTEND** | `DemoCoupon.code` / `id`; `PreviewSession.couponId` |
| Cart item subtotal | `number` (INR) | Required for discount calc | **INFERRED FROM FRONTEND** | `computeDemoCouponDiscount(coupon, provisional.itemTotal)` in Checkout/Payment/Cart |
| Coupon rule fields used locally | `discountType`, `discountValue`, `minimum`, `maxDiscount?`, `expiresOn` | Used in local validation | **INFERRED FROM FRONTEND** | `src/types/coupons.ts`, `demoCoupons.ts` — these are coupon **definition** fields, not necessarily request body |

Exact validate request JSON is **NOT DEFINED** (no HTTP client).

---

# 36. Place Order

| | |
|---|---|
| **API name** | Place Order |
| **Method** | POST |
| **Endpoint** | `/api/v1/orders` |
| **Authentication** | Required (proposed) |

### Path / Query

None — **NOT DEFINED**

### Request body — values assembled in demo place-order (`PaymentScreen.placeDemoCodOrder`)

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| Line items `id` (product id) | `string` | Required | **INFERRED FROM FRONTEND** | `items: lines.map(...)` in `PaymentScreen.tsx` |
| Line items `quantity` | `number` | Required | **INFERRED FROM FRONTEND** | Same |
| Line items `name` | `string` | Present on demo order snapshot | **INFERRED FROM FRONTEND** | Same (snapshot; server should not trust as price source) |
| Line items `unit` | `string` | Optional on `OrderLine` | **INFERRED FROM FRONTEND** | Same |
| Delivery address title/line | `string` | Required for place in UI | **INFERRED FROM FRONTEND** | From `confirmed` `DeliveryLocation` / `formatDeliveryAddress` |
| Payment method | `'cod' \| 'upi' \| 'card'` | Required in UI | **INFERRED FROM FRONTEND** | `CheckoutPaymentMethodId`; route param `method` |
| Display total | `number` | Present on demo order | **INFERRED FROM FRONTEND** | `bill.grandTotal` — **must not be trusted server-side** |

### Captured nearby in checkout UI but **not** passed into `placeOrder(...)` today

| Field | Data type | Evidence tag | Source |
|---|---|---|---|
| `leaveAtDoor` | `boolean` | **INFERRED FROM FRONTEND** (UI only; not in demo place payload) | `MockCartContext` |
| `instructions` | `string` | **INFERRED FROM FRONTEND** (Checkout local state; not forwarded to Payment place) | `CheckoutScreen.tsx` |
| Coupon id/code | `string` | **INFERRED FROM FRONTEND** (affects bill; cleared after place) | `PreviewSession.couponId` |

### Headers

`Idempotency-Key` — **NOT DEFINED** in frontend code (only mentioned as proposal in audit docs).

---

# 37. List Orders

| | |
|---|---|
| **API name** | List Orders |
| **Method** | GET |
| **Endpoint** | `/api/v1/orders` |
| **Authentication** | Required (proposed) |

### Path parameters

None — **NOT DEFINED**

### Query parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| Client filter id | `'all' \| 'active' \| 'delivered'` | Optional (local filter today) | **INFERRED FROM FRONTEND** | `OrdersFilterId` in `src/utils/orderListing.ts`; `orders.tsx` |

Server query name (e.g. `statusGroup`) is **NOT DEFINED** in code.

### Request body

None — **NOT DEFINED**

---

# 38. Get Order

| | |
|---|---|
| **API name** | Get Order |
| **Method** | GET |
| **Endpoint** | `/api/v1/orders/{orderId}` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `orderId` | `string` | Required | **INFERRED FROM FRONTEND** | `order/[id].tsx` param `id`; `findOrder` / `findPastOrder` |

### Query / Body

None — **NOT DEFINED**

---

# 39. Get Active Order

| | |
|---|---|
| **API name** | Get Active Order |
| **Method** | GET |
| **Endpoint** | `/api/v1/orders/active` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

`readActiveOrder()` returns empty with no parameters (`src/data/activeOrder.ts`). Track may also take optional `id` route param for a specific order — that is a **screen param**, not a defined `/orders/active` query.

---

# 40. Cancel Order

| | |
|---|---|
| **API name** | Cancel Order |
| **Method** | POST |
| **Endpoint** | `/api/v1/orders/{orderId}/cancel` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `orderId` | `string` | Required | **INFERRED FROM FRONTEND** | `cancelOrder(id, reasonIds)` in `PreviewSessionContext` |

### Query parameters

None — **NOT DEFINED**

### Request body

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `reasonIds` | `string[]` | Required in UI confirm | **INFERRED FROM FRONTEND** | `OrderCancelModal` → `onConfirm(reasonIds)`; ids from `src/data/orderCancelReasons.ts` |

---

# 41. Request Return

| | |
|---|---|
| **API name** | Request Return |
| **Method** | POST |
| **Endpoint** | `/api/v1/orders/{orderId}/returns` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `orderId` | `string` | Required | **INFERRED FROM FRONTEND** | `requestReturn(id, payload)` |

### Query parameters

None — **NOT DEFINED**

### Request body

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `reasonIds` | `string[]` | Required (≥1) | **INFERRED FROM FRONTEND** | `PreviewSessionContext.requestReturn`; `OrderReturnRefundModal`; `orderReturnReasons.ts` |
| `itemIds` | `string[]` | Required (≥1) | **INFERRED FROM FRONTEND** | Same (catalogue line ids) |
| `photoUris` | `string[]` | Required (≥1, max 4 locally) | **INFERRED FROM FRONTEND** | Same — local URIs; upload field names **NOT DEFINED** |

---

# 42. List Returns

| | |
|---|---|
| **API name** | List Returns |
| **Method** | GET |
| **Endpoint** | `/api/v1/returns` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

`returns.tsx` filters preview orders locally; no list API params.

---

# 43. Get Order Tracking

| | |
|---|---|
| **API name** | Get Order Tracking |
| **Method** | GET |
| **Endpoint** | `/api/v1/orders/{orderId}/tracking` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `orderId` | `string` | Required | **INFERRED FROM FRONTEND** | Track screen / `getDemoOrderTracking(order)` |

### Query / Body

None — **NOT DEFINED**

---

# 44. List Payment Methods

| | |
|---|---|
| **API name** | List Payment Methods |
| **Method** | GET |
| **Endpoint** | `/api/v1/payments/methods` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Methods are a static client array: `cod`, `upi`, `card` (`checkoutPaymentMethods.ts`, `paymentMethodIds`).

---

# 45. Initiate Online Payment

| | |
|---|---|
| **API name** | Initiate Online Payment |
| **Method** | POST |
| **Endpoint** | `/api/v1/payments/initiate` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

UI blocks UPI/Card with “gateway not connected”. No initiate payload exists in code. Related UI values nearby: selected `methodId`, cart bill total, order not yet created for online path.

---

# 46. Confirm / Verify Payment

| | |
|---|---|
| **API name** | Confirm / Verify Payment |
| **Method** | POST |
| **Endpoint** | `/api/v1/payments/confirm` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

No payment callback client exists.

---

# 47. Get/Update Payment Prefs

| | |
|---|---|
| **API name** | Get/Update Payment Prefs |
| **Method** | GET / PATCH |
| **Endpoint** | `/api/v1/customers/me/payment-preferences` |
| **Authentication** | Required (proposed) |

### Path / Query

None — **NOT DEFINED**

### PATCH body (local preference state)

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `primaryMethodId` | `'card' \| 'upi' \| 'cod'` | Required in local state | **INFERRED FROM FRONTEND** | `PaymentPreferenceState` in `src/types/paymentPreferences.ts`; `my-payment.tsx` |
| `cardPreviewHidden` | `boolean` | Required in local state | **INFERRED FROM FRONTEND** | Same |

GET has no parameters — **NOT DEFINED**.

---

# 48. List Transactions

| | |
|---|---|
| **API name** | List Transactions |
| **Method** | GET |
| **Endpoint** | `/api/v1/transactions` |
| **Authentication** | Required (proposed) |

### Path parameters

None — **NOT DEFINED**

### Query parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| Client filter | `'all' \| 'payments' \| 'refunds'` | Optional (local) | **INFERRED FROM FRONTEND** | `TransactionsFilterId` in `src/types/transactions.ts`; `transactions.tsx` |

Server query name is **NOT DEFINED**.

### Request body

None — **NOT DEFINED**

---

# 49. Get Wallet

| | |
|---|---|
| **API name** | Get Wallet |
| **Method** | GET |
| **Endpoint** | `/api/v1/wallet` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

`wallet.tsx` shows unavailable balance; no request fields.

---

# 50. Top Up Wallet

| | |
|---|---|
| **API name** | Top Up Wallet |
| **Method** | POST |
| **Endpoint** | `/api/v1/wallet/top-up` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

“Add Money” control is disabled with no amount input.

---

# 51. List Product Reviews

| | |
|---|---|
| **API name** | List Product Reviews |
| **Method** | GET |
| **Endpoint** | `/api/v1/products/{productId}/reviews` |
| **Authentication** | Optional (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `productId` | `string` | Required | **INFERRED FROM FRONTEND** | PDP `product.id`; `summaryFor` / `sortedReviewsFor` |

### Query parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `sort` | `'helpful' \| 'newest'` | Optional | **INFERRED FROM FRONTEND** | `ReviewSortId` in `src/types/productReviews.ts`; PDP sort state |

Pagination query names are **NOT DEFINED**.

### Request body

None — **NOT DEFINED**

---

# 52. Create Product Review

| | |
|---|---|
| **API name** | Create Product Review |
| **Method** | POST |
| **Endpoint** | `/api/v1/products/{productId}/reviews` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `productId` | `string` | Required | **INFERRED FROM FRONTEND** | `DeviceReviewDraft.productId` |

### Query parameters

None — **NOT DEFINED**

### Request body (`DeviceReviewDraft`)

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `rating` | `number` | Required | **INFERRED FROM FRONTEND** | `src/types/productReviews.ts`; `WriteReviewSheet` / PDP submit |
| `body` | `string` | Required (order-review UI enforces ≥8 chars) | **INFERRED FROM FRONTEND** | Same; `ProductOrderReviewScreen` |
| `tags` | `string[]` | Optional | **INFERRED FROM FRONTEND** | Quick tags `REVIEW_QUICK_TAGS` |
| `photoUris` | `string[]` | Optional (local URIs; max 4 in stores) | **INFERRED FROM FRONTEND** | Same |
| `authorName` | `string` | Required in draft | **INFERRED FROM FRONTEND** | From profile/session name on PDP |

Upload multipart field names are **NOT DEFINED**.

---

# 53. Vote Review

| | |
|---|---|
| **API name** | Vote Review |
| **Method** | POST |
| **Endpoint** | `/api/v1/reviews/{reviewId}/vote` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `reviewId` | `string` | Required | **INFERRED FROM FRONTEND** | `ProductReview.id`; `setVote(review, vote)` |

### Query parameters

None — **NOT DEFINED**

### Request body

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `vote` | `'helpful' \| 'not_helpful'` | Required | **INFERRED FROM FRONTEND** | `ReviewVote` in `src/types/productReviews.ts` |

Exact JSON key name is inferred from the TypeScript union — no HTTP client.

---

# 54. Delivery Review

| | |
|---|---|
| **API name** | Delivery Review |
| **Method** | POST |
| **Endpoint** | `/api/v1/orders/{orderId}/delivery-review` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `orderId` | `string` | Required | **INFERRED FROM FRONTEND** | `delivery-review.tsx` / `DeliveryReviewScreen` param `id` |

### Query parameters

None — **NOT DEFINED**

### Request body

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `rating` | `number` (UI requires ≥1) | Required | **INFERRED FROM FRONTEND** | `DeliveryReviewScreen` → `upsertDeliveryReview` |
| `body` | `string` | Optional | **INFERRED FROM FRONTEND** | Same (tags may be appended into composed body text locally) |
| `tags` | `string[]` | Optional (max 4 locally) | **INFERRED FROM FRONTEND** | Quick tags in `DeliveryReviewScreen` |

---

# 55. List Notifications

| | |
|---|---|
| **API name** | List Notifications |
| **Method** | GET |
| **Endpoint** | `/api/v1/notifications` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Inbox uses demo seed + local read/cleared overlay (`notificationInboxStore.ts`).

---

# 56. Mark Notification Read

| | |
|---|---|
| **API name** | Mark Notification Read |
| **Method** | PATCH |
| **Endpoint** | `/api/v1/notifications/{id}/read` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `id` | `string` | Required | **INFERRED FROM FRONTEND** | `DemoNotification.id`; mark-read in notifications inbox store |

### Query / Body

None — **NOT DEFINED**

---

# 57. Mark All Read

| | |
|---|---|
| **API name** | Mark All Read |
| **Method** | POST |
| **Endpoint** | `/api/v1/notifications/read-all` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

---

# 58. Clear Inbox

| | |
|---|---|
| **API name** | Clear Inbox |
| **Method** | DELETE |
| **Endpoint** | `/api/v1/notifications` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Local `cleared: true` flag only.

---

# 59. Register Push Token

| | |
|---|---|
| **API name** | Register Push Token |
| **Method** | POST |
| **Endpoint** | `/api/v1/notifications/push-token` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

No push-token registration code exists in the app.

---

# 60. Notification Preferences

| | |
|---|---|
| **API name** | Notification Preferences |
| **Method** | GET / PATCH |
| **Endpoint** | `/api/v1/customers/me/notification-preferences` |
| **Authentication** | Required (proposed) |

### Path / Query

None — **NOT DEFINED**

### PATCH body (`AppSettingsPrefs`)

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `orderAlerts` | `boolean` | Present in prefs | **INFERRED FROM FRONTEND** | `src/services/appSettingsStore.ts`; `settings.tsx` |
| `offerAlerts` | `boolean` | Present in prefs | **INFERRED FROM FRONTEND** | Same |

GET has no parameters — **NOT DEFINED**.

---

# 61. List FAQs

| | |
|---|---|
| **API name** | List FAQs |
| **Method** | GET |
| **Endpoint** | `/api/v1/support/faqs` |
| **Authentication** | Public (proposed) |

### Path / Query / Body

None — **NOT DEFINED** as HTTP.

Client search uses local `query` string + category filter (`help.tsx`, `filterSupportFaqs`) — not a defined server API parameter schema.

---

# 62. Get Chat Thread

| | |
|---|---|
| **API name** | Get Chat Thread |
| **Method** | GET |
| **Endpoint** | `/api/v1/support/chat` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Thread keyed locally by `ownerKey` in SecureStore (`supportChatStore.ts`).

---

# 63. Send Chat Message

| | |
|---|---|
| **API name** | Send Chat Message |
| **Method** | POST |
| **Endpoint** | `/api/v1/support/chat/messages` |
| **Authentication** | Required (proposed) |

### Path / Query

None — **NOT DEFINED**

### Request body (local message shape)

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `kind` | `'text' \| 'image'` | Required | **INFERRED FROM FRONTEND** | `SupportChatKind` in `src/types/supportChat.ts` |
| `text` | `string` | Required when kind=text (max 1000) | **INFERRED FROM FRONTEND** | `SUPPORT_CHAT_MAX_TEXT`; chat screen |
| `imageUri` | `string` | Required when kind=image (max 5MB locally) | **INFERRED FROM FRONTEND** | `SUPPORT_CHAT_MAX_IMAGE_BYTES`; local URI — upload field name **NOT DEFINED** |

---

# 64. List Complaints

| | |
|---|---|
| **API name** | List Complaints |
| **Method** | GET |
| **Endpoint** | `/api/v1/support/complaints` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

---

# 65. Create Complaint

| | |
|---|---|
| **API name** | Create Complaint |
| **Method** | POST |
| **Endpoint** | `/api/v1/support/complaints` |
| **Authentication** | Required (proposed) |

### Path / Query

None — **NOT DEFINED**

### Request body (`ComplaintDraft`)

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `category` | `'order' \| 'delivery' \| 'product' \| 'payment' \| 'app' \| 'other'` | Required | **INFERRED FROM FRONTEND** | `src/types/complaints.ts`; `complaints/new.tsx` |
| `subject` | `string` | Required | **INFERRED FROM FRONTEND** | Same |
| `description` | `string` | Required | **INFERRED FROM FRONTEND** | Same |
| `orderId` | `string` | Optional | **INFERRED FROM FRONTEND** | Same |

---

# 66. Get Complaint

| | |
|---|---|
| **API name** | Get Complaint |
| **Method** | GET |
| **Endpoint** | `/api/v1/support/complaints/{id}` |
| **Authentication** | Required (proposed) |

### Path parameters

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| `id` | `string` | Required | **INFERRED FROM FRONTEND** | `complaints/[id].tsx` route param |

### Query / Body

None — **NOT DEFINED**

---

# 67. Get Referral Code

| | |
|---|---|
| **API name** | Get Referral Code |
| **Method** | GET |
| **Endpoint** | `/api/v1/referrals/me` |
| **Authentication** | Required (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Code is derived client-side (`buildDemoReferralCode(seed)` in `src/utils/referralCode.ts`) from mobile/customerId — not requested from a server.

---

# 68. Privacy Policy

| | |
|---|---|
| **API name** | Privacy Policy |
| **Method** | GET |
| **Endpoint** | `/api/v1/content/privacy` |
| **Authentication** | Public (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Static/placeholder screen `privacy.tsx`.

---

# 69. Terms & Conditions

| | |
|---|---|
| **API name** | Terms & Conditions |
| **Method** | GET |
| **Endpoint** | `/api/v1/content/terms` |
| **Authentication** | Public (proposed) |

### Path / Query / Body

None — **NOT DEFINED**

Static/placeholder screen `terms.tsx`.

---

# 70. Upload Media

| | |
|---|---|
| **API name** | Upload Media |
| **Method** | POST |
| **Endpoint** | `/api/v1/media/upload` |
| **Authentication** | Required (proposed) |

### Path / Query

None — **NOT DEFINED**

### Request body / multipart

| Field | Data type | Required / optional | Evidence tag | Source |
|---|---|---|---|---|
| Local image URI / file | local URI | Required for returns/reviews/chat image paths | **INFERRED FROM FRONTEND** | Return photos (max 4), review photos, chat images |

Form field name, MIME allow-list, and server URL response shape are **NOT DEFINED** (no upload client). Local limits observed: return/review max 4 photos; chat max 5MB (`SUPPORT_CHAT_MAX_IMAGE_BYTES`).

---

## Summary counts (parameter evidence, not API status)

| Category | Notes |
|---|---|
| APIs with **CONFIRMED** live/help request contracts | #1–#4 body fields; #16 `company` query |
| APIs whose request inputs are only **INFERRED FROM FRONTEND** | Most commerce/account endpoints (#7–#15, #17, #20, #22, #24, #26–#27, #29–#32, #34–#41, #43, #47–#48, #51–#54, #56, #60, #63, #65–#66, #70 partial) |
| APIs with **no request parameters defined** | #5–#7, #10, #18–#19, #21, #23, #25, #28, #30, #33, #39, #42, #44–#46, #49–#50, #55, #57–#59, #61–#62, #64, #67–#69 (GET/empty or unimplemented with no payload) |

---

## Backend developer notes

1. Treat **CONFIRMED** fields as the only currently wireable request contracts.  
2. Treat **INFERRED FROM FRONTEND** as UI evidence for designing request schemas — confirm property names with the frontend team before locking OpenAPI.  
3. Treat **NOT DEFINED** as open design work — do not assume undocumented headers (`Authorization`, `Idempotency-Key`) or query names until published.  
4. Do not accept client-submitted product prices/totals as authoritative even when the demo place-order object includes `total` / `totalAmount`.  
5. Help-page register fields the app does not collect must remain optional on the server if the current mobile app is the client.

---

**Sources consulted:** `src/constants/api.ts`, `src/services/customerAuth.ts`, `src/types/*`, cart/checkout/payment/order/review/complaint/settings UI, `docs/backend-requirements.md`, `docs/api-requirements/API_ENDPOINT_SUMMARY.md`, `docs/api-requirements/API_REQUIREMENTS.md`.  
**No application source files were modified to produce this document.**
