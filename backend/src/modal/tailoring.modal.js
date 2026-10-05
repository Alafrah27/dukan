import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const VALID_SIZE_TYPES = ["child", "adult"];

const sizeOptionSchema = new Schema(
  {
    type: {
      type: String,
      enum: {
        values: VALID_SIZE_TYPES,
        message: "نوع المقاس يجب أن يكون إما طفل (child) أو بالغ (adult)",
      },
      required: [true, "نوع المقاس مطلوب"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "سعر المقاس مطلوب"],
      min: [0, "يجب أن يكون السعر صفر أو أكثر"],
    },
  },
  { _id: true }
);

const tailoringPriceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    sizeType: {
      type: [sizeOptionSchema],
      default: [],
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "يجب أن يكون السعر صفر أو أكثر"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes for fast lookup by product and size
tailoringPriceSchema.index({ productId: 1 });
tailoringPriceSchema.index({ "sizeType.type": 1 });
tailoringPriceSchema.index({ isActive: 1 });

const TailoringPrice = model("TailoringPrice", tailoringPriceSchema);

export default TailoringPrice;
