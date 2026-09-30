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
    return { ...this.defaultOrigin };
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
        status: "active",
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
    const finalOrigin = { ...this.defaultOrigin, ...origin };

    if (!destination || !destination.countryCode) {
      throw new Error("بيانات الوجهة غير مكتملة: رمز الدولة مطلوب لحساب قيمة الشحن");
    }

    // If a specific provider is requested
    if (provider) {
      const selectedProvider = this.providers[provider.toLowerCase()];
      if (!selectedProvider) {
        throw new Error(`مزود الشحن ${provider} غير مدعوم حالياً`);
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
    const quotePromises = Object.values(this.providers).map(async (p) => {
      try {
        return await p.calculateRate({
          origin: finalOrigin,
          destination,
          packageDetails,
          currency,
        });
      } catch (err) {
        console.error(`Error calculating rate for ${p.name}:`, err.message);
        return null;
      }
    });

    const results = await Promise.all(quotePromises);
    return results.filter(Boolean);
  }
}

export default new ShippingService();
