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
    destination: {
      country: { type: String, default: "السعودية" },
      city: { type: String, default: "" },
      district: { type: String, default: "" },
      postalcode: { type: String, default: "" },
      street1: { type: String, default: "" },
      state: { type: String, default: "" },
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    phonenumber: {
      type: String,
      default: "",
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
