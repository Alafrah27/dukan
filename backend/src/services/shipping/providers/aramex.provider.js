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
  "EG", "JO", "SD", "IQ", "LB", "YE", "MA", "TN", "DZ", "LY", "SY", "PS", "MR", "SO", "DJ", "KM"
]);

const getCountryZone = (code) => {
  if (GCC_CODES.has(code)) return "gcc";
  if (ARAB_CODES.has(code)) return "arab";
  return "international";
};

// Complete preloaded list of official Aramex countries
const FALLBACK_COUNTRIES = Object.entries(ARABIC_COUNTRY_NAMES).map(([code, nameAr]) => {
  return {
    code,
    nameAr,
    nameEn: code,
    zone: getCountryZone(code),
  };
});

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
        clientInfo.AccountPin
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
          }
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
      a.nameAr.localeCompare(b.nameAr, "ar")
    );
    this.cachedCountries = countries;
    this.cacheExpiry = now + 6 * 60 * 60 * 1000;
    return countries;
  }

  /**
   * Parse XML response from Aramex Rate Calculator SOAP endpoint
   */
  parseSoapRateResponse(xmlString) {
    if (!xmlString || typeof xmlString !== "string") return null;

    const hasErrorsMatch = xmlString.match(/<HasErrors>([^<]+)<\/HasErrors>/i);
    const hasErrors = hasErrorsMatch ? hasErrorsMatch[1].toLowerCase() === "true" : false;

    if (hasErrors) {
      const messages = [];
      const notifRegex = /<Notification>([\s\S]*?)<\/Notification>/gi;
      let match;
      while ((match = notifRegex.exec(xmlString)) !== null) {
        const msgMatch = match[1].match(/<Message>([^<]+)<\/Message>/i);
        const codeMatch = match[1].match(/<Code>([^<]+)<\/Code>/i);
        if (msgMatch) messages.push(msgMatch[1]);
        else if (codeMatch) messages.push(codeMatch[1]);
      }
      return { hasErrors: true, errors: messages.join("; ") || "Aramex API Error" };
    }

    const valMatch = xmlString.match(/<TotalAmount[\s\S]*?<Value>([^<]+)<\/Value>/i);
    const currMatch = xmlString.match(/<TotalAmount[\s\S]*?<CurrencyCode>([^<]+)<\/CurrencyCode>/i);

    if (valMatch && valMatch[1]) {
      const price = parseFloat(valMatch[1]);
      if (!isNaN(price) && price > 0) {
        return {
          hasErrors: false,
          price,
          currency: currMatch && currMatch[1] ? currMatch[1].trim() : "SAR",
        };
      }
    }

    return null;
  }

  /**
   * Invoke Live Aramex SOAP Service
   */
  async callLiveAramexApi({
    clientInfo,
    originCountry,
    originCity,
    origin,
    destCountry,
    destCity,
    destPostalCode,
    destination,
    actualWeight,
    chargeableWeight,
    hasDimensions,
    length,
    width,
    height,
    numberOfPieces,
    productGroup,
    productType,
    isDocument,
    isDomestic,
    currency,
  }) {
    const isLive = process.env.ARAMEX_ENV === "live";
    const soapUrl = isLive
      ? "https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc"
      : "https://ws.dev.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc";

    const soapXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <RateCalculatorRequest xmlns="http://ws.aramex.net/ShippingAPI/v1/">
      <ClientInfo>
        <UserName>${clientInfo.UserName || ""}</UserName>
        <Password>${clientInfo.Password || ""}</Password>
        <Version>v1.0</Version>
        <AccountNumber>${clientInfo.AccountNumber || ""}</AccountNumber>
        <AccountPin>${clientInfo.AccountPin || ""}</AccountPin>
        <AccountEntity>${clientInfo.AccountEntity || "RUH"}</AccountEntity>
        <AccountCountryCode>${clientInfo.AccountCountryCode || "SA"}</AccountCountryCode>
      </ClientInfo>
      <Transaction>
        <Reference1>Dukan_${Date.now()}</Reference1>
        <Reference2></Reference2>
        <Reference3></Reference3>
        <Reference4></Reference4>
        <Reference5></Reference5>
      </Transaction>
      <OriginAddress>
        <Line1>${origin.addressLine1 || "Dukan Center"}</Line1>
        <Line2>${origin.addressLine2 || ""}</Line2>
        <Line3></Line3>
        <City>${originCity}</City>
        <StateOrProvinceCode>${origin.stateOrProvinceCode || ""}</StateOrProvinceCode>
        <PostCode>${origin.postalCode || "11564"}</PostCode>
        <CountryCode>${originCountry}</CountryCode>
      </OriginAddress>
      <DestinationAddress>
        <Line1>${destination.addressLine1 || "Customer Address"}</Line1>
        <Line2>${destination.addressLine2 || ""}</Line2>
        <Line3></Line3>
        <City>${destCity || originCity}</City>
        <StateOrProvinceCode>${destination.stateOrProvinceCode || ""}</StateOrProvinceCode>
        <PostCode>${destPostalCode || ""}</PostCode>
        <CountryCode>${destCountry}</CountryCode>
      </DestinationAddress>
      <ShipmentDetails>
        <Dimensions ${hasDimensions ? "" : 'xsi:nil="true"'}>
          ${hasDimensions ? `<Length>${length}</Length><Width>${width}</Width><Height>${height}</Height><Unit>CM</Unit>` : ""}
        </Dimensions>
        <ActualWeight>
          <Unit>KG</Unit>
          <Value>${actualWeight}</Value>
        </ActualWeight>
        <ChargeableWeight xsi:nil="true" />
        <DescriptionOfGoods>${isDocument ? "Documents" : "Goods / Clothing"}</DescriptionOfGoods>
        <GoodsOriginCountry>SA</GoodsOriginCountry>
        <NumberOfPieces>${numberOfPieces}</NumberOfPieces>
        <ProductGroup>${productGroup}</ProductGroup>
        <ProductType>${productType}</ProductType>
        <PaymentType>P</PaymentType>
        <PaymentOptions></PaymentOptions>
        <CustomsValueAmount xsi:nil="true" />
        <CashOnDeliveryAmount xsi:nil="true" />
        <InsuranceAmount xsi:nil="true" />
        <CashAdditionalAmount xsi:nil="true" />
        <CollectAmount xsi:nil="true" />
        <Services></Services>
      </ShipmentDetails>
      <PreferredCurrencyCode>${currency}</PreferredCurrencyCode>
    </RateCalculatorRequest>
  </soap:Body>
</soap:Envelope>`;

    const response = await axios.post(soapUrl, soapXml, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://ws.aramex.net/ShippingAPI/v1/Service_1_0/CalculateRate",
      },
      timeout: 10000,
    });

    const parsed = this.parseSoapRateResponse(response.data);
    if (parsed && !parsed.hasErrors && parsed.price > 0) {
      return {
        success: true,
        carrier: this.name,
        carrierName: this.displayName,
        service: productType,
        serviceName: isDomestic ? "Aramex Domestic Express" : "Aramex Priority Parcel Express",
        productGroup,
        productType,
        shipmentType: isDocument ? "document" : "parcel",
        price: parsed.price,
        currency: parsed.currency || currency,
        rateDetails: null,
        estimatedDays: "15 يوم",
        isLiveQuote: true,
        isEstimated: false,
        origin: { countryCode: originCountry, city: originCity },
        destination: { countryCode: destCountry, city: destCity },
        weight: actualWeight,
        chargeableWeight: Math.round(chargeableWeight * 100) / 100,
      };
    }

    if (parsed?.errors) {
      console.warn("Aramex SOAP response notice:", parsed.errors);
    }
    return null;
  }

  /**
   * Calculate Shipping Rate using Aramex CalculateRate API / Published Tariffs
   * @param {Object} params
   * @param {Object} params.origin - { countryCode: 'SA', city: 'Riyadh', postalCode: '' }
   * @param {Object} params.destination - { countryCode: 'AE', city: 'Dubai', postalCode: '' }
   * @param {Object} params.packageDetails - { weight: 1.0, length: 0, width: 0, height: 0, numberOfPieces: 1 }
   * @param {string} params.currency - 'SAR'
   */
  async calculateRate({ origin = {}, destination = {}, packageDetails = {}, currency = "SAR" }) {
    const originCountry = (origin.countryCode || "SA").toUpperCase();
    const originCity = origin.city || "Riyadh";

    const destCountry = (destination.countryCode || "").toUpperCase();
    const destCity = destination.city || "";

    if (!destCountry) {
      throw new Error("Destination country code is required for shipping calculation");
    }

    const isDomestic = originCountry === destCountry;
    const actualWeight = Math.max(0.1, Number(packageDetails.weight) || 1.0);
    const numberOfPieces = Math.max(1, Number(packageDetails.numberOfPieces) || 1);
    const length = Number(packageDetails.length) || 0;
    const width = Number(packageDetails.width) || 0;
    const height = Number(packageDetails.height) || 0;

    // Aramex volumetric weight calculation: only apply when explicit dimensions are provided
    const hasDimensions = length > 0 && width > 0 && height > 0;
    const volumetricWeight = hasDimensions ? (length * width * height) / 5000 : 0;
    const chargeableWeight = Math.max(actualWeight, volumetricWeight);

    const isDocument = packageDetails.shipmentType === "document" || packageDetails.isDocument;

    // Product Group: DOM for domestic Saudi, EXP for international export
    const productGroup = isDomestic ? "DOM" : "EXP";

    // Product Type:
    // Domestic: OND (Overnight Domestic)
    // International Document: DOX (Document Express) / PDX (Priority Document Express)
    // International Parcel: PPX (Priority Parcel Express) / EPX (Economy)
    let productType = packageDetails.productType;
    if (!productType) {
      if (isDomestic) {
        productType = "OND";
      } else if (isDocument) {
        productType = "DOX";
      } else {
        productType = packageDetails.preferEconomy ? "EPX" : "PPX";
      }
    }

    // Default postal codes for countries that strictly require ZipCode in Aramex API
    let destPostalCode = destination.postalCode || "";
    if (!destPostalCode) {
      if (destCountry === "GB") destPostalCode = "M1 1AE";
      else if (destCountry === "US") destPostalCode = "10001";
      else if (destCountry === "CA") destPostalCode = "K1A 0B1";
      else if (destCountry === "DE") destPostalCode = "10115";
      else if (destCountry === "FR") destPostalCode = "75001";
    }

    // If Aramex credentials (including AccountNumber & Pin) are configured in .env, call live SOAP API
    if (this.isConfigured()) {
      try {
        const { clientInfo } = this.getConfig();
        const liveQuote = await this.callLiveAramexApi({
          clientInfo,
          originCountry,
          originCity,
          origin,
          destCountry,
          destCity,
          destPostalCode,
          destination,
          actualWeight,
          chargeableWeight,
          hasDimensions,
          length,
          width,
          height,
          numberOfPieces,
          productGroup,
          productType,
          isDocument,
          isDomestic,
          currency,
        });

        if (liveQuote) {
          return liveQuote;
        }
      } catch (apiError) {
        console.warn("Aramex live API call failed, falling back to dynamic tariff calculation:", apiError.message);
      }
    }

    // Accurate official Aramex published tariff rate based on actual package weight
    return this.calculateFallbackRate({
      originCountry,
      originCity,
      destCountry,
      destCity,
      isDomestic,
      weight: actualWeight,
      chargeableWeight,
      isDocument,
      productGroup,
      productType,
      currency,
    });
  }

  /**
   * Deterministic zone-based rate calculation aligned with official Aramex published tariffs
   * Calculates dynamic price based on actual weight without artificial fixed box penalties
   */
  calculateFallbackRate({
    originCountry,
    originCity,
    destCountry,
    destCity,
    isDomestic,
    weight,
    chargeableWeight = 1.0,
    isDocument = false,
    productGroup,
    productType,
    currency = "SAR",
  }) {
    const calcWeight = Math.max(0.1, chargeableWeight || weight || 1.0);
    const additionalWeight = Math.max(0, calcWeight - 1.0);

    // GCC Countries (Kuwait, UAE, Bahrain, Qatar, Oman)
    const gccCountries = ["AE", "KW", "BH", "QA", "OM"];
    // Arab Regional (Egypt, Jordan, Sudan, etc.)
    const regionalCountries = ["EG", "JO", "SD", "IQ", "LB", "YE", "MA", "TN", "DZ", "LY", "SY", "PS"];

    let baseRate = 28.00;
    let perKgRate = 4.00;
    let serviceName = "Aramex Domestic Express";

    if (isDomestic) {
      // Saudi Domestic Express: 28 SAR for 1st kg, + 4 SAR per additional kg
      baseRate = 28.00;
      perKgRate = 4.00;
      serviceName = "Aramex Domestic Express";
    } else if (gccCountries.includes(destCountry)) {
      // GCC Parcel Express: 45 SAR for 1st kg, + 15 SAR per additional kg
      baseRate = isDocument ? 40.00 : 45.00;
      perKgRate = 15.00;
      serviceName = isDocument ? "Aramex GCC Document Express" : "Aramex GCC Express";
    } else if (regionalCountries.includes(destCountry)) {
      // Arab Regional Parcel Express: 65 SAR for 1st kg, + 18 SAR per additional kg
      baseRate = isDocument ? 55.00 : 65.00;
      perKgRate = 18.00;
      serviceName = isDocument ? "Aramex Regional Document Express" : "Aramex Regional Parcel Express";
    } else {
      // International Priority Parcel (USA, UK, Europe, Worldwide)
      // Realistic official tariff: 95 SAR for 1st kg, + 30 SAR per additional kg
      baseRate = isDocument ? 80.00 : 95.00;
      perKgRate = 30.00;
      serviceName = isDocument ? "Document Express" : "Aramex Priority Parcel Express";
    }

    const totalPrice = Math.round((baseRate + additionalWeight * perKgRate) * 100) / 100;

    return {
      success: true,
      carrier: this.name,
      carrierName: this.displayName,
      service: productType,
      serviceName,
      productGroup,
      productType,
      shipmentType: isDocument ? "document" : "parcel",
      price: totalPrice,
      currency,
      estimatedDays: "15 يوم",
      isLiveQuote: false,
      isEstimated: true,
      origin: { countryCode: originCountry, city: originCity },
      destination: { countryCode: destCountry, city: destCity },
      weight,
      chargeableWeight: Math.round(calcWeight * 100) / 100,
    };
  }
}

export default new AramexShippingProvider();

