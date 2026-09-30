import express from "express";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
} from "../controller/products.controller.js";
import {
  protectRoute,
  adminProtectRoute,
} from "../middleware/usermiddleware.js";
import upload from "../lib/muilter.js";

const router = express.Router();

// Public — anyone can view products
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Admin only — create, update, delete (with multi-image upload)
router.post(
  "/",
  protectRoute,
  adminProtectRoute,
  upload.array("images", 5),
  createProduct
);
router.put(
  "/:id",
  protectRoute,
  adminProtectRoute,
  upload.array("images", 5),
  updateProduct
);
router.delete("/:id", protectRoute, adminProtectRoute, deleteProduct);

export default router;
