import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "@clerk/react";

/**
 * Fetch supported shipping providers
 */
export const useGetShippingProviders = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["shipping-providers"],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.get("/shipping/providers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Fetch the default shipping origin (fixed Saudi Arabia)
 */
export const useGetShippingOrigin = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["shipping-origin"],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.get("/shipping/origin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Calculate shipping rate mutation
 * @param {Object} data - { destination: { countryCode, city }, packageDetails: { weight, ... }, currency, provider }
 */
export const useCalculateShippingRate = () => {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data) => {
      const token = await getToken();
      const response = await api.post("/shipping/calculate-rate", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });
};

/**
 * Fetch supported countries from Aramex lookup
 */
export const useGetShippingCountries = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["shipping-countries"],
    queryFn: async () => {
      const token = await getToken();
      const response = await api.get("/shipping/countries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.countries || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
