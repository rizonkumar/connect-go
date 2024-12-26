import axios from "axios";
import { handleAuthFailure } from "../../utils/handleAuthFailure";
import notificationAlert from "../components/notificationAlert";
import { WARN } from "../constant";
import { getAccessToken } from "./authApi";

let GeneralApi = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
  },
});

GeneralApi.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("Request config:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

GeneralApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (
        error.response.status === 409 ||
        error.response.status === 400 ||
        error.response.status === 403
      ) {
        notificationAlert(WARN, error.response.data.message);
      }

      if (error.response.status === 500) {
        let message = error.response.data.message ?? error.response.data;
        if (message) {
          notificationAlert(WARN, message);
        }
      }
      handleAuthFailure(error.response.status);
    } else if (error.request) {
      console.error("Request Error:", error.request);
    } else {
      console.error("Error Message:", error.message);
    }
    if (error.message === "Network Error") {
      console.error("Network Error Occurred");
    }
    console.error("Error Config:", error.config);

    return Promise.resolve(error);
  }
);

export default { GeneralApi };
