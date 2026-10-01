import mongoose from "mongoose";

const { Schema, model } = mongoose;

const VALID_SIZE_TYPES = [
  "child",
  "small",
  "medium",
  "large",
  "adult",
  "xl",
  "xxl",
  "custom",
];

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
      type: String,
      enum: VALID_SIZE_TYPES,
      required: [true, "نوع المقاس مطلوب"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "سعر التفصيل مطلوب"],
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
tailoringPriceSchema.index({ productId: 1, sizeType: 1 });
tailoringPriceSchema.index({ isActive: 1 });

export { VALID_SIZE_TYPES };

const TailoringPrice = model("TailoringPrice", tailoringPriceSchema);

export default TailoringPrice;
