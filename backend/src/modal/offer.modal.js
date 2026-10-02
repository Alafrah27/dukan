import mongoose from "mongoose";
const { Schema, model } = mongoose;

const offerSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    productsId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    type: {
      type: String,
      required: true,
      enum: ["percent", "fixed"],
      default: "percent",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

offerSchema.index({ productId: 1 });
offerSchema.index({ startDate: 1, endDate: 1 });
offerSchema.index({ isActive: 1 });

const Offer = model("Offer", offerSchema);
export default Offer;
