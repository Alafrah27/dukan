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

    // Filter by sizeType
    if (sizeType && VALID_SIZE_TYPES.includes(sizeType)) {
      filter.sizeType = sizeType;
    }

    // Filter by active status
    if (isActive !== undefined && isActive !== "") {
      filter.isActive = isActive === "true" || isActive === true;
    }

    // Search query on notes or sizeType
    if (search) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      filter.$or = [
        { sizeType: searchRegex },
        { notes: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = ["createdAt", "price", "sizeType", "updatedAt"];
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
      .sort({ price: 1 })
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
 * Create a new tailoring price (Admin only)
 */
export const createTailoringPrice = async (req, res) => {
  try {
    const { productId, sizeType, price, isActive = true, notes = "" } = req.body;

    if (!sizeType || price === undefined || price === null) {
      return res.status(400).json({
        error: "نوع المقاس والسعر مطلوبان",
      });
    }

    if (!VALID_SIZE_TYPES.includes(sizeType)) {
      return res.status(400).json({
        error: `نوع المقاس غير مدعوم. الأنواع المدعومة هي: ${VALID_SIZE_TYPES.join(", ")}`,
      });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        error: "يجب أن يكون السعر رقم موجب أو صفر",
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

    // Check if a record already exists for this product and sizeType
    const existing = await TailoringPrice.findOne({
      productId: validProductId,
      sizeType,
    });

    if (existing) {
      return res.status(409).json({
        error: "يوجد سعر تفصيل مسجل بالفعل لهذا المقاس والمنتج. يمكنك تعديل السعر القائم بدلاً من إنشاء جديد.",
        existingId: existing._id,
      });
    }

    const newPrice = new TailoringPrice({
      userId: req.user?._id,
      productId: validProductId,
      sizeType,
      price: numericPrice,
      isActive: Boolean(isActive),
      notes: notes?.trim() || "",
    });

    await newPrice.save();

    await newPrice.populate("productId", "name images basePrice");

    return res.status(201).json({
      success: true,
      message: "تم إنشاء سعر التفصيل بنجاح",
      tailoringPrice: newPrice,
    });
  } catch (error) {
    return handleTailoringError(res, error, "createTailoringPrice");
  }
};

/**
 * Update an existing tailoring price (Admin only)
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

    // Validation if sizeType changed
    if (sizeType !== undefined) {
      if (!VALID_SIZE_TYPES.includes(sizeType)) {
        return res.status(400).json({
          error: `نوع المقاس غير مدعوم. الأنواع المدعومة: ${VALID_SIZE_TYPES.join(", ")}`,
        });
      }
      priceRecord.sizeType = sizeType;
    }

    // Validation if price changed
    if (price !== undefined) {
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ error: "يجب أن يكون السعر رقم موجب أو صفر" });
      }
      priceRecord.price = numericPrice;
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

    // Check duplicate conflict with other records
    const conflict = await TailoringPrice.findOne({
      _id: { $ne: priceRecord._id },
      productId: priceRecord.productId,
      sizeType: priceRecord.sizeType,
    });

    if (conflict) {
      return res.status(409).json({
        error: "يوجد سعر آخر مسجل بالفعل لنفس المقاس والمنتج",
      });
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
      message: "تم تحديث سعر التفصيل بنجاح",
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
 * Enables setting all sizes (e.g. child, small, medium, large) in a single request
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

    const operations = [];

    for (const item of prices) {
      const { sizeType, price, isActive = true, notes = "" } = item;

      if (!sizeType || !VALID_SIZE_TYPES.includes(sizeType)) {
        return res.status(400).json({
          error: `المقاس ${sizeType || ""} غير صالح`,
        });
      }

      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
          error: `سعر المقاس ${sizeType} يجب أن يكون رقم موجب أو صفر`,
        });
      }

      operations.push(
        TailoringPrice.findOneAndUpdate(
          {
            productId: targetProductId,
            sizeType,
          },
          {
            $set: {
              userId: req.user?._id,
              price: numericPrice,
              isActive: Boolean(isActive),
              notes: notes?.trim() || "",
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        )
      );
    }

    const savedPrices = await Promise.all(operations);

    return res.status(200).json({
      success: true,
      message: "تم تحديث أسعار التفصيل بنجاح",
      tailoringPrices: savedPrices,
    });
  } catch (error) {
    return handleTailoringError(res, error, "bulkUpsertTailoringPrices");
  }
};
