import { getAuth } from "@clerk/express";
import User from "../modal/user.modal.js";

export const protectRoute = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  } catch (error) {
    console.error("protectRoute error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// admin protect route: only admin can access, delete, or update
export const adminProtectRoute = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const checkUser = await User.findOne({ clerkId: auth.userId });
    if (!checkUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (checkUser.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = checkUser;
    next();
  } catch (error) {
    console.error("adminProtectRoute error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
