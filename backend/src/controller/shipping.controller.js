import shippingService from "../services/shipping/shipping.service.js";

/**
 * Calculate Shipping Rates via Aramex / Providers
 * POST /api/v1/shipping/calculate-rate
 */
export const calculateShippingRate = async (req, res) => {
  try {
    const {
      origin,
      destination,
      packageDetails,
      currency = "SAR",
      provider,
    } = req.body;

    if (!destination || !destination.countryCode) {
      return res.status(400).json({
        success: false,
        error: "Missing Destination",
        message: "حقل الوجهة (destination.countryCode) مطلوب لحساب تكلفة الشحن",
      });
    }

    const quotes = await shippingService.getQuotes({
      origin,
      destination,
      packageDetails,
      currency,
      provider,
    });

    return res.status(200).json({
      success: true,
      message: "تم احتساب أسعار الشحن بنجاح",
      quotes,
    });
  } catch (error) {
    console.error("Shipping Rate Calculation Controller Error:", error);
    return res.status(500).json({
      success: false,
      error: "Shipping Calculation Failed",
      message: error.message || "حدث خطأ أثناء حساب تكلفة الشحن",
    });
  }
};

/**
 * Get Supported Shipping Carriers
 * GET /api/v1/shipping/providers
 */
export const getShippingProviders = async (req, res) => {
  try {
    const providers = shippingService.getProviders();
    return res.status(200).json({
      success: true,
      providers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * Get Default Shipping Fulfillment Origin
 * GET /api/v1/shipping/origin
 */
export const getShippingOrigin = async (req, res) => {
  try {
    const origin = shippingService.getDefaultOrigin();
    return res.status(200).json({
      success: true,
      origin,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

/**
 * Get Supported Shipping Countries via Aramex Lookup
 * GET /api/v1/shipping/countries
 */
export const getShippingCountries = async (req, res) => {
  try {
    const countries = await shippingService.getCountries();
    return res.status(200).json({
      success: true,
      count: countries.length,
      countries,
    });
  } catch (error) {
    console.error("Fetch Shipping Countries Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch countries",
      message: error.message || "فشل جلب قائمة الدول",
    });
  }
};
