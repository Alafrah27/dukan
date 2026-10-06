import aramexProvider from "./providers/aramex.provider.js";

class ShippingService {
  constructor() {
    this.providers = {
      aramex: aramexProvider,
    };

    // Default shipping fulfillment origin as defined in Dukan Architecture (Saudi Arabia)
    this.defaultOrigin = {
      countryCode: "SA",
      city: "Riyadh",
      stateOrProvinceCode: "Riyadh",
      postalCode: "",
      addressLine1: "Dukan Fulfillment Center",
    };
  }

  /**
   * Get default fulfillment origin
   */
  getDefaultOrigin() {
    return {
      ...this.defaultOrigin,
      city: process.env.ARAMEX_ORIGIN_CITY || this.defaultOrigin.city,
      stateOrProvinceCode: process.env.ARAMEX_ORIGIN_STATE || "",
      postalCode: process.env.ARAMEX_ORIGIN_POSTAL_CODE || "",
      addressLine1:
        process.env.ARAMEX_ORIGIN_ADDRESS_LINE1 ||
        this.defaultOrigin.addressLine1,
    };
  }

  /**
   * Get list of supported countries from Aramex lookup
   */
  async getCountries() {
    return await this.providers.aramex.fetchCountries();
  }

  /**
   * Get list of registered shipping carriers and status
   */
  getProviders() {
    return Object.keys(this.providers).map((key) => {
      const provider = this.providers[key];
      return {
        id: provider.name,
        name: provider.displayName,
        isConfigured: provider.isConfigured(),
        status: provider.isConfigured() ? "active" : "not_configured",
      };
    });
  }

  /**
   * Calculate quotes across available providers or a specific provider
   * @param {Object} options
   * @param {Object} [options.origin]
   * @param {Object} options.destination
   * @param {Object} [options.packageDetails]
   * @param {string} [options.currency='SAR']
   * @param {string} [options.provider] - optional carrier identifier (e.g. 'aramex')
   */
  async getQuotes({
    origin,
    destination,
    packageDetails = {},
    currency = "SAR",
    provider = null,
  }) {
    if (
      origin !== undefined &&
      (!origin || typeof origin !== "object" || Array.isArray(origin))
    ) {
      throw Object.assign(new Error("بيانات عنوان المرسل غير صالحة"), {
        status: 400,
      });
    }
    const finalOrigin = { ...this.getDefaultOrigin(), ...origin };

    if (!destination || !destination.countryCode) {
      throw Object.assign(
        new Error(
          "بيانات الوجهة غير مكتملة: رمز الدولة مطلوب لحساب قيمة الشحن",
        ),
        { status: 400 },
      );
    }

    // Querying all providers must preserve failures, rather than return an empty success.
    if (provider != null) {
      if (typeof provider !== "string") {
        throw Object.assign(new Error("مزود الشحن غير صالح"), { status: 400 });
      }
      const providerId = provider.trim().toLowerCase();
      const selectedProvider = Object.hasOwn(this.providers, providerId)
        ? this.providers[providerId]
        : null;
      if (!selectedProvider) {
        throw Object.assign(new Error("مزود الشحن غير مدعوم حالياً"), {
          status: 400,
        });
      }
      const quote = await selectedProvider.calculateRate({
        origin: finalOrigin,
        destination,
        packageDetails,
        currency,
      });
      return [quote];
    }

    // Query all active providers in parallel
    const quotePromises = Object.values(this.providers).map((p) =>
      p.calculateRate({
        origin: finalOrigin,
        destination,
        packageDetails,
        currency,
      }),
    );

    const results = await Promise.all(quotePromises);
    return results.filter(Boolean);
  }
}

export default new ShippingService();
