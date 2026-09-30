import mongoose, { Types } from "mongoose";
const { Schema, model } = mongoose;
const categorySchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Category = model("Category", categorySchema);
export default Category;
