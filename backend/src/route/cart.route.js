import express from "express";
import {
  getCart,
  addToCart,
  updateCartAddress,
  updateCartItem,
  removeFromCart,
  clearCart,
  calculateCartShipping,
} from "../controller/cart.controller.js";
import { protectRoute } from "../middleware/usermiddleware.js";

const router = express.Router();

// All cart routes require authentication
router.use(protectRoute);

router.get("/", getCart);
router.post("/", addToCart);

// Calculate Aramex shipping price for the cart
router.post("/calculate-shipping", calculateCartShipping);
router.post("/shipping", calculateCartShipping);
router.put("/aramex", calculateCartShipping);
router.post("/aramex", calculateCartShipping);

// Update cart delivery address
router.put("/address", updateCartAddress);
router.put("/address/:addressId", updateCartAddress);

// Update cart items
router.put("/item", updateCartItem);
router.put("/item/:itemId", updateCartItem);
router.put("/:itemId", updateCartItem);

// Delete cart items
router.delete("/item/:itemId", removeFromCart);
router.delete("/:itemId", removeFromCart);
router.delete("/", clearCart);

export default router;
