import { getAuth } from "@clerk/express";
import Product from "../modal/products.modal.js";
import User from "../modal/user.modal.js";
import Cloudinary from "../lib/cloudinary.js";
import fs from "fs/promises";

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

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

  const results = await Promise.all(uploadPromises);
  return results.map((r) => r.secure_url);
};

/**
 * Delete an array of Cloudinary URLs.
 */
const deleteImagesFromCloudinary = async (urls) => {
  const deletePromises = urls
    .filter((url) => url && url.includes("cloudinary"))
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
const cleanupTempFiles = async (files) => {
  if (!files || files.length === 0) return;
  await Promise.allSettled(
    files.map((file) => fs.unlink(file.path).catch(() => {}))
  );
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

// ──────────────────────────────────────────────
//  CREATE PRODUCT  (POST /api/v1/products)
//  Admin only — multipart/form-data
// ──────────────────────────────────────────────
export const createProduct = async (req, res) => {
  try {
    const { name, description, categoryId, basePrice, sizes, colors, isAvailable, hasDiscountPrice } = req.body;

    // ── Validation ──
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

    // ── Upload images to Cloudinary ──
    let imageUrls;
    try {
      imageUrls = await uploadImagesToCloudinary(req.files);
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload images" });
    }

    // ── Build product document ──
    const product = new Product({
      userId: req.user._id,
      categoryId,
      name,
      description: description || "",
      images: imageUrls,
      sizes: safeParse(sizes) || [],
      colors: safeParse(colors) || [],
      basePrice: Number(basePrice),
      isAvailable: isAvailable !== undefined ? safeParse(isAvailable) : true,
      hasDiscountPrice: hasDiscountPrice !== undefined ? safeParse(hasDiscountPrice) : false,
    });

    await product.save();

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("createProduct error:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    await cleanupTempFiles(req.files);
  }
};

// ──────────────────────────────────────────────
//  UPDATE PRODUCT  (PUT /api/v1/products/:id)
//  Admin only — multipart/form-data
// ──────────────────────────────────────────────
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      categoryId,
      basePrice,
      sizes,
      colors,
      isAvailable,
      hasDiscountPrice,
      removedImages, // JSON array of Cloudinary URLs to remove
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // ── Build updates ──
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (basePrice !== undefined) updates.basePrice = Number(basePrice);
    if (sizes !== undefined) updates.sizes = safeParse(sizes) || [];
    if (colors !== undefined) updates.colors = safeParse(colors) || [];
    if (isAvailable !== undefined) updates.isAvailable = safeParse(isAvailable);
    if (hasDiscountPrice !== undefined) updates.hasDiscountPrice = safeParse(hasDiscountPrice);

    // ── Handle image changes ──
    let currentImages = [...product.images];

    // 1. Remove images the admin wants to delete
    const imagesToRemove = safeParse(removedImages) || [];
    if (imagesToRemove.length > 0) {
      await deleteImagesFromCloudinary(imagesToRemove);
      currentImages = currentImages.filter((img) => !imagesToRemove.includes(img));
    }

    // 2. Upload newly added images
    if (req.files && req.files.length > 0) {
      try {
        const newUrls = await uploadImagesToCloudinary(req.files);
        currentImages = [...currentImages, ...newUrls];
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload new images" });
      }
    }

    updates.images = currentImages;

    // ── Ensure at least one image remains ──
    if (updates.images.length === 0) {
      return res.status(400).json({
        error: "Product must have at least one image",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("updateProduct error:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    await cleanupTempFiles(req.files);
  }
};

// ──────────────────────────────────────────────
//  DELETE PRODUCT  (DELETE /api/v1/products/:id)
//  Admin only
// ──────────────────────────────────────────────
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete all Cloudinary images
    if (product.images && product.images.length > 0) {
      await deleteImagesFromCloudinary(product.images);
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("deleteProduct error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ──────────────────────────────────────────────
//  GET ALL PRODUCTS  (GET /api/v1/products)
//  Public — with filtering, search, pagination
// ──────────────────────────────────────────────
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

    // ── Build filter ──
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

    // ── Pagination ──
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // ── Sort ──
    const allowedSortFields = ["createdAt", "basePrice", "name"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    // ── Query ──
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
    console.error("getAllProducts error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ──────────────────────────────────────────────
//  GET SINGLE PRODUCT  (GET /api/v1/products/:id)
//  Public
// ──────────────────────────────────────────────
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
    console.error("getProductById error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
