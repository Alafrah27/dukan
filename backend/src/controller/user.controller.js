import { clerkClient, getAuth } from "@clerk/express";
import User from "../modal/user.modal.js"; // Note: verify if folder name is model or modal

export const createUser = async (req, res) => {
  try {
    const auth = getAuth(req);

    const { userId } = auth;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Match your database document lookup key safely to the schema identifier
    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);

      user = new User({
        clerkId: userId,
        fullname:
          clerkUser.fullName || `${clerkUser.firstName} ${clerkUser.lastName}`,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        imageUrl: clerkUser.imageUrl,
        role: clerkUser.publicMetadata?.role || "user",
      });

      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "User context validated successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 5);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const search = req.query.search || "";
    const role = req.query.role || "";
    const auth = getAuth(req);
    const { userId } = auth;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const query = {};

    if (search) {
      query.$or = [
        { fullname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        limit,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    try {
      if (deletedUser.clerkId) {
        await clerkClient.users.deleteUser(deletedUser.clerkId);
      }
    } catch (clerkErr) {
      console.error("Clerk delete error:", clerkErr.message);
    }
    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const auth = getAuth(req);
    const { userId } = auth;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, error: "Role is required" });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Also update role in Clerk publicMetadata
    try {
      if (user.clerkId) {
        await clerkClient.users.updateUser(user.clerkId, {
          publicMetadata: { role },
        });
      }
    } catch (clerkErr) {
      console.error("Clerk role update error:", clerkErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

