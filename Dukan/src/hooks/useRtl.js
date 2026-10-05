import { I18nManager } from "react-native";
import { useTranslation } from "react-i18next";

/**
 * Direction helper. Arabic (default) is RTL.
 * `row` lays children from the reading-start side (right in RTL, left in LTR),
 * regardless of whether the native layout has been forced to RTL.
 */
export default function useRtl() {
  const { t, i18n } = useTranslation();
  const isRtl =
    (typeof i18n?.dir === "function" ? i18n.dir() === "rtl" : true) ||
    i18n?.language === "ar";

  const row = isRtl === I18nManager.isRTL ? "row" : "row-reverse";

  return { isRtl, row, language: i18n?.language || "ar", t };
}
