import axios from "axios";
import { handleAuthFailure } from "../../utils/handleAuthFailure";
import notificationAlert from "../components/notificationAlert";
import { WARN } from "../constant";
import { getAccessToken, refreshToken } from "./authApi";

let GeneralApi = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

GeneralApi.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add refresh token if available
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      config.headers["x-refresh-token"] = refreshToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

GeneralApi.interceptors.response.use(
  (response) => {
    // Check for new token in response headers
    const newToken = response.headers["x-new-token"];
    if (newToken) {
      localStorage.setItem("captainToken", newToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return GeneralApi(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await refreshToken();
        const { token, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem("captainToken", token);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${token}`;
        processQueue(null, token);
        return GeneralApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleAuthFailure(401);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      if ([409, 400, 403].includes(error.response.status)) {
        notificationAlert(WARN, error.response.data.message);
      }

      if (error.response.status === 500) {
        const message = error.response.data.message ?? error.response.data;
        if (message) {
          notificationAlert(WARN, message);
        }
      }

      if (error.response.status === 401) {
        handleAuthFailure(401);
      }
    }

    return Promise.reject(error);
  }
);

export default { GeneralApi };
