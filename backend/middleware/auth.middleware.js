const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const blacklistTokenModel = require("../models/blacklistToken.model");
const captainModel = require("../models/captain.model");

module.exports.authUser = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError("No token provided. Please login first", 401));
    }

    // Verify token before checking blacklist
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check blacklist
    const isBlacklisted = await blacklistTokenModel.findOne({ token });
    if (isBlacklisted) {
      return next(new AppError("Token is invalid", 401));
    }

    const user = await userModel.findById(decoded._id);
    if (!user) {
      return next(new AppError("User not found", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Token expired", 401));
    }
    return next(error);
  }
};

module.exports.authCaptain = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError("No token provided. Please login first", 401));
    }

    // Verify token before checking blacklist
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check blacklist
    const isBlacklisted = await blacklistTokenModel.findOne({ token });
    if (isBlacklisted) {
      return next(new AppError("Token is invalid", 401));
    }

    const captain = await captainModel.findById(decoded._id);
    if (!captain) {
      return next(new AppError("Captain not found", 401));
    }

    // Uncomment when status check is needed
    // if (captain.status === "inactive") {
    //   return next(new AppError("Captain account is inactive", 403));
    // }

    req.captain = captain;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Token expired", 401));
    }
    return next(error);
  }
};
