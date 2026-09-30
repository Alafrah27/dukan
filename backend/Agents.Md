You are working on the Dukan backend.

Tech stack:
- Node.js
- Express.js
- MongoDB
- Mongoose
- JavaScript only
- Clerk for authentication

Important:
Do NOT use TypeScript.
Do NOT over-engineer.
Do NOT create unnecessary abstractions, services, repositories, helpers, hooks, or extra files unless required.
Before changing code:
1. Inspect the existing project structure.
2. Reuse existing models, controllers, routes, middleware, and utilities.
3. Make the smallest possible change.
4. Do not rewrite working files unnecessarily.

==================================================
DUKAN PRODUCT / TAILORING BUSINESS LOGIC
==================================================

Dukan sells products such as:
- Jalabiya
- Sudairi
- Trousers
- Women's traditional clothing
- Shoes
- Fabric
- Accessories

Some products can be purchased in different ways.

Example:
A Jalabiya fabric can be purchased as:

1. Fabric only
2. Tailored according to customer measurements

The Product model must define what options are AVAILABLE.

The Cart must store what option the CUSTOMER actually selected.

The Product must NOT store customer measurements.

==================================================
PRODUCT RESPONSIBILITY
==================================================

The Product should contain:

- name

- description
- category
- productType
- productFormat
- originCountry
- images
- basePrice
- currency
- variants
- components if needed
- shipping information
- inventory
- status

It should also contain purchase configuration.

Example:

purchaseOptions: [
  {
    key: "fabric_only",
    label: "شراء القطعة فقط",
    requiresMeasurements: false
  },
  {
    key: "tailored",
    label: "خياطة حسب المقاس",
    requiresMeasurements: true
  }
]

The product also defines which measurements are required.

Example:

measurementConfig: {
  fields: [
    {
      key: "shoulder",
      label: "الكتف",
      unit: "cm",
      required: true
    },
    {
      key: "sleeve",
      label: "طول اليد",
      unit: "cm",
      required: true
    },
    {
      key: "length",
      label: "الطول",
      unit: "cm",
      required: true
    }
  ]
}

IMPORTANT:

measurementConfig only describes which inputs the customer must provide.

Do NOT store:

shoulder: 45
sleeve: 62
length: 145

inside the Product document.

Those are customer values and belong to the Cart / Order.

==================================================
TAILORING PRICE
==================================================

Tailoring price must NOT be hardcoded.

Tailoring prices change over time.

Tailoring prices may also differ depending on:

- product
- size category

Example:

Jalabiya:
child = 40 SAR
small = 50 SAR
medium = 60 SAR
large = 80 SAR

Sudairi:
child = 25 SAR
small = 35 SAR
medium = 45 SAR
large = 55 SAR

Because these prices can change, create a separate Mongoose model:

TailoringPrice

Suggested structure:

{
  product: ObjectId -> Product,

  sizeType:
    "child" |
    "small" |
    "medium" |
    "large",

  price: Number,

  isActive: Boolean,

  timestamps
}

The Admin Dashboard must be able to update tailoring prices without changing code.

Do NOT hardcode tailoring prices inside controllers.

Do NOT trust tailoring prices sent by the mobile app.

Always fetch the current tailoring price from MongoDB on the backend.

==================================================
CART LOGIC
==================================================

When the customer adds a product to the cart:

If the customer selects:

purchaseOption: "fabric_only"

then measurements are not required.

Example Cart Item:

{
  product: PRODUCT_ID,

  purchaseOption: "fabric_only",

  quantity: 1
}

If the customer selects:

purchaseOption: "tailored"

then the customer must also select a tailoring size category and provide measurements.

Example:

{
  product: PRODUCT_ID,

  purchaseOption: "tailored",

  tailoringSizeType: "large",

  measurements: {
    shoulder: 48,
    sleeve: 64,
    length: 150
  },

  note: "أريد الكم واسع قليلاً",

  quantity: 1
}

The frontend may send:
- productId
- purchaseOption
- tailoringSizeType
- measurements
- note
- quantity

The frontend must NOT decide the final tailoring price.

==================================================
BACKEND PRICE CALCULATION
==================================================

If:

purchaseOption === "fabric_only"

then:

unitPrice = product.basePrice

If:

purchaseOption === "tailored"

then:

1. Get Product from MongoDB
2. Validate that the product supports tailored purchase
3. Validate all required measurement fields
4. Get the active TailoringPrice using:

productId
+
tailoringSizeType

5. Calculate:

unitPrice =
product.basePrice + tailoringPrice.price

Example:

basePrice = 250
tailoringPrice = 80

unitPrice = 330

Then:

itemTotal =
unitPrice * quantity

Never trust:

unitPrice
tailoringPrice
total

coming from the client.

The backend must calculate them.

==================================================
MEASUREMENT VALIDATION
==================================================

Measurements must be validated dynamically from:

product.measurementConfig.fields

Do NOT hardcode only:

shoulder
sleeve
length

inside the controller.

Different products may require different measurements in the future.

For every field where:

required === true

validate that the customer provided a valid value.

==================================================
ORDER LOGIC
==================================================

When checkout happens:

Cart data becomes Order data.

The Order must store a snapshot of important values at purchase time.

Do NOT rely only on the current Product later.

Store things such as:

- productId
- productName
- product image
- quantity
- purchaseOption
- tailoringSizeType
- tailoringPrice at purchase time
- basePrice at purchase time
- unitPrice
- measurements
- customer note
- variant information if selected

Example:

{
  product: PRODUCT_ID,

  productName: "جلابية سودانية",

  basePrice: 250,

  purchaseOption: "tailored",

  tailoring: {
    sizeType: "large",
    price: 80
  },

  measurements: {
    shoulder: 48,
    sleeve: 64,
    length: 150
  },

  note: "أريد الكم واسع قليلاً",

  quantity: 1,

  unitPrice: 330
}

This is very important because tailoring prices can change later.

Example:

Customer ordered today with tailoring price = 80 SAR.

Next month Admin changes tailoring price to 100 SAR.

The old Order must remain:

80 SAR

The order history must never change because the current tailoring price changed.

==================================================
ADMIN
==================================================

Admin must be able to manage tailoring prices.

Admin actions should include:

- create tailoring price
- update tailoring price
- activate / deactivate price
- list prices by product

Example Admin UI:

جلابية سودانية

طفل
[ 40 SAR ]

صغير
[ 50 SAR ]

متوسط
[ 60 SAR ]

كبير
[ 80 SAR ]

[ Save ]

If Admin changes large from:

80

to:

95

new customers should use 95 SAR.

Existing paid orders must remain unchanged.

==================================================
IMPORTANT ARCHITECTURE
==================================================

Use this responsibility:

Product
- defines available purchase options
- defines required measurement fields
- defines base product price

TailoringPrice
- stores current tailoring price
- controlled by Admin
- can change over time

Cart
- stores customer selection
- stores customer measurements
- stores note
- stores size category

Order
- stores a snapshot of everything at checkout

Flow:

Product
   ↓
Customer chooses:
fabric_only OR tailored
   ↓
If tailored:
select size category
enter measurements
   ↓
Cart
   ↓
Backend calculates current price
   ↓
Checkout
   ↓
Order snapshot

==================================================
IMPLEMENTATION RULES
==================================================

Before writing any code:

1. Inspect the current Product model.
2. Inspect Cart model.
3. Inspect Order model.
4. Inspect existing controllers and routes.
5. Identify the minimum changes required.
6. Explain briefly which files need to change.
7. Then implement.

Do not create duplicate models if equivalent models already exist.

Do not replace working logic unnecessarily.

Keep controllers simple.

Keep code readable.

Use async/await.

Return clear API errors.

Use proper HTTP status codes.

Do not expose internal database errors directly to the client.

Most importantly:

DO NOT OVER-ENGINEER THIS FEATURE.

Implement only what is required for:

Product
→ Tailoring Price
→ Cart Measurements
→ Backend Price Calculation
→ Order Snapshot