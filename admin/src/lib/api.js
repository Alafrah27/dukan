import axios from 'axios';


export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Base axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      // Retrieve token client-side safely from Clerk window object if loaded
      if (typeof window !== "undefined" && window.Clerk) {
        const token = await window.Clerk.session?.getToken();
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error("Clerk Interceptor Error:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
