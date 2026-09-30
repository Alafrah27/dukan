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

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

const Cart = model("Cart", cartSchema);

export default Cart;
