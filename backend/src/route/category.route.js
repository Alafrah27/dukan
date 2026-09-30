import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controller/category.ccontroller.js";
import {
  protectRoute,
  adminProtectRoute,
} from "../middleware/usermiddleware.js";

const router = express.Router();

// Public — anyone can view categories
router.get("/", getCategories);

// Admin only — create, update, delete
router.post("/", protectRoute, adminProtectRoute, createCategory);
router.put("/:categoryId", protectRoute, adminProtectRoute, updateCategory);
router.delete("/:categoryId", protectRoute, adminProtectRoute, deleteCategory);

export default router;
