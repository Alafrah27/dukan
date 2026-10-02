import mongoose from "mongoose";
import Offer from "../modal/offer.modal.js";
import Product from "../modal/products.modal.js";

const POPULATE_PRODUCT_FIELDS = "name images basePrice isAvailable categoryId";

const handleOfferError = (res, error, action) => {
  if (error.name === "CastError" || error.name === "ValidationError") {
    return res.status(400).json({
      error: error.message || "بيانات العرض غير صالحة",
    });
  }
  console.error(`${action} error:`, error);
  return res.status(500).json({
    error: "حدث خطأ في الخادم الداخلي",
  });
};

/**
 * Validate offer payload values and dates
 */
const validateOfferData = async ({
  productId,
  productsId,
  value,
  type,
  startDate,
  endDate,
}) => {
  if (!productId) {
    return "يرجى تحديد المنتج الأساسي للعرض";
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return "معرف المنتج غير صالح";
  }

  const product = await Product.findById(productId);
  if (!product) {
    return "المنتج المحدد غير موجود";
  }

  if (value === undefined || value === null || isNaN(Number(value))) {
    return "يرجى إدخال قيمة الخصم";
  }

  const numValue = Number(value);
  if (numValue <= 0) {
    return "قيمة الخصم يجب أن تكون أكبر من صفر";
  }

  const offerType = type || "percent";
  if (!["percent", "fixed"].includes(offerType)) {
    return "نوع العرض يجب أن يكون 'percent' أو 'fixed'";
  }

  if (offerType === "percent" && numValue > 100) {
    return "نسبة الخصم المئوية لا يمكن أن تتجاوز 100%";
  }

  if (offerType === "fixed" && product.basePrice && numValue >= product.basePrice) {
    return "مبلغ الخصم الثابت لا يمكن أن يكون أكبر من أو يساوي سعر المنتج الأصلي";
  }

  if (!startDate) {
    return "يرجى تحديد تاريخ بداية العرض";
  }

  if (!endDate) {
    return "يرجى تحديد تاريخ نهاية العرض";
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return "تاريخ بداية العرض غير صالح";
  }

  if (isNaN(end.getTime())) {
    return "تاريخ نهاية العرض غير صالح";
  }

  if (end < start) {
    return "تاريخ نهاية العرض يجب أن يكون بعد تاريخ البداية";
  }

  if (productsId && Array.isArray(productsId)) {
    for (const pId of productsId) {
      if (!mongoose.Types.ObjectId.isValid(pId)) {
        return "أحد معرفات المنتجات الإضافية غير صالح";
      }
    }
  }

  return null;
};

/**
 * Create a new Offer (Admin Only)
 */
export const createOffer = async (req, res) => {
  try {
    const {
      title,
      productId,
      productsId,
      value,
      type = "percent",
      startDate,
      endDate,
      isActive = true,
    } = req.body;

    const validationError = await validateOfferData({
      productId,
      productsId,
      value,
      type,
      startDate,
      endDate,
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const additionalProducts =
      Array.isArray(productsId) && productsId.length > 0
        ? productsId
        : [productId];

    const offer = new Offer({
      userId: req.user._id,
      productId,
      productsId: additionalProducts,
      value: Number(value),
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      title: title ? title.trim() : "",
      isActive: Boolean(isActive),
    });

    await offer.save();

    await offer.populate("productId", POPULATE_PRODUCT_FIELDS);
    await offer.populate("productsId", POPULATE_PRODUCT_FIELDS);

    return res.status(201).json({
      success: true,
      message: "تم إنشاء العرض بنجاح",
      offer,
    });
  } catch (error) {
    return handleOfferError(res, error, "createOffer");
  }
};

/**
 * Get all offers with filtering, search, and pagination (Admin & General)
 */
export const getOffers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status, // "active", "upcoming", "expired", "inactive"
      type, // "percent", "fixed"
      search,
      productId,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    const now = new Date();

    // Status filter
    if (status === "active") {
      filter.isActive = true;
      filter.startDate = { $lte: now };
      filter.endDate = { $gte: now };
    } else if (status === "upcoming") {
      filter.startDate = { $gt: now };
    } else if (status === "expired") {
      filter.endDate = { $lt: now };
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    // Type filter
    if (type && ["percent", "fixed"].includes(type)) {
      filter.type = type;
    }

    // Specific product filter
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      filter.$or = [{ productId }, { productsId: productId }];
    }

    // Search by title or product name
    if (search && search.trim()) {
      const q = search.trim();
      const matchingProducts = await Product.find({
        name: { $regex: q, $options: "i" },
      }).select("_id");
      const matchedIds = matchingProducts.map((p) => p._id);

      const searchConditions = [{ title: { $regex: q, $options: "i" } }];
      if (matchedIds.length > 0) {
        searchConditions.push(
          { productId: { $in: matchedIds } },
          { productsId: { $in: matchedIds } }
        );
      }

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sortOrder = order === "asc" ? 1 : -1;
    const sortField = ["createdAt", "startDate", "endDate", "value"].includes(
      sortBy
    )
      ? sortBy
      : "createdAt";

    // Query data and counts in parallel
    const [offers, totalItems, totalAll, activeCount, upcomingCount, expiredCount] =
      await Promise.all([
        Offer.find(filter)
          .populate("productId", POPULATE_PRODUCT_FIELDS)
          .populate("productsId", POPULATE_PRODUCT_FIELDS)
          .populate("userId", "name email")
          .sort({ [sortField]: sortOrder })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Offer.countDocuments(filter),
        Offer.countDocuments({}),
        Offer.countDocuments({
          isActive: true,
          startDate: { $lte: now },
          endDate: { $gte: now },
        }),
        Offer.countDocuments({ startDate: { $gt: now } }),
        Offer.countDocuments({ endDate: { $lt: now } }),
      ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limitNum));

    return res.status(200).json({
      success: true,
      offers,
      stats: {
        total: totalAll,
        active: activeCount,
        upcoming: upcomingCount,
        expired: expiredCount,
      },
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    return handleOfferError(res, error, "getOffers");
  }
};

/**
 * Get active offers for client-side storefront (Public)
 */
export const getActiveOffers = async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate("productId", POPULATE_PRODUCT_FIELDS)
      .populate("productsId", POPULATE_PRODUCT_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: offers.length,
      offers,
    });
  } catch (error) {
    return handleOfferError(res, error, "getActiveOffers");
  }
};

/**
 * Get a single offer by ID
 */
export const getOfferById = async (req, res) => {
  try {
    const { offerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({ error: "معرف العرض غير صالح" });
    }

    const offer = await Offer.findById(offerId)
      .populate("productId", POPULATE_PRODUCT_FIELDS)
      .populate("productsId", POPULATE_PRODUCT_FIELDS)
      .populate("userId", "name email");

    if (!offer) {
      return res.status(404).json({ error: "العرض غير موجود" });
    }

    return res.status(200).json({
      success: true,
      offer,
    });
  } catch (error) {
    return handleOfferError(res, error, "getOfferById");
  }
};

/**
 * Update an existing offer (Admin Only)
 */
export const updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const {
      title,
      productId,
      productsId,
      value,
      type,
      startDate,
      endDate,
      isActive,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({ error: "معرف العرض غير صالح" });
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ error: "العرض غير موجود" });
    }

    const targetProductId = productId || offer.productId;
    const targetValue = value !== undefined ? value : offer.value;
    const targetType = type || offer.type;
    const targetStart = startDate || offer.startDate;
    const targetEnd = endDate || offer.endDate;

    const validationError = await validateOfferData({
      productId: targetProductId,
      productsId,
      value: targetValue,
      type: targetType,
      startDate: targetStart,
      endDate: targetEnd,
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (title !== undefined) offer.title = title.trim();
    if (productId !== undefined) offer.productId = productId;
    if (productsId !== undefined) {
      offer.productsId =
        Array.isArray(productsId) && productsId.length > 0
          ? productsId
          : [offer.productId];
    }
    if (value !== undefined) offer.value = Number(value);
    if (type !== undefined) offer.type = type;
    if (startDate !== undefined) offer.startDate = new Date(startDate);
    if (endDate !== undefined) offer.endDate = new Date(endDate);
    if (isActive !== undefined) offer.isActive = Boolean(isActive);

    await offer.save();

    await offer.populate("productId", POPULATE_PRODUCT_FIELDS);
    await offer.populate("productsId", POPULATE_PRODUCT_FIELDS);

    return res.status(200).json({
      success: true,
      message: "تم تحديث العرض بنجاح",
      offer,
    });
  } catch (error) {
    return handleOfferError(res, error, "updateOffer");
  }
};

/**
 * Quick toggle offer isActive status (Admin Only)
 */
export const toggleOfferStatus = async (req, res) => {
  try {
    const { offerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({ error: "معرف العرض غير صالح" });
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ error: "العرض غير موجود" });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    await offer.populate("productId", POPULATE_PRODUCT_FIELDS);

    return res.status(200).json({
      success: true,
      message: offer.isActive ? "تم تفعيل العرض بنجاح" : "تم تعطيل العرض بنجاح",
      offer,
    });
  } catch (error) {
    return handleOfferError(res, error, "toggleOfferStatus");
  }
};

/**
 * Delete an offer (Admin Only)
 */
export const deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({ error: "معرف العرض غير صالح" });
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ error: "العرض غير موجود" });
    }

    await Offer.findByIdAndDelete(offerId);

    return res.status(200).json({
      success: true,
      message: "تم حذف العرض بنجاح",
    });
  } catch (error) {
    return handleOfferError(res, error, "deleteOffer");
  }
};
