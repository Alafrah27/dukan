import mongoose from "mongoose";
const { Schema, model } = mongoose;

const addressSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "المنزل",
      trim: true,
    },
    recipientName: {
      type: String,
      default: "",
      trim: true,
    },
    // All address data must be provided by the customer — no hardcoded defaults
    destination: {
      country: { type: String, required: [true, "الدولة مطلوبة"], trim: true },
      city: { type: String, required: [true, "المدينة مطلوبة"], trim: true },
      district: { type: String, trim: true },
      postalcode: { type: String, required: [true, "الرمز البريدي مطلوب"], trim: true },
      street1: { type: String, required: [true, "اسم الشارع مطلوب"], trim: true },
      state: { type: String, trim: true },
    },
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
    },
    phonenumber: {
      type: String,
      required: [true, "رقم الجوال مطلوب"],
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Guarantee only one address per user can be default (isDefault: true)
addressSchema.pre("save", async function () {
  if (this.isModified("isDefault") && this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
});

// Partial unique index: enforces at the database level that a user can have at most one document with isDefault: true
addressSchema.index(
  { userId: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
  }
);

const Address = model("Address", addressSchema);

export default Address;
