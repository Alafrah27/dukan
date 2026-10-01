import axios from "axios";
import { getClerkInstance } from "@clerk/expo";

const rawUrl =
  process.env.EXPO_PUBLIC_API_ENDPOINT || "https://dukan-4k63.onrender.com";

export const API_BASE_URL = rawUrl.endsWith("/api/v1")
  ? rawUrl
  : `${rawUrl.replace(/\/$/, "")}/api/v1`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Automatically inject Clerk session token & normalize path prefixes
api.interceptors.request.use(
  async (config) => {
    // Normalize path if caller prefixes with /api/v1 or /v1
    if (config.url?.startsWith("/api/v1")) {
      config.url = config.url.replace(/^\/api\/v1/, "");
    } else if (config.url?.startsWith("/v1")) {
      config.url = config.url.replace(/^\/v1/, "");
    }

    try {
      const clerk = getClerkInstance();
      const token = await clerk?.session?.getToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("Clerk Token Interceptor Error:", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const Instance = api;
export default api;