import axios from "axios";

// Arabic country name mapping for Aramex country codes
const ARABIC_COUNTRY_NAMES = {
  SA: "المملكة العربية السعودية",
  AE: "الإمارات العربية المتحدة",
  KW: "الكويت",
  BH: "البحرين",
  QA: "قطر",
  OM: "عُمان",
  EG: "جمهورية مصر العربية",
  JO: "المملكة الأردنية الهاشمية",
  SD: "السودان",
  IQ: "العراق",
  LB: "لبنان",
  YE: "اليمن",
  MA: "المغرب",
  TN: "تونس",
  DZ: "الجزائر",
  LY: "ليبيا",
  SY: "سوريا",
  PS: "فلسطين",
  MR: "موريتانيا",
  SO: "الصومال",
  DJ: "جيبوتي",
  KM: "جزر القمر",
  TR: "تركيا",
  GB: "المملكة المتحدة",
  US: "الولايات المتحدة الأمريكية",
  DE: "ألمانيا",
  FR: "فرنسا",
  IT: "إيطاليا",
  ES: "إسبانيا",
  NL: "هولندا",
  CA: "كندا",
  AU: "أستراليا",
  IN: "الهند",
  PK: "باكستان",
  CN: "الصين",
  JP: "اليابان",
  KR: "كوريا الجنوبية",
  MY: "ماليزيا",
  ID: "إندونيسيا",
  SG: "سنغافورة",
  CH: "سويسرا",
  SE: "السويد",
  BE: "بلجيكا",
  AT: "النمسا",
  BR: "البرازيل",
  ZA: "جنوب أفريقيا",
  ET: "إثيوبيا",
  NG: "نيجيريا",
  KE: "كينيا",
  RU: "روسيا",
  PH: "الفلبين",
  TH: "تايلاند",
  BD: "بنغلاديش",
  LK: "سريلانكا",
  NZ: "نيوزيلندا",
  IE: "أيرلندا",
  NO: "النرويج",
  DK: "الدنمارك",
  GR: "اليونان",
  PT: "البرتغال",
  PL: "بولندا",
};

const GCC_CODES = new Set(["SA", "AE", "KW", "BH", "QA", "OM"]);
const ARAB_CODES = new Set([
  "EG",
  "JO",
  "SD",
  "IQ",
  "LB",
  "YE",
  "MA",
  "TN",
  "DZ",
  "LY",
  "SY",
  "PS",
  "MR",
  "SO",
  "DJ",
  "KM",
]);

const getCountryZone = (code) => {
  if (GCC_CODES.has(code)) return "gcc";
  if (ARAB_CODES.has(code)) return "arab";
  return "international";
};

// Reference countries for address entry; service availability is verified by CalculateRate
const FALLBACK_COUNTRIES = Object.entries(ARABIC_COUNTRY_NAMES).map(
  ([code, nameAr]) => {
    return {
      code,
      nameAr,
      nameEn: code,
      zone: getCountryZone(code),
    };
  },
);

class AramexShippingProvider {
  constructor() {
    this.name = "aramex";
    this.displayName = "Aramex Express";
    this.cachedCountries = null;
    this.cacheExpiry = 0;
  }

  /**
   * Get Aramex Client Configuration from environment
   */
  getConfig() {
    const isLive = process.env.ARAMEX_ENV === "live";
    const baseUrl = isLive
      ? "https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json"
      : "https://ws.dev.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json";

    const locationBaseUrl = isLive
      ? "https://ws.aramex.net/ShippingAPI.V2/Location/Service_1_0.svc/json"
      : "https://ws.dev.aramex.net/ShippingAPI.V2/Location/Service_1_0.svc/json";

    return {
      baseUrl,
      locationBaseUrl,
      clientInfo: {
        UserName: process.env.ARAMEX_USER_NAME || "",
        Password: process.env.ARAMEX_PASSWORD || "",
        Version: "v1.0",
        AccountNumber: process.env.ARAMEX_ACCOUNT_NUMBER || "",
        AccountPin: process.env.ARAMEX_ACCOUNT_PIN || "",
        AccountEntity: process.env.ARAMEX_ACCOUNT_ENTITY || "RUH",
        AccountCountryCode: process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || "SA",
      },
    };
  }

  /**
   * Check whether live Aramex credentials are fully configured
   */
  isConfigured() {
    const { clientInfo } = this.getConfig();
    return Boolean(
      clientInfo.UserName &&
      clientInfo.Password &&
      clientInfo.AccountNumber &&
      clientInfo.AccountPin,
    );
  }

  /**
   * Fetch supported countries from Aramex Location API with caching and fallback
   */
  async fetchCountries() {
    const now = Date.now();
    if (this.cachedCountries && now < this.cacheExpiry) {
      return this.cachedCountries;
    }

    const { locationBaseUrl, clientInfo } = this.getConfig();

    if (clientInfo.UserName && clientInfo.Password) {
      try {
        const response = await axios.post(
          `${locationBaseUrl}/FetchCountries`,
          {
            ClientInfo: clientInfo,
            Transaction: null,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            timeout: 6000,
          },
        );

        if (
          response.data &&
          !response.data.HasErrors &&
          Array.isArray(response.data.Countries) &&
          response.data.Countries.length > 0
        ) {
          const countries = response.data.Countries.map((c) => ({
            code: c.Code,
            nameEn: c.Name,
            nameAr: ARABIC_COUNTRY_NAMES[c.Code] || c.Name,
            isoCode: c.IsoCode || c.Code,
            stateRequired: Boolean(c.StateRequired),
            postCodeRequired: Boolean(c.PostCodeRequired),
            zone: getCountryZone(c.Code),
          }));

          // Sort alphabetically by Arabic name
          countries.sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));

          this.cachedCountries = countries;
          this.cacheExpiry = now + 24 * 60 * 60 * 1000; // 24 hours
          return countries;
        }
      } catch (err) {
        console.warn("Aramex FetchCountries API warning:", err.message);
      }
    }

    // Comprehensive fallback if API credentials need activation or dev endpoint times out
    const countries = [...FALLBACK_COUNTRIES].sort((a, b) =>
      a.nameAr.localeCompare(b.nameAr, "ar"),
    );
    this.cachedCountries = countries;
    this.cacheExpiry = now + 6 * 60 * 60 * 1000;
    return countries;
  }

  /** Get a real quote from Aramex. Carrier errors must never become made-up prices. */
  async calculateRate({
    origin = {},
    destination = {},
    packageDetails = {},
    currency = "SAR",
  }) {
    const invalid = (message) => {
      throw Object.assign(new Error(message), { status: 400 });
    };
    for (const value of [origin, destination, packageDetails]) {
      if (!value || typeof value !== "object" || Array.isArray(value))
        invalid("بيانات العنوان أو الطرد غير صالحة");
    }
    const text = (value, field, required = false) => {
      if (value === undefined) value = "";
      if (typeof value !== "string") invalid(field + " غير صالح");
      const result = value.trim();
      if (required && !result) invalid(field + " مطلوب");
      return result;
    };
    const countryCode = (value) => {
      const code = text(value, "رمز الدولة", true).toUpperCase();
      if (!/^[A-Z]{2}$/.test(code))
        invalid("يرجى إدخال رمز الدولة المكون من حرفين");
      return code;
    };
    const address = (value) => ({
      Line1: text(value.addressLine1, "الشارع"),
      Line2: text(value.addressLine2, "العنوان"),
      Line3: "",
      City: text(value.city, "المدينة", true),
      StateOrProvinceCode: text(value.stateOrProvinceCode, "الولاية"),
      PostCode: text(value.postalCode, "الرمز البريدي"),
      CountryCode: countryCode(value.countryCode),
    });
    const originAddress = address(origin);
    const destinationAddress = address(destination);
    const preferredCurrency = text(currency, "العملة", true).toUpperCase();
    if (!/^[A-Z]{3}$/.test(preferredCurrency)) invalid("رمز العملة غير صالح");
    const positiveNumber = (value, field) => {
      if (
        !["string", "number"].includes(typeof value) ||
        !Number.isFinite(Number(value)) ||
        Number(value) <= 0
      )
        invalid(field + " يجب أن يكون رقماً موجباً");
      return Number(value);
    };
    const weightUnit = text(
      packageDetails.weightUnit ?? "KG",
      "وحدة الوزن",
    ).toUpperCase();
    if (!["KG", "LB"].includes(weightUnit))
      invalid("وحدة الوزن يجب أن تكون KG أو LB");
    const weight =
      positiveNumber(
        packageDetails.weight === undefined ? 1 : packageDetails.weight,
        "الوزن",
      ) * (weightUnit === "LB" ? 0.45359237 : 1);
    const numberOfPieces = positiveNumber(
      packageDetails.numberOfPieces === undefined
        ? 1
        : packageDetails.numberOfPieces,
      "عدد القطع",
    );
    if (!Number.isSafeInteger(numberOfPieces) || numberOfPieces > 2147483647)
      invalid("عدد القطع يجب أن يكون عدداً صحيحاً موجباً");
    const dimensionValues = [
      packageDetails.length,
      packageDetails.width,
      packageDetails.height,
    ];
    let dimensions = null;
    // Existing calculators send zeroes to mean no dimensions were supplied.
    if (!dimensionValues.every((value) => value === undefined || value === 0 || value === "0")) {
      const unit = text(
        packageDetails.dimensionUnit ?? "CM",
        "وحدة الأبعاد",
      ).toUpperCase();
      if (!["CM", "IN"].includes(unit))
        invalid("وحدة الأبعاد يجب أن تكون CM أو IN");
      const [Length, Width, Height] = dimensionValues.map((value) =>
        positiveNumber(value, "أبعاد الطرد"),
      );
      dimensions = { Length, Width, Height, Unit: unit };
    }
    const isDomestic =
      originAddress.CountryCode === destinationAddress.CountryCode;
    if (
      packageDetails.shipmentType !== undefined &&
      !["parcel", "document"].includes(packageDetails.shipmentType)
    )
      invalid("نوع الشحنة غير صالح");
    if (
      packageDetails.isDocument !== undefined &&
      typeof packageDetails.isDocument !== "boolean"
    )
      invalid("نوع الشحنة غير صالح");
    const isDocument =
      packageDetails.shipmentType === "document" ||
      packageDetails.isDocument === true;
    const productGroup = isDomestic ? "DOM" : "EXP";
    const productType = text(
      packageDetails.productType ??
        (isDomestic
          ? "OND"
          : isDocument
            ? "PDX"
            : packageDetails.preferEconomy
              ? "EPX"
              : "PPX"),
      "نوع الخدمة",
      true,
    ).toUpperCase();
    if (!/^[A-Z]{3}$/.test(productType)) invalid("نوع الخدمة غير صالح");
    if (!["dev", "live"].includes(process.env.ARAMEX_ENV || "dev")) {
      throw Object.assign(new Error("إعداد بيئة أرامكس غير صالح"), {
        status: 503,
        code: "ARAMEX_NOT_CONFIGURED",
      });
    }
    if (!this.isConfigured()) {
      throw Object.assign(
        new Error("خدمة الشحن غير متاحة حالياً، يرجى المحاولة لاحقاً"),
        { status: 503, code: "ARAMEX_NOT_CONFIGURED" },
      );
    }
    const { baseUrl, clientInfo } = this.getConfig();
    let data;
    try {
      const response = await axios.post(
        baseUrl + "/CalculateRate",
        {
          ClientInfo: clientInfo,
          Transaction: { Reference1: "Dukan shipping rate" },
          OriginAddress: originAddress,
          DestinationAddress: destinationAddress,
          ShipmentDetails: {
            Dimensions: dimensions,
            ActualWeight: { Unit: "KG", Value: weight },
            ChargeableWeight: null,
            DescriptionOfGoods: isDocument ? "Documents" : "Goods / Clothing",
            GoodsOriginCountry: null,
            NumberOfPieces: numberOfPieces,
            ProductGroup: productGroup,
            ProductType: productType,
            PaymentType: "P",
            PaymentOptions: "",
            CustomsValueAmount: null,
            CashOnDeliveryAmount: null,
            InsuranceAmount: null,
            CashAdditionalAmount: null,
            CollectAmount: null,
            Services: "",
          },
          PreferredCurrencyCode: preferredCurrency,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
        },
      );
      data = response.data;
    } catch (error) {
      // Axios errors contain the request body and credentials. Never expose or log them.
      const isTimeout = ["ECONNABORTED", "ETIMEDOUT"].includes(error.code);
      throw Object.assign(
        new Error(
          isTimeout
            ? "انتهت مهلة طلب الشحن، يرجى المحاولة مجدداً"
            : "تعذر الاتصال بأرامكس، يرجى المحاولة لاحقاً",
        ),
        {
          status: isTimeout ? 504 : 502,
          code: "ARAMEX_UNAVAILABLE",
        },
      );
    }
    if (data?.HasErrors === true) {
      throw Object.assign(
        new Error(
          "تعذر احتساب الشحن عبر أرامكس، يرجى التحقق من الدولة والمدينة والرمز البريدي والولاية أو التواصل مع المتجر",
        ),
        {
          status: 422,
          code: "ARAMEX_RATE_REJECTED",
        },
      );
    }
    const amount = data?.TotalAmount;
    const price = ["number", "string"].includes(typeof amount?.Value)
      ? Number(amount.Value)
      : NaN;
    if (
      data?.HasErrors !== false ||
      !Number.isFinite(price) ||
      price <= 0 ||
      typeof amount?.CurrencyCode !== "string" ||
      amount.CurrencyCode.toUpperCase() !== preferredCurrency
    ) {
      throw Object.assign(
        new Error("تعذر الحصول على سعر شحن صالح بالعملة المطلوبة"),
        { status: 502, code: "ARAMEX_INVALID_RESPONSE" },
      );
    }
    const serviceNames = {
      OND: "Aramex Domestic Express",
      PPX: "Aramex Priority Parcel Express",
      EPX: "Aramex Economy Parcel Express",
      PDX: "Aramex Priority Document Express",
      DOX: "Aramex Document Express",
    };
    return {
      success: true,
      carrier: this.name,
      carrierName: this.displayName,
      service: productType,
      serviceName: serviceNames[productType] || "Aramex " + productType,
      productGroup,
      productType,
      shipmentType: isDocument ? "document" : "parcel",
      price,
      currency: preferredCurrency,
      rateDetails: data.RateDetails || null,
      estimatedDays: null,
      isLiveQuote: true,
      isEstimated: false,
      isSandbox: process.env.ARAMEX_ENV !== "live",
      origin: {
        countryCode: originAddress.CountryCode,
        city: originAddress.City,
      },
      destination: {
        countryCode: destinationAddress.CountryCode,
        city: destinationAddress.City,
      },
      weight,
      weightUnit: "KG",
      numberOfPieces,
    };
  }
}

export default new AramexShippingProvider();
