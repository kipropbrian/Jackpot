import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { supabase } from "../supabase/client";

// Create an Axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token to requests
apiClient.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session?.access_token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }

      return config;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh the session
        const { data, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError) throw refreshError;

        if (data.session?.access_token) {
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        // Redirect to login if refresh fails
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
