import mongoose from "mongoose";
const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clerkUserId: {
      type: String,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    user_profile_image: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      index: true,
    },
    expoPushToken: {
      type: String,
      default: "",
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Keep clerkId / clerkUserId and imageUrl / user_profile_image in sync
UserSchema.pre("save", function () {
  if (this.clerkId && !this.clerkUserId) {
    this.clerkUserId = this.clerkId;
  }
  if (this.clerkUserId && !this.clerkId) {
    this.clerkId = this.clerkUserId;
  }
  if (this.imageUrl && !this.user_profile_image) {
    this.user_profile_image = this.imageUrl;
  }
  if (this.user_profile_image && !this.imageUrl) {
    this.imageUrl = this.user_profile_image;
  }
});

const User = mongoose.models.User || model("User", UserSchema);
export default User;
