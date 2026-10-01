import express from "express";
import {
  createUser,
  getAllUsers,
  getCurrentUser,
  updateUserRole,
  deleteUser,
  updateExpoPushToken,
  toggleNotifications,
  deleteMyAccount,
} from "../controller/user.controller.js";
import {
  protectRoute,
  adminProtectRoute,
} from "../middleware/usermiddleware.js";

const router = express.Router();

// Synchronize or create user from Clerk
router.post("/", createUser);

// Get currently authenticated user profile
router.get("/me", protectRoute, getCurrentUser);

// Delete currently authenticated user account
router.delete("/me", protectRoute, deleteMyAccount);

// Update expo push token for notifications
router.put("/update-expo-push-token", protectRoute, updateExpoPushToken);

// Toggle notifications on/off
router.put("/toggle-notifications", protectRoute, toggleNotifications);

// Admin: Get all users with search & pagination
router.get("/", protectRoute, adminProtectRoute, getAllUsers);

// Admin: Update user role
router.patch("/:id/role", protectRoute, adminProtectRoute, updateUserRole);

// Admin: Delete user
router.delete("/:id", protectRoute, adminProtectRoute, deleteUser);

export default router;