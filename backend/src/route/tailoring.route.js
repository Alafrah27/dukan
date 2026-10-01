import express from "express";
import {
  getAllTailoringPrices,
  getTailoringPricesByProduct,
  getTailoringPriceById,
  createTailoringPrice,
  updateTailoringPrice,
  deleteTailoringPrice,
  toggleTailoringPriceStatus,
  bulkUpsertTailoringPrices,
} from "../controller/tailoring.controller.js";
import {
  protectRoute,
  adminProtectRoute,
} from "../middleware/usermiddleware.js";

const router = express.Router();

// Public / Client: Get tailoring prices for a specific product
router.get("/product/:productId", getTailoringPricesByProduct);

// Admin Protected: Get all tailoring prices with filters
router.get("/", protectRoute, adminProtectRoute, getAllTailoringPrices);

// Admin Protected: Get single tailoring price by ID
router.get("/:id", protectRoute, adminProtectRoute, getTailoringPriceById);

// Admin Protected: Create single tailoring price
router.post("/", protectRoute, adminProtectRoute, createTailoringPrice);

// Admin Protected: Bulk upsert prices for a product
router.post("/bulk", protectRoute, adminProtectRoute, bulkUpsertTailoringPrices);

// Admin Protected: Update tailoring price
router.put("/:id", protectRoute, adminProtectRoute, updateTailoringPrice);

// Admin Protected: Toggle active status
router.patch(
  "/:id/toggle-status",
  protectRoute,
  adminProtectRoute,
  toggleTailoringPriceStatus
);

// Admin Protected: Delete tailoring price
router.delete("/:id", protectRoute, adminProtectRoute, deleteTailoringPrice);

export default router;
