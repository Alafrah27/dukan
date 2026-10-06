import mongoose from "mongoose";
import { getAuth } from "@clerk/express";
import Cart from "../modal/cart.modal.js";
import Product from "../modal/products.modal.js";
import TailoringPrice from "../modal/tailoring.modal.js";
import User from "../modal/user.modal.js";
import Address from "../modal/address.modal.js";
import shippingService from "../services/shipping/shipping.service.js";

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

  let tailoringDoc = await TailoringPrice.findOne({
    productId: product._id,
    isActive: true,
  });
  if (!tailoringDoc) {
    tailoringDoc = await TailoringPrice.findOne({
      productId: null,
      isActive: true,
    });
  }
  if (!tailoringDoc) return "No active tailoring price found";

  let matchedPrice = null;
  if (Array.isArray(tailoringDoc.sizeType) && tailoringDoc.sizeType.length > 0) {
    const matched = tailoringDoc.sizeType.find(
      (s) => (s.type || s.sizeType) === sizeType
    );
    if (matched) matchedPrice = matched.price;
  } else if (tailoringDoc.sizeType === sizeType) {
    matchedPrice = tailoringDoc.price;
  }

  if (matchedPrice === null) {
    const globalDoc = await TailoringPrice.findOne({
      productId: null,
      isActive: true,
    });
    if (globalDoc) {
      if (Array.isArray(globalDoc.sizeType) && globalDoc.sizeType.length > 0) {
        const matched = globalDoc.sizeType.find(
          (s) => (s.type || s.sizeType) === sizeType
        );
        if (matched) matchedPrice = matched.price;
      } else if (globalDoc.sizeType === sizeType) {
        matchedPrice = globalDoc.price;
      }
    }
  }

  if (matchedPrice === null) {
    return `No active tailoring price found for size type: ${sizeType}`;
  }

  return null;
};

const handleCartError = (res, error, action) => {
  if (error.name === "CastError" || error.name === "ValidationError") {
    return res.status(400).json({ error: error.message || "Invalid cart data" });
  }
  console.error(`${action} error:`, error);
  return res.status(500).json({ error: "Internal server error" });
};

/**
 * Helper to resolve and validate address for a user.
 * Supports explicit addressId with validation, or auto-detecting user's default/latest address.
 */
const resolveAddressForUser = async (userId, addressId) => {
  if (addressId) {
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return { error: "Invalid addressId format", status: 400 };
    }
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return { error: "Address not found or does not belong to user", status: 404 };
    }
    return { address };
  }

  // Look for user's default address or most recent address
  let address = await Address.findOne({ userId, isDefault: true });
  if (!address) {
    address = await Address.findOne({ userId }).sort({ createdAt: -1 });
  }

  if (!address) {
    return {
      error: "An address is required for the cart. Please provide addressId or add an address to your profile first.",
      status: 400,
    };
  }

  return { address };
};

/**
 * Helper to calculate cart subtotal, tailoring fees, shipping fee, and final cost
 */
export const calculateCartSummary = async (cart) => {
  if (!cart) return null;

  const productIds = (cart.items || [])
    .map((i) => i.product?._id || i.product)
    .filter(Boolean);

  const tailoringDocs = await TailoringPrice.find({
    $or: [{ productId: { $in: productIds } }, { productId: null }],
    isActive: true,
  });

  const getTailoringPrice = (productId, sizeType) => {
    if (!sizeType) return 0;
    const prodDoc = tailoringDocs.find(
      (d) => String(d.productId) === String(productId)
    );
    if (prodDoc) {
      if (Array.isArray(prodDoc.sizeType)) {
        const found = prodDoc.sizeType.find(
          (s) => (s.type || s.sizeType) === sizeType
        );
        if (found && found.price !== undefined) return Number(found.price);
      } else if (prodDoc.sizeType === sizeType) {
        return Number(prodDoc.price) || 0;
      }
    }
    const globalDoc = tailoringDocs.find((d) => !d.productId);
    if (globalDoc) {
      if (Array.isArray(globalDoc.sizeType)) {
        const found = globalDoc.sizeType.find(
          (s) => (s.type || s.sizeType) === sizeType
        );
        if (found && found.price !== undefined) return Number(found.price);
      } else if (globalDoc.sizeType === sizeType) {
        return Number(globalDoc.price) || 0;
      }
    }
    return 0;
  };

  let subtotal = 0;
  let tailoringTotal = 0;
  let totalItemsCount = 0;

  const itemsDetails = (cart.items || []).map((item) => {
    const qty = Number(item.quantity) || 1;
    totalItemsCount += qty;
    const basePrice = Number(item.product?.basePrice) || 0;
    const isTailored =
      item.purchaseOption === "farbic_with_stiching" ||
      (typeof item.purchaseOption === "string" && item.purchaseOption.includes("stich"));

    const tailoringUnitPrice = isTailored
      ? getTailoringPrice(item.product?._id || item.product, item.tailoringSizeType)
      : 0;

    const itemBaseTotal = basePrice * qty;
    const itemTailoringTotal = tailoringUnitPrice * qty;
    const itemTotalPrice = (basePrice + tailoringUnitPrice) * qty;

    subtotal += itemBaseTotal;
    tailoringTotal += itemTailoringTotal;

    return {
      itemId: item._id,
      productId: item.product?._id || item.product,
      productName: item.product?.name || "",
      basePrice,
      tailoringUnitPrice,
      unitPrice: basePrice + tailoringUnitPrice,
      quantity: qty,
      itemTotal: itemTotalPrice,
      tailoringSizeType: item.tailoringSizeType || null,
      isTailored,
    };
  });

  const shippingFee =
    cart.aramex && typeof cart.aramex.price === "number"
      ? Number(cart.aramex.price)
      : 0;
  const itemsTotalWithTailoring = subtotal + tailoringTotal;
  const finalTotal = itemsTotalWithTailoring + shippingFee;

  return {
    itemsCount: totalItemsCount,
    itemsSubtotal: subtotal,
    tailoringTotal,
    itemsTotalWithTailoring,
    shippingFee,
    finalTotal,
    currency: cart.aramex?.currency || "SAR",
    itemsDetails,
  };
};

export const getCart = async (req, res) => {
  try {
    const user = await getCartUser(req, res);
    if (!user) return;

    let cart = await Cart.findOne({ userId: user._id })
      .populate("addressId")
      .populate("items.product", `${CART_PRODUCT_FIELDS} masurmentConfig`);

    if (!cart) {
      cart = { userId: user._id, addressId: null, items: [] };
    } else if (!cart.addressId) {
      // If legacy cart lacks addressId, attempt to link default address
      const { address } = await resolveAddressForUser(user._id);
      if (address) {
        cart.addressId = address._id;
        await cart.save();
        await cart.populate("addressId");
      }
    }

    const summary = await calculateCartSummary(cart);

    return res.status(200).json({ success: true, cart, summary });
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
      addressId,
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

    // Handle addressId validation and assignment
    if (addressId) {
      const { address, error, status } = await resolveAddressForUser(user._id, addressId);
      if (error) return res.status(status).json({ error });

      if (!cart) {
        cart = new Cart({ userId: user._id, addressId: address._id, items: [] });
      } else {
        cart.addressId = address._id;
      }
    } else if (!cart) {
      // New cart requires an address
      const { address, error, status } = await resolveAddressForUser(user._id);
      if (error) return res.status(status).json({ error });
      cart = new Cart({ userId: user._id, addressId: address._id, items: [] });
    } else if (!cart.addressId) {
      // Existing cart missing addressId
      const { address, error, status } = await resolveAddressForUser(user._id);
      if (error) return res.status(status).json({ error });
      cart.addressId = address._id;
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

    await cart.populate("addressId");
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

/**
 * Update the delivery address linked to the cart
 */
export const updateCartAddress = async (req, res) => {
  try {
    const user = await getCartUser(req, res);
    if (!user) return;

    const addressId = req.body.addressId || req.params.addressId;
    if (!addressId) {
      return res.status(400).json({ error: "addressId is required" });
    }

    const { address, error, status } = await resolveAddressForUser(user._id, addressId);
    if (error) return res.status(status).json({ error });

    let cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      cart = new Cart({
        userId: user._id,
        addressId: address._id,
        items: [],
      });
    } else {
      cart.addressId = address._id;
    }

    await cart.save();
    await cart.populate("addressId");
    await cart.populate("items.product", CART_PRODUCT_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Cart address updated successfully",
      cart,
    });
  } catch (error) {
    return handleCartError(res, error, "updateCartAddress");
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const user = await getCartUser(req, res);
    if (!user) return;

    const itemId =
      req.params.itemId && req.params.itemId !== "item"
        ? req.params.itemId
        : req.body.itemId || req.body._id;

    const {
      quantity,
      purchaseOption,
      tailoringSizeType,
      measurements,
      note,
      addressId,
    } = req.body;

    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    if (!itemId) {
      return res.status(400).json({ error: "itemId is required" });
    }

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ error: "Item not found in cart" });

    if (quantity !== undefined) {
      const parsedQuantity = parseQuantity(quantity);
      if (parsedQuantity === null) {
        return res
          .status(400)
          .json({ error: "Quantity must be a positive integer" });
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
        return res
          .status(400)
          .json({ error: "Invalid purchase option for this product" });
      }

      if (option.requiremasurment) {
        const selectedSize =
          tailoringSizeType === undefined
            ? item.tailoringSizeType
            : tailoringSizeType;
        const selectedMeasurements =
          measurements === undefined ? item.measurements : measurements;
        const validationError = await validateTailoring(
          product,
          selectedSize,
          selectedMeasurements
        );
        if (validationError)
          return res.status(400).json({ error: validationError });

        item.tailoringSizeType = selectedSize;
        item.measurements = selectedMeasurements;
      } else {
        item.tailoringSizeType = undefined;
        item.measurements = undefined;
      }
      item.purchaseOption = selectedOption;
    }

    if (note !== undefined) item.note = note;

    if (addressId) {
      const { address, error, status } = await resolveAddressForUser(user._id, addressId);
      if (error) return res.status(status).json({ error });
      cart.addressId = address._id;
    } else if (!cart.addressId) {
      const { address } = await resolveAddressForUser(user._id);
      if (address) {
        cart.addressId = address._id;
      }
    }

    await cart.save();
    await cart.populate("addressId");
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

    if (!cart.addressId) {
      const { address } = await resolveAddressForUser(user._id);
      if (address) {
        cart.addressId = address._id;
      }
    }

    await cart.save();
    await cart.populate("addressId");
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

    if (!cart.addressId) {
      const { address } = await resolveAddressForUser(user._id);
      if (address) {
        cart.addressId = address._id;
      }
    }

    await cart.save();
    await cart.populate("addressId");

    return res.status(200).json({
      success: true,
      message: "Cart cleared",
      cart,
    });
  } catch (error) {
    return handleCartError(res, error, "clearCart");
  }
};

/**
 * Calculate Aramex shipping price for the customer cart
 * - Box size is fixed from admin: 45cm (45x45x45 cm)
 * - User can change: kilo (weight in kg), countryCode, city, postalCode
 * - Saves calculation in cart.aramex and returns updated cart and final cost summary
 */
export const calculateCartShipping = async (req, res) => {
  try {
    const user = await getCartUser(req, res);
    if (!user) return;

    let cart = await Cart.findOne({ userId: user._id })
      .populate("addressId")
      .populate("items.product", `${CART_PRODUCT_FIELDS} masurmentConfig`);

    if (!cart) {
      return res.status(404).json({ error: "السلة غير موجودة" });
    }

    const {
      kilo = 1,
      countryCode,
      country,
      city,
      postalCode,
    } = req.body;

    const linkedAddress = cart.addressId;
    const rawCountry = (
      countryCode ||
      country ||
      linkedAddress?.destination?.country ||
      linkedAddress?.countryCode ||
      linkedAddress?.country ||
      "SA"
    ).trim();

    // Map common country names to 2-letter ISO codes if needed
    const countryMapping = {
      "المملكة العربية السعودية": "SA",
      "السعودية": "SA",
      "saudi arabia": "SA",
      "الإمارات العربية المتحدة": "AE",
      "الإمارات": "AE",
      "uae": "AE",
      "الكويت": "KW",
      "kuwait": "KW",
      "البحرين": "BH",
      "bahrain": "BH",
      "قطر": "QA",
      "qatar": "QA",
      "عُمان": "OM",
      "عمان": "OM",
      "oman": "OM",
      "جمهورية مصر العربية": "EG",
      "مصر": "EG",
      "egypt": "EG",
      "المملكة الأردنية الهاشمية": "JO",
      "الأردن": "JO",
      "jordan": "JO",
      "السودان": "SD",
      "sudan": "SD",
    };

    const destCountryCode = (
      countryMapping[rawCountry] ||
      countryMapping[rawCountry.toLowerCase()] ||
      (rawCountry.length === 2 ? rawCountry.toUpperCase() : "SA")
    );

    const destCity = (
      city ||
      linkedAddress?.destination?.city ||
      linkedAddress?.city ||
      "Riyadh"
    ).trim();

    const destPostalCode = (
      postalCode !== undefined
        ? String(postalCode)
        : (linkedAddress?.destination?.postalcode || linkedAddress?.postalCode || "")
    ).trim();

    const actualWeight = Math.max(0.1, Number(kilo) || 1);

    // Calculate quote via Aramex provider based on actual package weight
    const quotes = await shippingService.getQuotes({
      destination: {
        countryCode: destCountryCode,
        city: destCity,
        postalCode: destPostalCode,
      },
      packageDetails: {
        weight: actualWeight,
        length: 0,
        width: 0,
        height: 0,
        numberOfPieces: 1,
        shipmentType: "parcel",
      },
      currency: "SAR",
      provider: "aramex",
    });

    const quote = quotes?.[0];
    if (!quote || quote.price === undefined) {
      return res.status(400).json({
        error: "تعذر احتساب سعر الشحن عبر أرامكس، يرجى التحقق من صحة بيانات الوجهة",
      });
    }

    cart.aramex = {
      price: quote.price,
      currency: quote.currency || "SAR",
      kilo: actualWeight,
      boxSize: Number(req.body.boxSize) || 0,
      countryCode: destCountryCode,
      country: quote.destination?.nameAr || destCountryCode,
      city: destCity,
      postalCode: destPostalCode,
      serviceName: quote.serviceName || "Aramex Express",
      estimatedDays: "15 يوم",
      isCalculated: true,
      calculatedAt: new Date(),
    };

    await cart.save();

    const summary = await calculateCartSummary(cart);

    return res.status(200).json({
      success: true,
      message: "تم احتساب تكلفة الشحن بنجاح",
      aramex: cart.aramex,
      cart,
      summary,
    });
  } catch (error) {
    return handleCartError(res, error, "calculateCartShipping");
  }
};

