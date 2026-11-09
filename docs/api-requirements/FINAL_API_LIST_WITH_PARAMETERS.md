# FINAL API LIST WITH PARAMETERS

| # | API Name | HTTP Method | Endpoint | Parameter Name | Data Type | Required / Optional | Body / Query / Path |
|---|---|---|---|---|---|---|---|
| 1 | Send OTP | POST | `/api/values/customer/send-otp` | Mobile | string | Required | Body |
| 2 | Resend OTP | POST | `/api/values/customer/resend-otp` | Mobile | string | Required | Body |
| 3 | Verify OTP | POST | `/api/values/customer/verify-otp` | Mobile | string | Required | Body |
| 3 | Verify OTP | POST | `/api/values/customer/verify-otp` | OTP | string | Required | Body |
| 4 | Register Customer | POST | `/api/values/customer/register` | Mobile | string | Required | Body |
| 4 | Register Customer | POST | `/api/values/customer/register` | Name | string | Required | Body |
| 4 | Register Customer | POST | `/api/values/customer/register` | Email | string | Required | Body |
| 4 | Register Customer | POST | `/api/values/customer/register` | Address | string | Optional | Body |
| 4 | Register Customer | POST | `/api/values/customer/register` | DOB | string | Optional | Body |
| 4 | Register Customer | POST | `/api/values/customer/register` | Country | string | Optional | Body |
| 4 | Register Customer | POST | `/api/values/customer/register` | State | string | Optional | Body |
| 4 | Register Customer | POST | `/api/values/customer/register` | City | string | Optional | Body |
| 4 | Register Customer | POST | `/api/values/customer/register` | Pincode | string | Optional | Body |
| 4 | Register Customer | POST | `/api/values/customer/register` | MobileVerificationToken | string | Optional | Body |
| 5 | Refresh Session | POST | `/api/values/customer/refresh-token` | RefreshToken | string | Required | Body |
| 6 | Logout / Revoke | POST | `/api/values/customer/logout` | RefreshToken | string | Optional | Body |
| 7 | Get Profile | GET | `/api/values/customer/profile` | — | — | — | — |
| 8 | Update Profile | PUT | `/api/values/customer/profile` | Name | string | Required | Body |
| 8 | Update Profile | PUT | `/api/values/customer/profile` | Email | string | Required | Body |
| 8 | Update Profile | PUT | `/api/values/customer/profile` | DOB | string | Optional | Body |
| 9 | Upload Avatar | POST | `/api/v1/customers/me/avatar` | TBD | file | TBD | Body |
| 10 | List Addresses | GET | `/api/values/customer/addresses` | — | — | — | — |
| 11 | Create Address | POST | `/api/values/customer/addresses` | Label | string | Required | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | CustomLabel | string | Optional | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | HouseNumber | string | Optional | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | BuildingStreet | string | Optional | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | Area | string | Optional | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | AddressLine1 | string | Required | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | Landmark | string | Optional | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | City | string | Required | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | State | string | Required | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | PostalCode | string | Required | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | Country | string | Required | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | Instructions | string | Optional | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | Latitude | number | Optional | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | Longitude | number | Optional | Body |
| 11 | Create Address | POST | `/api/values/customer/addresses` | Source | string | Required | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | addressId | string | Required | Path |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | Label | string | Required | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | CustomLabel | string | Optional | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | HouseNumber | string | Optional | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | BuildingStreet | string | Optional | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | Area | string | Optional | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | AddressLine1 | string | Required | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | Landmark | string | Optional | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | City | string | Required | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | State | string | Required | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | PostalCode | string | Required | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | Country | string | Required | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | Instructions | string | Optional | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | Latitude | number | Optional | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | Longitude | number | Optional | Body |
| 12 | Update Address | PUT | `/api/values/customer/addresses/{addressId}` | Source | string | Required | Body |
| 13 | Delete Address | DELETE | `/api/values/customer/addresses/{addressId}` | addressId | string | Required | Path |
| 14 | Set Default Address | PUT | `/api/values/customer/addresses/{addressId}/default` | addressId | string | Required | Path |
| 15 | Check Serviceability | GET | `/api/values/delivery/serviceability` | postalCode | string | Optional | Query |
| 15 | Check Serviceability | GET | `/api/values/delivery/serviceability` | latitude | number | Optional | Query |
| 15 | Check Serviceability | GET | `/api/values/delivery/serviceability` | longitude | number | Optional | Query |
| 16 | List Products | GET | `/api/values/products` | company | string | Required | Query |
| 16 | List Products | GET | `/api/values/products` | categoryId | string | Optional | Query |
| 16 | List Products | GET | `/api/values/products` | q | string | Optional | Query |
| 16 | List Products | GET | `/api/values/products` | sort | string | Optional | Query |
| 16 | List Products | GET | `/api/values/products` | priceMin | number | Optional | Query |
| 16 | List Products | GET | `/api/values/products` | priceMax | number | Optional | Query |
| 16 | List Products | GET | `/api/values/products` | inStockOnly | boolean | Optional | Query |
| 16 | List Products | GET | `/api/values/products` | discountedOnly | boolean | Optional | Query |
| 16 | List Products | GET | `/api/values/products` | page | integer | Optional | Query |
| 16 | List Products | GET | `/api/values/products` | pageSize | integer | Optional | Query |
| 17 | Get Product Details | GET | `/api/values/products/{productId}` | productId | string | Required | Path |
| 18 | List Categories | GET | `/api/values/catalog/categories` | — | — | — | — |
| 19 | Get Home Feed | GET | `/api/values/catalog/home` | — | — | — | — |
| 20 | Search Suggestions | GET | `/api/v1/search/suggestions` | q | string | Required | Query |
| 21 | List Brands | GET | `/api/v1/brands` | — | — | — | — |
| 22 | Get Collection | GET | `/api/v1/collections/{collectionId}` | collectionId | string | Required | Path |
| 23 | List Stores | GET | `/api/v1/stores` | — | — | — | — |
| 24 | Get Store | GET | `/api/v1/stores/{storeId}` | storeId | string | Required | Path |
| 25 | Get Cart | GET | `/api/values/cart` | — | — | — | — |
| 26 | Upsert Cart Item | PUT | `/api/values/cart/items/{productId}` | productId | string | Required | Path |
| 26 | Upsert Cart Item | PUT | `/api/values/cart/items/{productId}` | Quantity | integer | Required | Body |
| 27 | Remove Cart Item | DELETE | `/api/values/cart/items/{productId}` | productId | string | Required | Path |
| 28 | Clear Cart | DELETE | `/api/values/cart` | — | — | — | — |
| 29 | Cart / Checkout Quote | POST | `/api/values/checkout/quote` | AddressId | string | Required | Body |
| 29 | Cart / Checkout Quote | POST | `/api/values/checkout/quote` | CouponCode | string | Optional | Body |
| 29 | Cart / Checkout Quote | POST | `/api/values/checkout/quote` | LeaveAtDoor | boolean | Optional | Body |
| 29 | Cart / Checkout Quote | POST | `/api/values/checkout/quote` | Instructions | string | Optional | Body |
| 30 | Get Wishlist | GET | `/api/v1/wishlist` | — | — | — | — |
| 31 | Add Wishlist Item | POST | `/api/v1/wishlist/items` | productId | string | Required | Body |
| 32 | Remove Wishlist Item | DELETE | `/api/v1/wishlist/items/{productId}` | productId | string | Required | Path |
| 33 | List Coupons | GET | `/api/v1/coupons` | — | — | — | — |
| 34 | Collect Coupon | POST | `/api/v1/coupons/{couponId}/collect` | couponId | string | Required | Path |
| 35 | Validate Coupon | POST | `/api/v1/coupons/validate` | code | string | TBD | Body |
| 35 | Validate Coupon | POST | `/api/v1/coupons/validate` | itemTotal | number | TBD | Body |
| 36 | Place Order | POST | `/api/values/orders` | Idempotency-Key | string | Required | Header |
| 36 | Place Order | POST | `/api/values/orders` | AddressId | string | Required | Body |
| 36 | Place Order | POST | `/api/values/orders` | PaymentMethodId | string | Required | Body |
| 36 | Place Order | POST | `/api/values/orders` | QuoteId | string | Required | Body |
| 36 | Place Order | POST | `/api/values/orders` | CouponCode | string | Optional | Body |
| 36 | Place Order | POST | `/api/values/orders` | LeaveAtDoor | boolean | Optional | Body |
| 36 | Place Order | POST | `/api/values/orders` | Instructions | string | Optional | Body |
| 37 | List Orders | GET | `/api/values/orders` | statusGroup | string | Optional | Query |
| 37 | List Orders | GET | `/api/values/orders` | page | integer | Optional | Query |
| 37 | List Orders | GET | `/api/values/orders` | pageSize | integer | Optional | Query |
| 38 | Get Order | GET | `/api/values/orders/{orderId}` | orderId | string | Required | Path |
| 39 | Get Active Order | GET | `/api/values/orders/active` | — | — | — | — |
| 40 | Cancel Order | POST | `/api/values/orders/{orderId}/cancel` | orderId | string | Required | Path |
| 40 | Cancel Order | POST | `/api/values/orders/{orderId}/cancel` | ReasonIds | string[] | Required | Body |
| 41 | Request Return | POST | `/api/v1/orders/{orderId}/returns` | orderId | string | Required | Path |
| 41 | Request Return | POST | `/api/v1/orders/{orderId}/returns` | reasonIds | string[] | Required | Body |
| 41 | Request Return | POST | `/api/v1/orders/{orderId}/returns` | itemIds | string[] | Required | Body |
| 41 | Request Return | POST | `/api/v1/orders/{orderId}/returns` | photoUris | string[] | Required | Body |
| 42 | List Returns | GET | `/api/v1/returns` | — | — | — | — |
| 43 | Get Order Tracking | GET | `/api/values/orders/{orderId}/tracking` | orderId | string | Required | Path |
| 44 | List Payment Methods | GET | `/api/values/payments/methods` | — | — | — | — |
| 45 | Initiate Online Payment | POST | `/api/v1/payments/initiate` | TBD | TBD | TBD | Body |
| 46 | Confirm / Verify Payment | POST | `/api/v1/payments/confirm` | TBD | TBD | TBD | Body |
| 47 | Get Payment Prefs | GET | `/api/v1/customers/me/payment-preferences` | — | — | — | — |
| 47 | Update Payment Prefs | PATCH | `/api/v1/customers/me/payment-preferences` | primaryMethodId | string | Required | Body |
| 47 | Update Payment Prefs | PATCH | `/api/v1/customers/me/payment-preferences` | cardPreviewHidden | boolean | Required | Body |
| 48 | List Transactions | GET | `/api/v1/transactions` | kind | string | Optional | Query |
| 49 | Get Wallet | GET | `/api/v1/wallet` | — | — | — | — |
| 50 | Top Up Wallet | POST | `/api/v1/wallet/top-up` | TBD | TBD | TBD | Body |
| 51 | List Product Reviews | GET | `/api/v1/products/{productId}/reviews` | productId | string | Required | Path |
| 51 | List Product Reviews | GET | `/api/v1/products/{productId}/reviews` | sort | string | Optional | Query |
| 52 | Create Product Review | POST | `/api/v1/products/{productId}/reviews` | productId | string | Required | Path |
| 52 | Create Product Review | POST | `/api/v1/products/{productId}/reviews` | rating | number | Required | Body |
| 52 | Create Product Review | POST | `/api/v1/products/{productId}/reviews` | body | string | Required | Body |
| 52 | Create Product Review | POST | `/api/v1/products/{productId}/reviews` | tags | string[] | Optional | Body |
| 52 | Create Product Review | POST | `/api/v1/products/{productId}/reviews` | photoUris | string[] | Optional | Body |
| 52 | Create Product Review | POST | `/api/v1/products/{productId}/reviews` | authorName | string | Required | Body |
| 53 | Vote Review | POST | `/api/v1/reviews/{reviewId}/vote` | reviewId | string | Required | Path |
| 53 | Vote Review | POST | `/api/v1/reviews/{reviewId}/vote` | vote | string | Required | Body |
| 54 | Delivery Review | POST | `/api/v1/orders/{orderId}/delivery-review` | orderId | string | Required | Path |
| 54 | Delivery Review | POST | `/api/v1/orders/{orderId}/delivery-review` | rating | number | Required | Body |
| 54 | Delivery Review | POST | `/api/v1/orders/{orderId}/delivery-review` | body | string | Optional | Body |
| 54 | Delivery Review | POST | `/api/v1/orders/{orderId}/delivery-review` | tags | string[] | Optional | Body |
| 55 | List Notifications | GET | `/api/v1/notifications` | — | — | — | — |
| 56 | Mark Notification Read | PATCH | `/api/v1/notifications/{id}/read` | id | string | Required | Path |
| 57 | Mark All Read | POST | `/api/v1/notifications/read-all` | — | — | — | — |
| 58 | Clear Inbox | DELETE | `/api/v1/notifications` | — | — | — | — |
| 59 | Register Push Token | POST | `/api/v1/notifications/push-token` | TBD | TBD | TBD | Body |
| 60 | Get Notification Preferences | GET | `/api/v1/customers/me/notification-preferences` | — | — | — | — |
| 60 | Update Notification Preferences | PATCH | `/api/v1/customers/me/notification-preferences` | orderAlerts | boolean | Required | Body |
| 60 | Update Notification Preferences | PATCH | `/api/v1/customers/me/notification-preferences` | offerAlerts | boolean | Required | Body |
| 61 | List FAQs | GET | `/api/v1/support/faqs` | — | — | — | — |
| 62 | Get Chat Thread | GET | `/api/v1/support/chat` | — | — | — | — |
| 63 | Send Chat Message | POST | `/api/v1/support/chat/messages` | kind | string | Required | Body |
| 63 | Send Chat Message | POST | `/api/v1/support/chat/messages` | text | string | Optional | Body |
| 63 | Send Chat Message | POST | `/api/v1/support/chat/messages` | imageUri | string | Optional | Body |
| 64 | List Complaints | GET | `/api/v1/support/complaints` | — | — | — | — |
| 65 | Create Complaint | POST | `/api/v1/support/complaints` | category | string | Required | Body |
| 65 | Create Complaint | POST | `/api/v1/support/complaints` | subject | string | Required | Body |
| 65 | Create Complaint | POST | `/api/v1/support/complaints` | description | string | Required | Body |
| 65 | Create Complaint | POST | `/api/v1/support/complaints` | orderId | string | Optional | Body |
| 66 | Get Complaint | GET | `/api/v1/support/complaints/{id}` | id | string | Required | Path |
| 67 | Get Referral Code | GET | `/api/v1/referrals/me` | — | — | — | — |
| 68 | Privacy Policy | GET | `/api/v1/content/privacy` | — | — | — | — |
| 69 | Terms & Conditions | GET | `/api/v1/content/terms` | — | — | — | — |
| 70 | Upload Media | POST | `/api/v1/media/upload` | TBD | file | TBD | Body |

**Notes**

- `#` 1–8, 10–19, 25–29, 36–40, 43–44 use finalized P0 `/api/values/...` endpoints and parameters.
- Remaining APIs keep audit endpoints under `/api/v1/...`.
- `—` = no request parameters.
- `TBD` = unconfirmed / not defined in frontend or finalized P0 contract.
- Place Order `Idempotency-Key` is a request header (not Body/Query/Path); listed for completeness from the finalized P0 contract.
