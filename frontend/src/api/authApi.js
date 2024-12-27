import { jwtDecode } from "jwt-decode";
import generalApi from "./generalApi";

// User Login
export const userLogin = (data) => {
  const url = `/api/users/login`;
  return generalApi.GeneralApi.post(url, data);
};

// Captain Login
export const captainLogin = (data) => {
  const url = `/api/captains/login`;
  return generalApi.GeneralApi.post(url, data);
};

// Get access token based on user type
export const getAccessToken = (userType = "user") => {
  // First try to get the specific token type
  const token =
    userType === "captain"
      ? localStorage.getItem("captainToken")
      : localStorage.getItem("userToken");

  if (token) return token;

  // If no specific token found, try the other type
  const alternativeToken =
    userType === "captain"
      ? localStorage.getItem("userToken")
      : localStorage.getItem("captainToken");

  return alternativeToken || null;
};

// Decode JWT token
export const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Verify if token is valid
export const verifyToken = (userType = "user") => {
  const token = getAccessToken(userType);
  if (!token) return false;

  try {
    const decodedToken = decodeToken(token);
    if (!decodedToken) return false;

    // Check if token is expired
    const currentTime = Date.now() / 1000;
    return decodedToken.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const refreshToken = (userType = "captain") => {
  const url =
    userType === "captain" ? "/api/captains/refresh" : "/api/users/refresh";

  const refreshToken = localStorage.getItem("refreshToken");

  return generalApi.GeneralApi.post(url, null, {
    headers: {
      "x-refresh-token": refreshToken,
    },
  });
};

// Logout
export const logout = (userType = "user") => {
  const url =
    userType === "captain" ? "/api/captains/logout" : "/api/users/logout";
  return generalApi.GeneralApi.get(url);
};
