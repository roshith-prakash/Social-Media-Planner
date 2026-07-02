import axios from "axios";
import { auth } from "../firebase/firebase";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1",
  timeout: 300000, // 5 minutes — AI analysis can take a while
});

// Request interceptor: attach Firebase ID token to every request
axiosInstance.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (e) {
        console.warn("Failed to get ID token:", e.message);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalize error messages
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;
