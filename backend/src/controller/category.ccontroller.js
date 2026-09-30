import { getAuth } from "@clerk/express";
import Category from "../modal/category.modal.js";
import User from "../modal/user.modal.js";
import Cloudinary from "../lib/cloudinary.js";

export const createCategory = async (req, res) => {
  try {
    let imageurl;
    const { name, image } = req.body;
    if (!name || !image) {
      return res
        .status(400)
        .json({ error: "Please provide all the required fields" });
    }
    const auth = getAuth(req);
    const { userId } = auth;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const checkuser = await User.findOne({ clerkId: userId });
    if (!checkuser) {
      return res.status(404).json({ error: "User not found" });
    }

    //  upload image to cloundinary

    try {
      imageurl = await Cloudinary.uploader.upload(image, {
        folder: "category",
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to upload image" });
    }
    const category = new Category({
      userId: checkuser._id,
      name,
      image: imageurl.secure_url,
    });
    await category.save();
    return res.status(200).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, image } = req.body;
    if (!name && !image) {
      return res
        .status(400)
        .json({ error: "Please provide all the required fields" });
    }
    const auth = getAuth(req);
    const { userId } = auth;
    const updates = {};
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const checkuser = await User.findOne({ clerkId: userId });
    if (!checkuser) {
      return res.status(404).json({ error: "User not found" });
    }
    const checkcategory = await Category.findById(categoryId);
    if (!checkcategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (name) {
      updates.name = name;
    }
    if (image) {
      try {
        if (checkcategory.image && checkcategory.image.includes("cloudinary")) {
          const publicId = checkcategory.image.split("/").pop().split(".")[0];
          await Cloudinary.uploader.destroy(`category/${publicId}`);
        }
        const uploadreponse = await Cloudinary.uploader.upload(image, {
          folder: "category",
        });
        updates.image = uploadreponse.secure_url;
      } catch (error) {
        return res.status(500).json({ error: "Failed to upload image" });
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No changes provided" });
    }
    const updatecategory = await Category.findByIdAndUpdate(
      categoryId,
      updates,
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updatecategory,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Delete image from Cloudinary
    if (category.image && category.image.includes("cloudinary")) {
      const publicId = category.image.split("/").pop().split(".")[0];
      await Cloudinary.uploader.destroy(`category/${publicId}`);
    }

    await Category.findByIdAndDelete(categoryId);
    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
