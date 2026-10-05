import mongoose from "mongoose";
import TailoringPrice, { VALID_SIZE_TYPES } from "../modal/tailoring.modal.js";
import Product from "../modal/products.modal.js";

/**
 * Common error handler for tailoring controller
 */
const handleTailoringError = (res, error, action) => {
  console.error(`Tailoring Controller [${action}] Error:`, error);
  if (error.name === "CastError") {
    return res.status(400).json({ error: "معرف غير صالح" });
  }
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({ error: messages.join(", ") });
  }
  return res.status(500).json({ error: "حدث خطأ في الخادم" });
};

/**
 * Helper to normalize sizeType array from request body
 * Handles:
 * - [{ type: "child", price: 20 }, { type: "adult", price: 40 }]
 * - [{ sizeType: "child", price: 20 }]
 * - single sizeType: "child", price: 20
 */
const normalizeSizeTypeArray = (sizeTypeInput, singlePrice) => {
  if (Array.isArray(sizeTypeInput) && sizeTypeInput.length > 0) {
    return sizeTypeInput
      .map((item) => {
        if (typeof item === "string") {
          return { type: item.trim(), price: Number(singlePrice) || 0 };
        }
        const type = item.type || item.sizeType || item.name || "";
        const price = Number(item.price);
        return {
          type: String(type).trim(),
          price: Number.isFinite(price) && price >= 0 ? price : 0,
        };
      })
      .filter((item) => Boolean(item.type));
  }

  if (typeof sizeTypeInput === "string" && sizeTypeInput.trim()) {
    const price = Number(singlePrice);
    return [
      {
        type: sizeTypeInput.trim(),
        price: Number.isFinite(price) && price >= 0 ? price : 0,
      },
    ];
  }

  return [];
};

/**
 * Get all tailoring prices with filtering, search, and pagination
 */
export const getAllTailoringPrices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      productId,
      sizeType,
      isActive,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};

    // Filter by specific product or global
    if (productId) {
      if (productId === "global" || productId === "null") {
        filter.productId = null;
      } else if (mongoose.Types.ObjectId.isValid(productId)) {
        filter.productId = new mongoose.Types.ObjectId(productId);
      }
    }

    // Filter by sizeType inside array or legacy field
    if (sizeType) {
      filter.$or = [
        { "sizeType.type": sizeType },
        { sizeType: sizeType },
      ];
    }

    // Filter by active status
    if (isActive !== undefined && isActive !== "") {
      filter.isActive = isActive === "true" || isActive === true;
    }

    // Search query on notes or sizeType
    if (search) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      filter.$or = [
        { "sizeType.type": searchRegex },
        { notes: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = ["createdAt", "updatedAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const [tailoringPrices, total] = await Promise.all([
      TailoringPrice.find(filter)
        .populate("productId", "name images basePrice categoryId isAvailable")
        .populate("userId", "name email")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      TailoringPrice.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      tailoringPrices,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        totalItems: total,
        limit: limitNum,
      },
    });
  } catch (error) {
    return handleTailoringError(res, error, "getAllTailoringPrices");
  }
};

/**
 * Get tailoring prices for a specific product (includes global defaults)
 */
export const getTailoringPricesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { activeOnly } = req.query;

    const query = {
      productId: productId === "global" ? null : productId,
    };

    if (activeOnly === "true") {
      query.isActive = true;
    }

    const prices = await TailoringPrice.find(query)
      .populate("productId", "name images basePrice")
      .lean();

    return res.status(200).json({
      success: true,
      tailoringPrices: prices,
    });
  } catch (error) {
    return handleTailoringError(res, error, "getTailoringPricesByProduct");
  }
};

/**
 * Get single tailoring price by ID
 */
export const getTailoringPriceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "معرف غير صالح" });
    }

    const priceRecord = await TailoringPrice.findById(id)
      .populate("productId", "name images basePrice categoryId")
      .populate("userId", "name email");

    if (!priceRecord) {
      return res.status(404).json({ error: "سعر التفصيل غير موجود" });
    }

    return res.status(200).json({
      success: true,
      tailoringPrice: priceRecord,
    });
  } catch (error) {
    return handleTailoringError(res, error, "getTailoringPriceById");
  }
};

/**
 * Create a new tailoring price record or update existing for product
 */
export const createTailoringPrice = async (req, res) => {
  try {
    const { productId, sizeType, price, isActive = true, notes = "" } = req.body;

    const sizes = normalizeSizeTypeArray(sizeType, price);

    if (sizes.length === 0) {
      return res.status(400).json({
        error: "يجب تحديد نوع المقاس وسعره (مثال: طفل 20 ر.س، بالغ 40 ر.س)",
      });
    }

    let validProductId = null;
    if (productId && productId !== "global") {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: "معرف المنتج غير صالح" });
      }
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: "المنتج المحدد غير موجود" });
      }
      validProductId = product._id;
    }

    // Check if a tailoring record already exists for this product (or global)
    let existing = await TailoringPrice.findOne({
      productId: validProductId,
    });

    if (existing) {
      existing.sizeType = sizes;
      existing.price = sizes[0]?.price || 0;
      if (isActive !== undefined) existing.isActive = Boolean(isActive);
      if (notes !== undefined) existing.notes = notes.trim();
      existing.userId = req.user?._id || existing.userId;
      await existing.save();
      await existing.populate("productId", "name images basePrice");
      return res.status(200).json({
        success: true,
        message: "تم تحديث أسعار المقاسات بنجاح",
        tailoringPrice: existing,
      });
    }

    const newPrice = new TailoringPrice({
      userId: req.user?._id,
      productId: validProductId,
      sizeType: sizes,
      price: sizes[0]?.price || 0,
      isActive: Boolean(isActive),
      notes: notes?.trim() || "",
    });

    await newPrice.save();
    await newPrice.populate("productId", "name images basePrice");

    return res.status(201).json({
      success: true,
      message: "تم إنشاء أسعار المقاسات بنجاح",
      tailoringPrice: newPrice,
    });
  } catch (error) {
    return handleTailoringError(res, error, "createTailoringPrice");
  }
};

/**
 * Update an existing tailoring price record
 */
export const updateTailoringPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, sizeType, price, isActive, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "معرف غير صالح" });
    }

    const priceRecord = await TailoringPrice.findById(id);
    if (!priceRecord) {
      return res.status(404).json({ error: "سعر التفصيل غير موجود" });
    }

    if (sizeType !== undefined) {
      const sizes = normalizeSizeTypeArray(sizeType, price ?? priceRecord.price);
      if (sizes.length > 0) {
        priceRecord.sizeType = sizes;
        priceRecord.price = sizes[0]?.price || 0;
      }
    } else if (price !== undefined) {
      const numericPrice = Number(price);
      if (Number.isFinite(numericPrice) && numericPrice >= 0) {
        priceRecord.price = numericPrice;
        if (priceRecord.sizeType?.length === 1) {
          priceRecord.sizeType[0].price = numericPrice;
        }
      }
    }

    // Product association
    if (productId !== undefined) {
      if (!productId || productId === "global" || productId === "null") {
        priceRecord.productId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
          return res.status(400).json({ error: "معرف المنتج غير صالح" });
        }
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ error: "المنتج المحدد غير موجود" });
        }
        priceRecord.productId = product._id;
      }
    }

    if (isActive !== undefined) {
      priceRecord.isActive = Boolean(isActive);
    }

    if (notes !== undefined) {
      priceRecord.notes = notes.trim();
    }

    await priceRecord.save();
    await priceRecord.populate("productId", "name images basePrice");

    return res.status(200).json({
      success: true,
      message: "تم تحديث أسعار التفصيل بنجاح",
      tailoringPrice: priceRecord,
    });
  } catch (error) {
    return handleTailoringError(res, error, "updateTailoringPrice");
  }
};

/**
 * Toggle active status of a tailoring price (Admin only)
 */
export const toggleTailoringPriceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "معرف غير صالح" });
    }

    const priceRecord = await TailoringPrice.findById(id);
    if (!priceRecord) {
      return res.status(404).json({ error: "سعر التفصيل غير موجود" });
    }

    priceRecord.isActive = !priceRecord.isActive;
    await priceRecord.save();
    await priceRecord.populate("productId", "name images basePrice");

    return res.status(200).json({
      success: true,
      message: priceRecord.isActive ? "تم تفعيل سعر التفصيل" : "تم تعطيل سعر التفصيل",
      tailoringPrice: priceRecord,
    });
  } catch (error) {
    return handleTailoringError(res, error, "toggleTailoringPriceStatus");
  }
};

/**
 * Delete a tailoring price (Admin only)
 */
export const deleteTailoringPrice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "معرف غير صالح" });
    }

    const deleted = await TailoringPrice.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "سعر التفصيل غير موجود" });
    }

    return res.status(200).json({
      success: true,
      message: "تم حذف سعر التفصيل بنجاح",
    });
  } catch (error) {
    return handleTailoringError(res, error, "deleteTailoringPrice");
  }
};

/**
 * Bulk Upsert Tailoring Prices for a product (Admin only)
 * Enables setting all sizes (e.g. child: 20, adult: 40) in a single request
 */
export const bulkUpsertTailoringPrices = async (req, res) => {
  try {
    const { productId, prices } = req.body;

    if (!Array.isArray(prices) || prices.length === 0) {
      return res.status(400).json({
        error: "يجب إرسال قائمة من الأسعار في الحقل prices",
      });
    }

    let targetProductId = null;
    if (productId && productId !== "global") {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: "معرف المنتج غير صالح" });
      }
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: "المنتج المحدد غير موجود" });
      }
      targetProductId = product._id;
    }

    const sizes = normalizeSizeTypeArray(prices);
    if (sizes.length === 0) {
      return res.status(400).json({
        error: "يجب إدخال سعر واحد على الأقل مع تحديد نوع المقاس",
      });
    }

    const tailoringDoc = await TailoringPrice.findOneAndUpdate(
      { productId: targetProductId },
      {
        $set: {
          userId: req.user?._id,
          sizeType: sizes,
          price: sizes[0]?.price || 0,
          isActive: true,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    ).populate("productId", "name images basePrice");

    return res.status(200).json({
      success: true,
      message: "تم تحديث أسعار المقاسات بنجاح",
      tailoringPrice: tailoringDoc,
      tailoringPrices: [tailoringDoc],
    });
  } catch (error) {
    return handleTailoringError(res, error, "bulkUpsertTailoringPrices");
  }
};
