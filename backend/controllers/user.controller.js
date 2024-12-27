const { validationResult } = require("express-validator");
const userModel = require("../models/user.model");
const userService = require("../services/user.service");
const AppError = require("../utils/AppError");
const blacklistTokenModel = require("../models/blacklistToken.model");
const { handleLogout } = require("./auth.controller");

module.exports.registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Check if required fields exist in request body
    if (!req.body.fullName || !req.body.email || !req.body.password) {
      throw new AppError("Missing required fields", 400);
    }

    const {
      fullName: { firstName, lastName },
      email,
      password,
    } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    const hashedPassword = await userModel.hashPassword(password);

    const user = await userService.createUser({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    const token = user.generateAuthToken();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        token,
        user: {
          fullName: user.fullName,
          email: user.email,
          _id: user._id,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("Email already exists", 409));
    }
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        token: accessToken,
        refreshToken,
        user: {
          fullName: user.fullName,
          email: user.email,
          _id: user._id,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports.getUserProfile = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    data: {
      user: {
        fullName: req.user.fullName,
        email: req.user.email,
        _id: req.user._id,
      },
    },
  });
};

exports.logoutUser = async (req, res, next) => {
  await handleLogout(userModel, req, res, next);
};


exports.refreshUserToken = async (req, res, next) => {
  await handleRefreshToken(userModel, req, res, next);
};
