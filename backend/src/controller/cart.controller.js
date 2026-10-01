import { getAuth } from "@clerk/express";
import Cart from "../modal/cart.modal.js";
import Product from "../modal/products.modal.js";
import TailoringPrice from "../modal/tailoring.modal.js";
import User from "../modal/user.modal.js";

const CART_PRODUCT_FIELDS = "name images basePrice isAvailable purchaseoption";

const getCartUser = async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) res.status(404).json({ error: "User not found" });
  return user;
};

const parseQuantity = (value) => {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const quantity = Number(value);
  return Number.isSafeInteger(quantity) && quantity > 0 ? quantity : null;
};

const validateTailoring = async (product, sizeType, measurements) => {
  if (!sizeType) return "tailoringSizeType is required for this option";

  const fields = product.masurmentConfig?.field || [];
  if (fields.some((field) => field.require) && !measurements) {
    return "Measurements are required";
  }

  if (
    measurements != null &&
    (typeof measurements !== "object" || Array.isArray(measurements))
  ) {
    return "Measurements must be an object";
  }

  for (const field of fields) {
    const value =
      measurements instanceof Map
        ? measurements.get(field.key)
        : measurements?.[field.key];

    if (value === undefined || value === null) {
      if (field.require) return `Measurement "${field.label}" is required`;
      continue;
    }
    if (!Number.isFinite(value) || value <= 0) {
      return `Measurement "${field.label}" must be a positive number`;
    }
  }

  let tailoringPrice = await TailoringPrice.findOne({
    productId: product._id,
    sizeType,
    isActive: true,
  });
  if (!tailoringPrice) {
    tailoringPrice = await TailoringPrice.findOne({
      productId: null,
      sizeType,
      isActive: true,
    });
  }
  if (!tailoringPrice) return "No active tailoring price found for this size type";

  return null;
};

const handleCartError = (res, error, action) => {
  if (error.name === "CastError" || error.name === "ValidationError") {
    return res.status(400).json({ error: "Invalid cart data" });
  }
  console.error(`${action} error:`, error);
  return res.status(500).json({ error: "Internal server error" });
};

export const getCart = async (req, res) => {
  try {
    const user = await getCartUser(req, res);
    if (!user) return;

    let cart = await Cart.findOne({ userId: user._id }).populate(
      "items.product",
      `${CART_PRODUCT_FIELDS} masurmentConfig`
    );

    if (!cart) {
      cart = { userId: user._id, items: [] };
    }

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    return handleCartError(res, error, "getCart");
  }
};

export const addToCart = async (req, res) => {
  try {
    const user = await getCartUser(req, res);
    if (!user) return;

    const {
      productId,
      purchaseOption,
      tailoringSizeType,
      measurements,
      note,
      quantity = 1,
    } = req.body;

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

    const option = product.purchaseoption.find(
      (opt) => opt.key === purchaseOption
    );
    if (!option) {
      return res
        .status(400)
        .json({ error: "Invalid purchase option for this product" });
    }

    const parsedQuantity = parseQuantity(quantity);
    if (parsedQuantity === null) {
      return res.status(400).json({ error: "Quantity must be a positive integer" });
    }

    if (option.requiremasurment) {
      const validationError = await validateTailoring(
        product,
        tailoringSizeType,
        measurements
      );
      if (validationError) return res.status(400).json({ error: validationError });
    }

    let cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      cart = new Cart({ userId: user._id, items: [] });
    }

    const cartItem = {
      product: product._id,
      purchaseOption,
      quantity: parsedQuantity,
    };

    if (option.requiremasurment) {
      cartItem.tailoringSizeType = tailoringSizeType;
      cartItem.measurements = measurements;
    }

    if (note) cartItem.note = note;

    cart.items.push(cartItem);
    await cart.save();

    await cart.populate("items.product", CART_PRODUCT_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    return handleCartError(res, error, "addToCart");
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const user = await getCartUser(req, res);
    if (!user) return;

    const { itemId } = req.params;
    const { quantity, purchaseOption, tailoringSizeType, measurements, note } =
      req.body;

    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ error: "Item not found in cart" });

    if (quantity !== undefined) {
      const parsedQuantity = parseQuantity(quantity);
      if (parsedQuantity === null) {
        return res.status(400).json({ error: "Quantity must be a positive integer" });
      }
      item.quantity = parsedQuantity;
    }

    const selectionChanged =
      purchaseOption !== undefined ||
      tailoringSizeType !== undefined ||
      measurements !== undefined;

    if (selectionChanged) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ error: "Product not found" });

      const selectedOption =
        purchaseOption === undefined ? item.purchaseOption : purchaseOption;
      const option = product.purchaseoption.find(
        (option) => option.key === selectedOption
      );
      if (!option) {
        return res.status(400).json({ error: "Invalid purchase option for this product" });
      }

      if (option.requiremasurment) {
        const selectedSize =
          tailoringSizeType === undefined ? item.tailoringSizeType : tailoringSizeType;
        const selectedMeasurements =
          measurements === undefined ? item.measurements : measurements;
        const validationError = await validateTailoring(
          product,
          selectedSize,
          selectedMeasurements
        );
        if (validationError) return res.status(400).json({ error: validationError });

        item.tailoringSizeType = selectedSize;
        item.measurements = selectedMeasurements;
      } else {
        item.tailoringSizeType = undefined;
        item.measurements = undefined;
      }
      item.purchaseOption = selectedOption;
    }

    if (note !== undefined) item.note = note;

    await cart.save();
    await cart.populate("items.product", CART_PRODUCT_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Cart item updated",
      cart,
    });
  } catch (error) {
    return handleCartError(res, error, "updateCartItem");
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const user = await getCartUser(req, res);
    if (!user) return;

    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ error: "Item not found in cart" });

    item.deleteOne();
    await cart.save();

    await cart.populate("items.product", CART_PRODUCT_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    return handleCartError(res, error, "removeFromCart");
  }
};

export const clearCart = async (req, res) => {
  try {
    const user = await getCartUser(req, res);
    if (!user) return;

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
    return handleCartError(res, error, "clearCart");
  }
};
