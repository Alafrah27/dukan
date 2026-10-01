import Product from "../modal/products.modal.js";
import Cloudinary from "../lib/cloudinary.js";
import fs from "fs/promises";

/**
 * Extract Cloudinary public_id from a secure_url.
 * e.g. "https://res.cloudinary.com/.../products/abc123.jpg" → "products/abc123"
 */
const extractPublicId = (url) => {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    // Remove version prefix (v1234567890/) and file extension
    const afterUpload = parts[1].replace(/^v\d+\//, "");
    return afterUpload.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

/**
 * Upload an array of multer files to Cloudinary (parallel).
 * Returns an array of secure_urls.
 */
const uploadImagesToCloudinary = async (files) => {
  const uploadPromises = files.map((file) =>
    Cloudinary.uploader.upload(file.path, {
      folder: "products",
      resource_type: "image",
    })
  );

  const results = await Promise.allSettled(uploadPromises);
  const uploadedUrls = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value.secure_url);
  const failedUpload = results.find((result) => result.status === "rejected");

  if (failedUpload) {
    await deleteImagesFromCloudinary(uploadedUrls);
    throw failedUpload.reason;
  }

  return uploadedUrls;
};

/**
 * Delete an array of Cloudinary URLs.
 */
const deleteImagesFromCloudinary = async (urls) => {
  const deletePromises = urls
    .filter((url) => typeof url === "string" && url.includes("cloudinary"))
    .map((url) => {
      const publicId = extractPublicId(url);
      if (publicId) return Cloudinary.uploader.destroy(publicId);
      return Promise.resolve();
    });

  await Promise.allSettled(deletePromises);
};

/**
 * Remove temporary files that multer wrote to disk.
 */
const cleanupTempFiles = async (files = []) => {
  await Promise.allSettled(files.map((file) => fs.unlink(file.path)));
};

/**
 * Safely parse a JSON string or return the value as-is if already parsed.
 */
const safeParse = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

// Only accept editable product fields; both JSON and multipart requests use this mapping.
const getProductFields = (body) => {
  const fields = {};

  for (const key of ["name", "description", "categoryId"]) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  if (body.basePrice !== undefined) fields.basePrice = Number(body.basePrice);
  for (const key of ["sizes", "colors"]) {
    if (body[key] !== undefined) fields[key] = safeParse(body[key]) || [];
  }
  for (const key of ["isAvailable", "hasDiscountPrice"]) {
    if (body[key] !== undefined) fields[key] = safeParse(body[key]);
  }

  return fields;
};

const handleProductError = (res, error, action) => {
  if (error.name === "CastError" || error.name === "ValidationError") {
    return res.status(400).json({ error: "Invalid product data" });
  }
  console.error(`${action} error:`, error);
  return res.status(500).json({ error: "Internal server error" });
};

export const createProduct = async (req, res) => {
  let uploadedImages = [];
  try {
    const { name, categoryId, basePrice } = req.body;

    if (!name || !categoryId || basePrice === undefined) {
      return res.status(400).json({
        error: "name, categoryId, and basePrice are required",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: "At least one product image is required",
      });
    }

    try {
      uploadedImages = await uploadImagesToCloudinary(req.files);
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload images" });
    }

    const product = new Product({
      userId: req.user._id,
      ...getProductFields(req.body),
      description: req.body.description || "",
      images: uploadedImages,
    });

    await product.save();
    uploadedImages = [];

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    await deleteImagesFromCloudinary(uploadedImages);
    return handleProductError(res, error, "createProduct");
  } finally {
    await cleanupTempFiles(req.files);
  }
};

export const updateProduct = async (req, res) => {
  let uploadedImages = [];
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const updates = getProductFields(req.body);

    const removedImages = safeParse(req.body.removedImages) || [];
    if (
      !Array.isArray(removedImages) ||
      removedImages.some((url) => typeof url !== "string")
    ) {
      return res.status(400).json({
        error: "removedImages must be an array of image URLs",
      });
    }
    const imagesToRemove = product.images.filter((url) => removedImages.includes(url));
    const retainedImages = product.images.filter((url) => !removedImages.includes(url));

    if (retainedImages.length === 0 && !req.files?.length) {
      return res.status(400).json({ error: "Product must have at least one image" });
    }

    if (req.files && req.files.length > 0) {
      try {
        uploadedImages = await uploadImagesToCloudinary(req.files);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload new images" });
      }
    }

    updates.images = [...retainedImages, ...uploadedImages];

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updatedProduct) {
      await deleteImagesFromCloudinary(uploadedImages);
      return res.status(404).json({ error: "Product not found" });
    }
    uploadedImages = [];

    // Delete old images only after the database references their replacements.
    await deleteImagesFromCloudinary(imagesToRemove);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    await deleteImagesFromCloudinary(uploadedImages);
    return handleProductError(res, error, "updateProduct");
  } finally {
    await cleanupTempFiles(req.files);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await Product.findByIdAndDelete(id);

    if (product.images && product.images.length > 0) {
      await deleteImagesFromCloudinary(product.images);
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return handleProductError(res, error, "deleteProduct");
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const {
      categoryId,
      search,
      minPrice,
      maxPrice,
      isAvailable,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (categoryId) filter.categoryId = categoryId;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === "true";
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = ["createdAt", "basePrice", "name"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name image")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
        limit: limitNum,
      },
    });
  } catch (error) {
    return handleProductError(res, error, "getAllProducts");
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("categoryId", "name image")
      .populate("userId", "fullname imageUrl")
      .lean();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return handleProductError(res, error, "getProductById");
  }
};
