export const handleAuthFailure = async (statusCode, userType = "captain") => {
  if (statusCode === 401) {
    localStorage.removeItem(`${userType}Token`);
    localStorage.removeItem("refreshToken");
    window.location.href = userType === "captain" ? "/captain-login" : "/login";
  }
};
