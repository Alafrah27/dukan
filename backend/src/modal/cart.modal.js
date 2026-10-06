import mongoose from "mongoose";
const { Schema, model } = mongoose;

const cartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  purchaseOption: {
    type: String,
    required: true,
  },
  tailoringSizeType: {
    type: String,
  },
  measurements: {
    type: Map,
    of: Number,
  },
  note: {
    type: String,
    default: "",
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
});

/**
 * Aramex shipping calculation details stored in the customer cart
 * Dynamic user variables: kilo (weight), country, city, postal code
 */
const aramexShippingSchema = new Schema(
  {
    price: { type: Number, default: 0 },
    currency: { type: String, default: "SAR" },
    kilo: { type: Number, default: 1 },
    boxSize: { type: Number, default: 0 },
    countryCode: { type: String, default: "SA" },
    country: { type: String, default: "المملكة العربية السعودية" },
    city: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    serviceName: { type: String, default: "Aramex Express" },
    estimatedDays: { type: String, default: "" },
    isCalculated: { type: Boolean, default: false },
    calculatedAt: { type: Date },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    addressId: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    aramex: {
      type: aramexShippingSchema,
      default: () => ({
        price: 0,
        currency: "SAR",
        kilo: 1,
        boxSize: 45,
        countryCode: "SA",
        country: "المملكة العربية السعودية",
        city: "",
        postalCode: "",
        serviceName: "Aramex Express",
        estimatedDays: "",
        isCalculated: false,
      }),
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

const Cart = model("Cart", cartSchema);

export default Cart;
