import express from "express";
import {
  createAddress,
  getUserAddresses,
  updateUserAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controller/address.controller.js";
import { protectRoute } from "../middleware/usermiddleware.js";

const router = express.Router();

// Require Clerk authentication on all address endpoints
router.use(protectRoute);

// Create a new address
router.post("/", createAddress);

// Get all addresses for currently authenticated user
router.get("/", getUserAddresses);

// Set address as default
router.put("/:addressId/default", setDefaultAddress);

// Update address by addressId 
router.put("/:addressId", updateUserAddress);

// Delete address by addressId
router.delete("/:addressId", deleteAddress);

export default router;
