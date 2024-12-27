const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const blacklistTokenModel = require("../models/blacklistToken.model");
const captainModel = require("../models/captain.model");

module.exports.authUser = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;

    if (!token) {
      return next(new AppError("No token provided. Please login first", 401));
    }

    const isBlacklisted = await blacklistTokenModel.findOne({ token });
    if (isBlacklisted) {
      return next(new AppError("Token is blacklisted", 401));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel
        .findById(decoded._id)
        .select("+refreshToken");

      if (!user) {
        return next(new AppError("User not found", 401));
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        // Try to use refresh token
        const refreshToken =
          req.cookies?.refreshToken || req.headers["x-refresh-token"];

        if (refreshToken) {
          try {
            const decoded = jwt.verify(
              refreshToken,
              process.env.REFRESH_TOKEN_SECRET
            );
            const user = await userModel
              .findById(decoded._id)
              .select("+refreshToken");

            if (user && user.refreshToken === refreshToken) {
              const newAccessToken = user.generateAuthToken();
              res.setHeader("x-new-token", newAccessToken);
              req.user = user;
              return next();
            }
          } catch (refreshError) {
            return next(new AppError("Refresh token invalid", 401));
          }
        }
        return next(new AppError("Token expired", 401));
      }
      return next(new AppError("Invalid token", 401));
    }
  } catch (error) {
    return next(error);
  }
};

module.exports.authCaptain = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;

    if (!token) {
      return next(new AppError("No token provided. Please login first", 401));
    }

    const isBlacklisted = await blacklistTokenModel.findOne({ token });
    if (isBlacklisted) {
      return next(new AppError("Token is blacklisted", 401));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const captain = await captainModel
        .findById(decoded._id)
        .select("+refreshToken");

      if (!captain) {
        return next(new AppError("Captain not found", 401));
      }

      req.captain = captain;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        // Try to use refresh token
        const refreshToken =
          req.cookies?.refreshToken || req.headers["x-refresh-token"];

        if (refreshToken) {
          try {
            const decoded = jwt.verify(
              refreshToken,
              process.env.REFRESH_TOKEN_SECRET
            );
            const captain = await captainModel
              .findById(decoded._id)
              .select("+refreshToken");

            if (captain && captain.refreshToken === refreshToken) {
              const newAccessToken = captain.generateAuthToken();
              res.setHeader("x-new-token", newAccessToken);
              req.captain = captain;
              return next();
            }
          } catch (refreshError) {
            return next(new AppError("Refresh token invalid", 401));
          }
        }
        return next(new AppError("Token expired", 401));
      }
      return next(new AppError("Invalid token", 401));
    }
  } catch (error) {
    return next(error);
  }
};
