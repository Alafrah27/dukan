import express from "express";
import {
  createOffer,
  getOffers,
  getActiveOffers,
  getOfferById,
  updateOffer,
  toggleOfferStatus,
  deleteOffer,
} from "../controller/offer.controller.js";
import {
  protectRoute,
  adminProtectRoute,
} from "../middleware/usermiddleware.js";

const router = express.Router();

// Public routes
router.get("/active", getActiveOffers);
router.get("/", getOffers);
router.get("/:offerId", getOfferById);

// Admin-only management routes
router.post("/", protectRoute, adminProtectRoute, createOffer);
router.put("/:offerId", protectRoute, adminProtectRoute, updateOffer);
router.patch("/:offerId/toggle", protectRoute, adminProtectRoute, toggleOfferStatus);
router.delete("/:offerId", protectRoute, adminProtectRoute, deleteOffer);

export default router;
