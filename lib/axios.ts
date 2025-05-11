import https from "https";

import axios, { InternalAxiosRequestConfig } from "axios";

// Create https agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000,
  httpsAgent, // Add the https agent to ignore certificate errors
});

// Create a public axios instance that doesn't use authentication
// This is used for public routes like invitation pages
export const publicAxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000,
  httpsAgent,
});

// Add request interceptor to attach auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("auth");

      if (auth) {
        const parsedAuth = JSON.parse(auth);

        if (parsedAuth.access_token) {
          config.headers.Authorization = `Bearer ${parsedAuth.access_token}`;
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Don't handle 401 errors for login/register requests
    const isAuthRequest =
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/register");

    // Handle 401 Unauthorized errors except for login/register requests
    if (error.response?.status === 401 && !isAuthRequest) {
      // Clear auth data
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth");
        localStorage.removeItem("user");
        // Redirect to login page if not already there
        if (window.location.pathname !== "/auth/login") {
          window.location.href = "/auth/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

// Add simplified response interceptor for public instance (no redirects)
publicAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export default axiosInstance;
