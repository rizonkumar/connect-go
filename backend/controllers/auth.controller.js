const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const handleRefreshToken = async (Model, req, res, next) => {
  try {
    const token =
      req.cookies?.refreshToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new AppError("No refresh token provided", 401);
    }

    // Verify refresh token
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await Model.findById(decoded._id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      throw new AppError("Invalid refresh token", 401);
    }

    // Generate new tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Update refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        token: accessToken,
        refreshToken: refreshToken,
      },
    });
  } catch (error) {
    next(new AppError("Token refresh failed", 401));
  }
};

// controllers/auth.controller.js
const handleLogout = async (Model, req, res, next) => {
  try {
    const token =
      req.cookies?.refreshToken || req.headers.authorization?.split(" ")[1];

    if (token) {
      const user = await Model.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }

    res.clearCookie("refreshToken");
    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { handleLogout, handleRefreshToken };
