import mongoose from "mongoose";
const { Schema, model } = mongoose;
const addressSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    destination: {
      country: String,
      city: String,
      postalcode: String,
      street1: String,
    },
    phonenumber: String,
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Address = model("Address", addressSchema);

export default Address;
