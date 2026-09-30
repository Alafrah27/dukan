

# Dukan — Project Instructions

## 1. Project Overview

Dukan is a modern marketplace for Sudanese and Eritrean products available in Saudi Arabia and delivered to customers internationally.

The initial focus is on traditional clothing and products from:

* 🇸🇩 Sudan
* 🇪🇷 Eritrea

Products are stored/fulfilled from Saudi Arabia.

Customers can be located in Saudi Arabia or internationally, depending on supported shipping destinations.

The platform should be designed to support additional East African products and countries in the future.

### Core Business Flow

```text
Customer
   ↓
Browse products
   ↓
Select product
   ↓
Select variants/options
   ↓
Enter measurements if required
   ↓
Add to cart
   ↓
Enter delivery address
   ↓
Calculate shipping
   ↓
Select shipping option
   ↓
Pay with PayPal
   ↓
Order confirmed
   ↓
Admin processes order
   ↓
Product prepared
   ↓
Shipment created
   ↓
Customer receives tracking
   ↓
Delivered
```

---

# 2. Application Architecture

Dukan consists of:

```text
Dukan
│
├── Customer Mobile App (React Native / Expo)
│
├── Admin Dashboard (Vite / React)
│
└── Backend Server (Node.js / Express / MongoDB)
```

## Customer App

Built with:

* Expo
* React Native
* Expo Router
* JavaScript
* NativeWind/Tailwind when appropriate

## Authentication

Use:

* Clerk

## Backend

Use:

* Node.js & Express
* MongoDB & Mongoose
* RESTful JSON APIs

## Notifications

Use:

* Expo Notifications

## Maps

Use:

* Expo MapView

## Payments

Current primary payment provider:

* PayPal

Future payment provider:

* Google Pay, if/when supported and integrated

---

# 3. Technology Rules

Use JavaScript only.

Do NOT introduce TypeScript.

Do NOT migrate to React Native CLI unless explicitly requested.

Prefer Expo-compatible libraries and solutions.

Use Node.js, Express, and MongoDB as the main backend and database.

Use Clerk for authentication.

Do not create a custom authentication system.

Do not store passwords in the database (managed securely by Clerk).

---

# 4. Customer Mobile App

The customer application should provide:

```text
Home
Categories
Products
Product Details
Cart
Checkout
Orders
Profile
```

Suggested Expo Router structure:

```text
app/
├── index.js signup
│
├── (tabs)/
│   ├── home.js
│   ├── categories.js
│   ├── cart.js
│   └── profile.js
│
├── product/
│   └── [id].js
│
├
│   
│
├── checkout/
│   ├── address.js
│   ├── shipping.js
│   ├── payment.js
│   └── review.js
│
└── order/
    └── [id].js
```

The exact structure can change if the existing project already has a better organization.

Do not unnecessarily rewrite existing architecture.

---

# 5. Admin Dashboard

Dukan must include an Admin Dashboard.

The Admin Dashboard is responsible for managing the marketplace.

Admin navigation should include tabs/sections such as:

```text
Admin Dashboard
│
├── Overview
├── Products
├── Orders
├── Users
├── Dukan
├── Shipping
├── Payments
├── Notifications
└── Settings
```

Additional sections can be added later.

---

# 6. Admin Overview

The dashboard overview should show useful business information.

Examples:

```text
Total Orders
Pending Orders
Processing Orders
Completed Orders
Total Users
Active Products
Revenue
Recent Orders
```

Do not build complicated analytics initially.

The overview should focus on actionable information.

---

# 7. Admin Products

Admin must be able to:

* Create products
* Edit products
* Delete/deactivate products
* Upload product images
* Set prices
* Create categories
* Manage product variants
* Manage colors
* Manage fabrics
* Manage sizes
* Configure measurements
* Enable/disable products
* Set product availability
* Set product origin/country
* Manage product descriptions

Example product:

```js
{
  name: "Sudanese Jalabiya",
  country: "SD",
  categoryId,
  description,
  images,
  basePrice,
  currency: "SAR",
  active: true,
  requiresMeasurements: true,
  measurementFields: [
    "height",
    "shoulder",
    "sleeve"
  ]
}
```

---

# 8. Product Countries

Products must have an origin/cultural country.

Initially:

```text
SD = Sudan
ER = Eritrea
```

Do not assume the product's country determines the physical shipping origin.

Important:

The products are fulfilled/shipped from Saudi Arabia.

Example:

```text
Product:
Sudanese Jalabiya

Cultural/Product Country:
Sudan 🇸🇩

Shipping Origin:
Saudi Arabia 🇸🇦
```

This distinction must be maintained in the data model.

---

# 9. Admin Orders

Admin must be able to:

* View all orders
* Search orders
* Filter orders
* Open order details
* View customer information
* View products
* View variants
* View measurements
* View shipping address
* View payment status
* View shipping provider
* View tracking number
* Update order status
* Add internal notes
* Cancel orders when appropriate
* Process shipment information

Order statuses:

```text
pending_payment
paid
confirmed
preparing
ready_to_ship
shipped
in_transit
delivered
cancelled
payment_failed
returned
refunded
```

Admin should not be able to arbitrarily modify sensitive payment information.

---

# 10. Admin Users

Admin Users section should allow authorized admins to:

* View users
* Search users
* View user profile
* View user's orders
* View account status
* View basic activity where appropriate

Do not expose sensitive authentication information.

Clerk remains responsible for authentication.

Admin authorization should be enforced server-side.

Never rely only on hiding UI buttons.

---

# 11. Admin Dukan Section

Create a general "Dukan" management area for marketplace configuration.

Possible settings:

```text
Dukan Name
Logo
Description
Contact information
Supported countries
Default currency
Store status
Maintenance mode
Default shipping settings
Business information
```

This section should be expandable later.

Do not hardcode important business configuration inside the mobile app.

---

# 12. Admin Shipping

Admin should be able to see and manage shipping-related information.

Examples:

```text
Shipping Providers
Supported Countries
Shipping Rules
Shipment Status
Tracking
```

Initial providers may include:

* Aramex
* SMSA
* SPL

Other providers can be added later.

---

# 13. Shipping Architecture

Shipping providers use an abstraction/adapter architecture in the Node.js Express backend.

Implementation location:

```text
backend/src/services/shipping/
├── shipping.service.js
└── providers/
    ├── aramex.provider.js
    ├── smsa.provider.js   # future adapter
    └── spl.provider.js    # future adapter
```

The checkout and client applications call the unified backend endpoint:

```http
POST /api/v1/shipping/calculate-rate
```

Request payload:

```json
{
  "destination": {
    "countryCode": "AE",
    "city": "Dubai",
    "postalCode": "00000"
  },
  "packageDetails": {
    "weight": 1.5,
    "weightUnit": "KG",
    "numberOfPieces": 1
  },
  "currency": "SAR"
}
```

Response format:

```json
{
  "success": true,
  "message": "تم احتساب أسعار الشحن بنجاح",
  "quotes": [
    {
      "carrier": "aramex",
      "carrierName": "Aramex Express",
      "service": "PPX",
      "serviceName": "Aramex Priority International",
      "productGroup": "EXP",
      "productType": "PPX",
      "price": 65,
      "currency": "SAR",
      "estimatedDays": "3-5 أيام عمل",
      "isLiveQuote": true,
      "origin": { "countryCode": "SA", "city": "Riyadh" },
      "destination": { "countryCode": "AE", "city": "Dubai" },
      "weight": 1.5
    }
  ]
}
```

Never hardcode real shipping prices inside client applications.

---

# 14. Shipping Origin

The initial physical shipping origin is Saudi Arabia.

```json
{
  "countryCode": "SA",
  "city": "Riyadh"
}
```

Destination is determined by the customer's delivery address.

Shipping APIs are used to determine actual rates and available services.

---

# 15. Shipping Countries

The system must support international destinations.

Country availability should be based on actual carrier capabilities and account configuration.

Country data supports:

```text
Country name
Country code
Cities
Postal code requirements
Available carriers
Available services
```

---

# 16. Aramex Shipping Integration

Aramex is the primary shipping integration for Dukan.

### Implemented Functionality:
* **Rate Calculation (`CalculateRate` REST API)**:
  - Development Sandbox: `https://ws.dev.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate`
  - Production Service: `https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate`
* **Product Groups & Types**:
  - **Domestic Saudi Arabia**: `ProductGroup: "DOM"`, `ProductType: "OND"` (Overnight Domestic)
  - **International**: `ProductGroup: "EXP"`, `ProductType: "PPX"` (Priority Parcel Express) or `"EPX"` (Economy)
* **Resilient Graceful Fallback**:
  - If third-party API is unreachable or credentials are not yet entered, the adapter returns deterministic, zone-based rate estimates so the checkout flow never breaks.

### Private Credentials & Environment Variables (Server-side ONLY):

In `backend/.env`:

```env
ARAMEX_ENV=dev
ARAMEX_USER_NAME=your_username
ARAMEX_PASSWORD=your_password
ARAMEX_ACCOUNT_NUMBER=your_account_number
ARAMEX_ACCOUNT_PIN=your_pin
ARAMEX_ACCOUNT_ENTITY=RUH
ARAMEX_ACCOUNT_COUNTRY_CODE=SA
```

Never expose Aramex credentials in the Expo mobile app or Vite admin code.

---

# 17. Payments

## Current Payment Provider

The primary payment provider is:

**PayPal**

The checkout should currently support PayPal.

The architecture must still be provider-independent.

Use:

```js
paymentService.createPayment()
paymentService.verifyPayment()
paymentService.capturePayment()
```

Do not tightly couple the entire checkout to PayPal-specific logic.

---

# 18. Future Google Pay Support

Google Pay may be added as an additional payment method in the future.

The payment architecture must allow:

```text
Payment
├── PayPal
└── Google Pay
```

Do not implement Google Pay unless explicitly requested.

Do not display Google Pay as available until the integration is actually configured and working.

The checkout UI should be capable of showing multiple payment methods later.

Example:

```text
Payment Method

○ PayPal
○ Google Pay
```

For the initial MVP:

```text
PayPal
```

is sufficient.

---

# 19. Payment Security

Never trust payment status from the mobile client.

Payment confirmation must be validated server-side.

The final order total must be calculated and validated server-side.

Never allow the client to send:

```text
finalPrice
paymentStatus: "paid"
```

and blindly trust it.

Payment flow:

```text
Customer
   ↓
Checkout
   ↓
Create payment
   ↓
PayPal
   ↓
Payment confirmation
   ↓
Server verification
   ↓
Order marked paid
```

---

# 20. Pricing

Separate:

```text
Product subtotal
Shipping cost
Payment fees if applicable
Discount
Tax/other applicable charges
Grand total
```

Example:

```js
{
  subtotal,
  shippingCost,
  paymentFee,
  discount,
  total,
  currency
}
```

The server must recalculate the total.

Never rely on client-calculated totals.

---

# 21. Custom Measurements

Some products require custom measurements.

For example:

```text
Height
Shoulder
Sleeve
Chest
Waist
Additional notes
```

Products should specify which measurements are required.

Example:

```js
{
  requiresMeasurements: true,
  measurementFields: [
    "height",
    "shoulder",
    "sleeve"
  ]
}
```

The measurement UI should dynamically render the required fields.

Do not require measurements for products that do not need them.

---

# 22. Measurement UX

Measurement collection must be simple.

Provide:

* Clear labels
* Unit selection/display
* Examples
* Instructions
* Optional visual guidance

Future possibility:

AI-assisted measurement from camera/photos.

Do NOT implement AI measurement in the initial MVP.

---

# 23. Cart

Cart must preserve the exact product configuration.

Example:

```js
{
  productId,
  variantId,
  quantity,
  measurements,
  price
}
```

The server must validate product availability and pricing before creating an order.

---

# 24. Orders

Order lifecycle:

```text
pending_payment
↓
paid
↓
confirmed
↓
preparing
↓
ready_to_ship
↓
shipped
↓
in_transit
↓
delivered
```

Alternative states:

```text
cancelled
payment_failed
returned
refunded
```

Order status changes must be controlled by Express backend APIs and controllers.

---

# 25. Order Tracking

Customer order details should display:

```text
Order number
Products
Variants
Measurements
Subtotal
Shipping
Total
Payment status
Shipping carrier
Tracking number
Current status
Status timeline
```

Example:

```text
✓ Order placed
✓ Payment confirmed
✓ Preparing
✓ Shipment created
→ In transit
○ Delivered
```

If carrier tracking is available, synchronize tracking data.

---

# 26. Notifications

Use:

**Expo Notifications**

Push notifications should be sent for important events.

Examples:

```text
Order created
Payment confirmed
Order confirmed
Order preparing
Shipment created
Shipment picked up
Shipment in transit
Out for delivery
Delivered
Cancelled
```

Store Expo push tokens securely and associate them with authenticated users.

Do not send unnecessary notifications.

---

# 27. Maps

Use:

**Expo MapView**

Maps may be used for:

* Delivery location
* Address selection
* Order/shipment location when coordinates are available

Do not introduce another mapping solution unless explicitly requested.

Do not assume shipment coordinates are available from every carrier.

---

# 28. Node.js & Express Backend

Node.js with Express and MongoDB (via Mongoose) is the main backend and database.

Use Node.js & Express for:

* Products & Categories API
* Users & Profiles API (synchronized with Clerk)
* Cart & Checkout management
* Orders & Status management
* Payments (PayPal SDK server-side validation & capture)
* Shipping (Aramex rate calculation & provider adapters)
* Push notifications (Expo Server SDK)
* Admin dashboard APIs & authorization

Backend structure (`backend/src/`):

```text
backend/
├── src/
│   ├── app.js               # Express application, global middlewares, and route registration
│   ├── server.js            # Server entry point & MongoDB connection
│   ├── controller/          # Request handlers (user, shipping, order, etc.)
│   ├── modal/               # Mongoose data models (user.modal.js, etc.)
│   ├── route/               # Express API routes (/api/v1/user, /api/v1/shipping, etc.)
│   ├── services/            # Business & integration services
│   │   └── shipping/
│   │       ├── shipping.service.js
│   │       └── providers/
│   │           └── aramex.provider.js
│   ├── middleware/          # Security & auth guards (protectRoute, adminProtectRoute)
│   └── lib/                 # Database connection & shared utilities
```

Use:

* RESTful HTTP endpoints (`GET`, `POST`, `PUT`, `DELETE`) with standard JSON responses
* Mongoose models for data schema, validation, and database operations
* Modular domain services for third-party integrations (Aramex, PayPal, Clerk)

---

# 29. Suggested Data Model

Core entities:

```text
User
Product
Category
ProductVariant
Measurement
Cart
CartItem
Address
Order
OrderItem
Payment
Shipment
Notification
ShippingProvider
DukanSettings
```

Important distinction:

```text
Product country
≠
Shipping origin
```

Example:

```text
Product country:
Sudan

Physical shipping origin:
Saudi Arabia
```

---

# 30. Admin Authorization

Admin access must be protected server-side.

Do not rely only on:

```text
if (isAdmin) show dashboard
```

The backend must verify that the authenticated Clerk user has the required admin role/permission.

Possible roles:

```text
customer
admin
super_admin
```

Do not expose admin operations to normal customers.

---

# 31. Admin Dashboard Security

Admin dashboard operations should validate permissions for every sensitive mutation.

Examples:

```text
Create product
Delete product
Update product
Change order status
Refund order
Modify Dukan settings
Manage users
Configure shipping
```

Never trust a client-provided role.

---

# 32. Internationalization

The application should be prepared for:

* Arabic
* English

Arabic must support RTL correctly.

Avoid hardcoding text in a way that makes future localization difficult.

---

# 33. Currency

Initial business currency:

```text
SAR
```

However, never assume SAR is the only currency forever.

Store currency explicitly:

```js
{
  amount: 150,
  currency: "SAR"
}
```

Payment and display currency requirements should be handled independently.

---

# 34. Images

Product images are extremely important.

Use optimized images.

Avoid loading unnecessary full-resolution images in product lists.

Product details can load higher-resolution images when necessary.

---

# 35. UI / UX Principles

Dukan should feel like a modern international marketplace.

Priorities:

1. Simple navigation
2. Strong product photography
3. Clear product information
4. Easy measurements
5. Transparent pricing
6. Transparent shipping cost
7. Simple payment
8. Clear order tracking
9. Trustworthy checkout

At every point the customer should understand:

```text
What am I buying?
How much does it cost?
How much is shipping?
How much is the total?
When will it arrive?
Where is my order?
```

---

# 36. Suggested Customer Tabs

Initial customer bottom tabs:

```text
Home
Categories
Orders
Profile
```

Cart can be accessible globally through the header/navigation.

Do not create too many bottom tabs.

---

# 37. Suggested Admin Tabs

Initial admin navigation:

```text
Overview
Products
Orders
Users
Dukan
Shipping
Payments
Settings
```

Notifications can be integrated into the dashboard header or added as a dedicated section later.

---

# 38. Admin Product Creation Flow

Admin should be able to create a product using a clear form:

```text
Product Information
↓
Country
↓
Category
↓
Images
↓
Price
↓
Variants
↓
Measurements
↓
Availability
↓
Publish
```

Example:

```text
Product:
7 A'far Jalabiya

Country:
Sudan

Category:
Traditional Clothing

Price:
150 SAR

Requires measurements:
Yes

Measurements:
Height
Shoulder
Sleeve
```

---

# 39. Admin Order Processing Flow

Admin workflow:

```text
New paid order
       ↓
Review order
       ↓
Confirm availability
       ↓
Prepare product
       ↓
Package
       ↓
Get shipping quote
       ↓
Create shipment
       ↓
Store AWB/tracking number
       ↓
Mark shipped
       ↓
Customer receives notification
```

---

# 40. Dukan Settings

Dukan settings should be stored in the MongoDB database via backend APIs.

Possible configuration:

```text
Store name
Logo
Description
Contact information
Support information
Default currency
Store active/inactive
Maintenance mode
Supported countries
```

Do not hardcode business configuration inside the Expo application.

---

# 41. Error Handling

External APIs can fail.

Handle failures gracefully.

Examples:

```text
Shipping provider unavailable
Payment provider unavailable
Invalid destination
Unsupported country
Invalid postal code
Product unavailable
Payment verification failed
Tracking unavailable
```

Never crash the application because a third-party API fails.

Show useful user-friendly messages.

---

# 42. External API Credentials

NEVER put private credentials in:

```text
Expo app
React Native code
Git repository
Client-side environment variables
```

External credentials must remain server-side.

Use secure Express server-side controllers and environment variables.

---

# 43. Development Environment

Before installing a dependency:

1. Check whether Expo already provides the required functionality.
2. Check the existing dependencies.
3. Avoid duplicate libraries.
4. Install only when necessary.
5. Prefer maintained and Expo-compatible packages.

Do not add libraries just for convenience.

---

# 44. Code Quality

Follow these principles:

* Small components
* Reusable components
* Clear naming
* Separation of concerns
* Reusable hooks
* Domain-based services
* Minimal duplication
* Server-side validation
* Proper loading states
* Proper error states
* Empty states

Avoid:

* Huge screen files
* Business logic inside UI
* Duplicate API calls
* Hardcoded prices
* Hardcoded shipping rules
* Hardcoded payment success
* Exposed credentials

---

# 45. MVP Scope

The first production MVP should include:

## Customer

* Clerk authentication
* Home
* Categories
* Product listing
* Product details
* Product variants
* Measurements
* Cart
* International address
* Shipping quote
* PayPal payment
* Checkout
* Order creation
* Order history
* Order details
* Order tracking
* Expo push notifications
* MapView where useful

## Admin

* Admin authentication/authorization
* Dashboard overview
* Products
* Categories
* Product variants
* Measurements configuration
* Orders
* Users
* Shipping information
* Payment information
* Dukan settings

## Backend

* Node.js & Express
* MongoDB & Mongoose
* Clerk integration
* Database schema & Mongoose models
* Shipping abstraction & Aramex Rate Calculator integration
* PayPal integration
* Notifications
* Admin authorization

---

# 46. Do NOT Build Initially

Do not over-engineer the first version.

Do NOT initially build:

* AI body measurement
* Complex recommendation engine
* Multi-vendor marketplace
* Seller accounts
* Loyalty system
* Referral system
* Social feed
* Chat
* Complex ERP
* Warehouse management
* Advanced analytics
* Multiple payment providers
* Every shipping carrier
* Every country
* Complex promotions system

Build the core business flow first.

---

# 47. Future Expansion

Architecture should allow:

```text
More countries
More products
More East African brands
More suppliers
More fulfillment locations
More shipping providers
More payment providers
Google Pay
Reviews
Discounts
Promotions
AI measurement
Advanced tracking
Seller accounts
Multi-vendor marketplace
```

Do not implement future features until they are required.

---

# 48. Critical Business Principle

Dukan is not simply a product catalog.

The core system is:

```text
East African Product
        ↓
Customer abroad
        ↓
Product configuration
        ↓
Measurements
        ↓
Payment
        ↓
Fulfillment in Saudi Arabia
        ↓
International Shipping
        ↓
Tracking
        ↓
Delivery
```

Every technical decision should support this workflow.

---

# 49. Agent Behavior

You are an implementation agent.

Before changing code:

1. Inspect the existing project.
2. Understand the architecture.
3. Check installed dependencies.
4. Reuse existing components.
5. Do not duplicate functionality.
6. Keep changes focused.
7. Test the affected flow.
8. Avoid unnecessary rewrites.

When requirements are ambiguous:

* Prefer the simplest MVP solution.
* Do not invent business rules.
* Do not invent API credentials.
* Do not invent shipping prices.
* Do not claim a country is supported without verification.
* Do not claim a payment is successful without server-side verification.

For third-party integrations:

```text
Mobile App / Admin
    ↓
Node.js Express Backend
    ↓
External API (Aramex / PayPal)
```

Keep secrets server-side.

---

# 50. Most Important Rule

Build Dukan as a **real production-ready MVP**, but do not over-engineer it.

The first goal is:

```text
Browse
→ Configure
→ Measure
→ Ship quote
→ Pay
→ Order
→ Admin processing
→ Shipment
→ Tracking
→ Delivery
```

APP;ICATION LANGUAGE 
-arabic 
-english 
by default language alawys arabic because am targetting arabic customers 


Everything else is secondary.
