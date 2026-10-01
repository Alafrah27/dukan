import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "../local/ar.json";
import en from "../local/en.json";

const resources = {
  ar: { translation: ar },
  en: { translation: en },
};

// Initialize i18next instance
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "ar", // Default language Arabic
    fallbackLng: "ar",
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: "v4",
    react: {
      useSuspense: false,
    },
  });
}

// Polyfill .dir() if not defined
if (typeof i18n.dir !== "function") {
  i18n.dir = (lng) => {
    const lang = lng || i18n.language || "ar";
    return lang === "ar" ? "rtl" : "ltr";
  };
}

export default i18n;
