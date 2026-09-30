import { getAuth } from "@clerk/express";
import Cart from "../modal/cart.modal.js";
import Product from "../modal/products.modal.js";
import TailoringPrice from "../modal/tailoring.modal.js";
import User from "../modal/user.modal.js";

// ──────────────────────────────────────────────
//  GET CART  (GET /api/v1/cart)
// ──────────────────────────────────────────────
export const getCart = async (req, res) => {
  try {
    const auth = getAuth(req);
    const { userId } = auth;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    let cart = await Cart.findOne({ userId: user._id }).populate(
      "items.product",
      "name images basePrice isAvailable purchaseoption masurmentConfig"
    );

    if (!cart) {
      cart = { userId: user._id, items: [] };
    }

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("getCart error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ──────────────────────────────────────────────
//  ADD ITEM  (POST /api/v1/cart)
// ──────────────────────────────────────────────
export const addToCart = async (req, res) => {
  try {
    const auth = getAuth(req);
    const { userId } = auth;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const {
      productId,
      purchaseOption,
      tailoringSizeType,
      measurements,
      note,
      quantity = 1,
    } = req.body;

    // ── Validate product ──
    if (!productId || !purchaseOption) {
      return res
        .status(400)
        .json({ error: "productId and purchaseOption are required" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (!product.isAvailable) {
      return res.status(400).json({ error: "Product is not available" });
    }

    // ── Validate purchaseOption exists on this product ──
    const option = product.purchaseoption.find(
      (opt) => opt.key === purchaseOption
    );
    if (!option) {
      return res
        .status(400)
        .json({ error: "Invalid purchase option for this product" });
    }

    // ── If tailored, validate sizeType + measurements ──
    if (option.requiremasurment) {
      if (!tailoringSizeType) {
        return res
          .status(400)
          .json({ error: "tailoringSizeType is required for this option" });
      }

      // Check tailoring price exists and is active
      const tailoringPrice = await TailoringPrice.findOne({
        productId: product._id,
        sizeType: tailoringSizeType,
        isActive: true,
      });
      if (!tailoringPrice) {
        return res.status(400).json({
          error: "No active tailoring price found for this size type",
        });
      }

      // Validate measurements dynamically from product.masurmentConfig.field
      const requiredFields = (product.masurmentConfig?.field || []).filter(
        (f) => f.require
      );

      if (requiredFields.length > 0 && !measurements) {
        return res.status(400).json({ error: "Measurements are required" });
      }

      for (const field of requiredFields) {
        const value = measurements?.[field.key];
        if (value === undefined || value === null) {
          return res
            .status(400)
            .json({ error: `Measurement "${field.label}" is required` });
        }
        if (typeof value !== "number" || value <= 0) {
          return res
            .status(400)
            .json({ error: `Measurement "${field.label}" must be a positive number` });
        }
      }
    }

    // ── Find or create cart ──
    let cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      cart = new Cart({ userId: user._id, items: [] });
    }

    // ── Build cart item ──
    const cartItem = {
      product: product._id,
      purchaseOption,
      quantity: Math.max(1, Number(quantity)),
    };

    if (option.requiremasurment) {
      cartItem.tailoringSizeType = tailoringSizeType;
      cartItem.measurements = measurements;
    }

    if (note) cartItem.note = note;

    cart.items.push(cartItem);
    await cart.save();

    // Populate before returning
    await cart.populate(
      "items.product",
      "name images basePrice isAvailable purchaseoption"
    );

    return res.status(200).json({
      success: true,
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    console.error("addToCart error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ──────────────────────────────────────────────
//  UPDATE ITEM  (PUT /api/v1/cart/:itemId)
// ──────────────────────────────────────────────
export const updateCartItem = async (req, res) => {
  try {
    const auth = getAuth(req);
    const { userId } = auth;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { itemId } = req.params;
    const { quantity, purchaseOption, tailoringSizeType, measurements, note } =
      req.body;

    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ error: "Item not found in cart" });

    // ── Update quantity ──
    if (quantity !== undefined) {
      if (quantity < 1) {
        return res.status(400).json({ error: "Quantity must be at least 1" });
      }
      item.quantity = quantity;
    }

    // ── Update purchase option (re-validate if changed) ──
    if (purchaseOption !== undefined) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ error: "Product not found" });

      const option = product.purchaseoption.find(
        (opt) => opt.key === purchaseOption
      );
      if (!option) {
        return res
          .status(400)
          .json({ error: "Invalid purchase option for this product" });
      }

      item.purchaseOption = purchaseOption;

      if (option.requiremasurment) {
        const sizeType = tailoringSizeType || item.tailoringSizeType;
        if (!sizeType) {
          return res
            .status(400)
            .json({ error: "tailoringSizeType is required for this option" });
        }

        const tailoringPrice = await TailoringPrice.findOne({
          productId: product._id,
          sizeType,
          isActive: true,
        });
        if (!tailoringPrice) {
          return res.status(400).json({
            error: "No active tailoring price found for this size type",
          });
        }

        const meas = measurements || item.measurements?.toJSON();
        const requiredFields = (product.masurmentConfig?.field || []).filter(
          (f) => f.require
        );

        for (const field of requiredFields) {
          const value = meas?.[field.key];
          if (value === undefined || value === null) {
            return res
              .status(400)
              .json({ error: `Measurement "${field.label}" is required` });
          }
          if (typeof value !== "number" || value <= 0) {
            return res.status(400).json({
              error: `Measurement "${field.label}" must be a positive number`,
            });
          }
        }

        item.tailoringSizeType = sizeType;
        if (measurements) item.measurements = measurements;
      } else {
        // Switching to non-tailored: clear tailoring data
        item.tailoringSizeType = undefined;
        item.measurements = undefined;
      }
    }

    if (note !== undefined) item.note = note;

    await cart.save();
    await cart.populate(
      "items.product",
      "name images basePrice isAvailable purchaseoption"
    );

    return res.status(200).json({
      success: true,
      message: "Cart item updated",
      cart,
    });
  } catch (error) {
    console.error("updateCartItem error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ──────────────────────────────────────────────
//  REMOVE ITEM  (DELETE /api/v1/cart/:itemId)
// ──────────────────────────────────────────────
export const removeFromCart = async (req, res) => {
  try {
    const auth = getAuth(req);
    const { userId } = auth;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ error: "Item not found in cart" });

    item.deleteOne();
    await cart.save();

    await cart.populate(
      "items.product",
      "name images basePrice isAvailable purchaseoption"
    );

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    console.error("removeFromCart error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ──────────────────────────────────────────────
//  CLEAR CART  (DELETE /api/v1/cart)
// ──────────────────────────────────────────────
export const clearCart = async (req, res) => {
  try {
    const auth = getAuth(req);
    const { userId } = auth;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      return res.status(200).json({ success: true, message: "Cart is already empty" });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared",
      cart,
    });
  } catch (error) {
    console.error("clearCart error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
