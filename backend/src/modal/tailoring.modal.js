import mongoose from "mongoose";

const { Schema, model } = mongoose;

const tailoringPriceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    sizeType: {
      type: String,
      enum: ["child", "adult"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const TailoringPrice = model("TailoringPrice", tailoringPriceSchema);

export default TailoringPrice;
