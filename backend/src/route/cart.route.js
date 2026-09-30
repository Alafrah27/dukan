import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controller/cart.controller.js";
import { protectRoute } from "../middleware/usermiddleware.js";

const router = express.Router();

// All cart routes require authentication
router.use(protectRoute);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:itemId", updateCartItem);
router.delete("/:itemId", removeFromCart);
router.delete("/", clearCart);

export default router;
