import express from "express";
import {
  calculateShippingRate,
  getShippingProviders,
  getShippingOrigin,
  getShippingCountries,
} from "../controller/shipping.controller.js";

const router = express.Router();

// Calculate shipping rate for cart/checkout
router.post("/calculate-rate", calculateShippingRate);

// Get list of supported providers
router.get("/providers", getShippingProviders);

// Get default fulfillment origin
router.get("/origin", getShippingOrigin);

// Get list of supported countries via Aramex lookup
router.get("/countries", getShippingCountries);

export default router;
