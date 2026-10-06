import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../lib/axios";

export const SHIPPING_COUNTRIES_QUERY_KEY = ["shipping-countries"];

/** Get Shipping Rates using the unified backend API. Credentials stay on the server. */
export const useCalculateShippingRate = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/shipping/calculate-rate", payload);
      return response.data;
    },
  });
};

/**
 * Fallback shipping countries list aligned with Admin Aramex defaults
 */
export const DEFAULT_SHIPPING_COUNTRIES = [
  { code: "SA", nameAr: "المملكة العربية السعودية", nameEn: "Saudi Arabia", zone: "gcc" },
  { code: "AE", nameAr: "الإمارات العربية المتحدة", nameEn: "United Arab Emirates", zone: "gcc" },
  { code: "KW", nameAr: "الكويت", nameEn: "Kuwait", zone: "gcc" },
  { code: "BH", nameAr: "البحرين", nameEn: "Bahrain", zone: "gcc" },
  { code: "QA", nameAr: "قطر", nameEn: "Qatar", zone: "gcc" },
  { code: "OM", nameAr: "عُمان", nameEn: "Oman", zone: "gcc" },
  { code: "EG", nameAr: "جمهورية مصر العربية", nameEn: "Egypt", zone: "arab" },
  { code: "JO", nameAr: "المملكة الأردنية الهاشمية", nameEn: "Jordan", zone: "arab" },
  { code: "SD", nameAr: "السودان", nameEn: "Sudan", zone: "arab" },
  { code: "LB", nameAr: "لبنان", nameEn: "Lebanon", zone: "arab" },
  { code: "IQ", nameAr: "العراق", nameEn: "Iraq", zone: "arab" },
  { code: "YE", nameAr: "اليمن", nameEn: "Yemen", zone: "arab" },
  { code: "MA", nameAr: "المغرب", nameEn: "Morocco", zone: "arab" },
  { code: "DZ", nameAr: "الجزائر", nameEn: "Algeria", zone: "arab" },
  { code: "TN", nameAr: "تونس", nameEn: "Tunisia", zone: "arab" },
  { code: "TR", nameAr: "تركيا", nameEn: "Turkey", zone: "international" },
  { code: "US", nameAr: "الولايات المتحدة الأمريكية", nameEn: "United States", zone: "international" },
  { code: "GB", nameAr: "المملكة المتحدة", nameEn: "United Kingdom", zone: "international" },
];

/**
 * Generate emoji flag from 2-letter ISO country code
 */
export const getCountryFlag = (countryCode) => {
  if (!countryCode || typeof countryCode !== "string" || countryCode.length !== 2) {
    return "🌐";
  }
  const upper = countryCode.toUpperCase();
  const first = upper.codePointAt(0);
  const second = upper.codePointAt(1);
  if (first < 65 || first > 90 || second < 65 || second > 90) {
    return "🌐";
  }
  return String.fromCodePoint(127397 + first, 127397 + second);
};

/**
 * Hook to get supported shipping countries via Aramex lookup (same as admin)
 */
export const useGetShippingCountries = () => {
  return useQuery({
    queryKey: SHIPPING_COUNTRIES_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get("/shipping/countries");
      return response.data?.countries || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour caching
  });
};
