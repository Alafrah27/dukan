import mongoose from "mongoose";
const { Schema, model } = mongoose;

const productSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    hasDiscountPrice: {
      type: Boolean,
      default: false,
    },
    basePrice: {
      type: Number,
    },
   purchaseoption: {
      type: [
        {
          key: { type: String },
          label: { type: String },
          requiremasurment: { type: Boolean, default: false },
        },
      ],
      default: [
        {
          key: "farbic_only",
          label: "شراء القطعة فقد",
          requiremasurment: false,
        },
        {
          key: "farbic_with_stiching",
          label: "شراء القطعة مع خياطة",
          requiremasurment: true,
        },
      ],
    },
    masurmentConfig: {
      type: {
        field: [
          {
            key: { type: String },
            label: { type: String },
            unit: { type: String, default: "cm" },
            require: { type: Boolean, default: true },
          },
        ],
      },
      default: {
        field: [
          {
            key: "shoulder_width",
            label: "عرض الكتف",
            unit: "cm",
            require: true,
          },
          {
            key: "sleeve_length",
            label: "طول الاكمام",
            unit: "cm",
            require: true,
          },
          {
            key: "length",
            label: "طول الثوب",
            unit: "cm",
            require: true,
          },
        ],
      },
    }
  },
  { timestamps: true },
);

productSchema.index({ categoryId: 1 });

const Product = model("Product", productSchema);

export default Product;
