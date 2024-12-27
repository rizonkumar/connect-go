const captainModel = require("../models/captain.model");
const AppError = require("../utils/AppError");
const captainService = require("../services/captain.service");
const { validationResult } = require("express-validator");
const blacklistTokenModel = require("../models/blacklistToken.model");
const { handleLogout } = require("./auth.controller");

module.exports.registerCaptain = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { fullName, email, password, vehicle } = req.body;

    const isCaptainAlreadyRegistered = await captainModel.findOne({
      email,
    });
    if (isCaptainAlreadyRegistered) {
      throw new AppError("Captain already registered", 409);
    }

    const hashedPassword = await captainModel.hashPassword(password);

    const captain = await captainService.createCaptain({
      firstName: fullName.firstName,
      lastName: fullName.lastName,
      email,
      password: hashedPassword,
      color: vehicle.color,
      plate: vehicle.plate,
      capacity: vehicle.capacity,
      vehicleType: vehicle.vehicleType,
    });

    const token = captain.generateAuthToken();

    const sanitizedCaptain = {
      _id: captain._id,
      fullName: captain.fullName,
      email: captain.email,
      vehicle: captain.vehicle,
      status: captain.status,
    };

    res.status(201).json({
      status: "success",
      message: "Captain registered successfully",
      data: {
        captain: sanitizedCaptain,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.loginCaptain = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const captain = await captainModel.findOne({ email }).select("+password");
    if (!captain || !(await captain.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = captain.generateAuthToken();
    const refreshToken = captain.generateRefreshToken();

    // Save refresh token
    captain.refreshToken = refreshToken;
    await captain.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Captain logged in successfully",
      data: {
        token: accessToken,
        refreshToken,
        captain: {
          fullName: captain.fullName,
          email: captain.email,
          _id: captain._id,
          vehicle: captain.vehicle,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports.getCaptainProfile = async (req, res, next) => {
  try {
    if (!req.captain) {
      return next(new AppError("Captain not found", 404));
    }

    const captain = req.captain;
    const sanitizedCaptain = captain.toObject();
    delete sanitizedCaptain.password;

    res.status(200).json({
      status: "success",
      message: "Captain profile fetched successfully",
      data: {
        captain: sanitizedCaptain,
      },
    });
  } catch (error) {
    next(new AppError(error.message || "Error fetching captain profile", 500));
  }
};

exports.logoutCaptain = async (req, res, next) => {
  await handleLogout(captainModel, req, res, next);
};

module.exports.getCaptainStats = async (req, res, next) => {
  try {
    const stats = await captainService.getCaptainStats(req.captain._id);
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

exports.refreshCaptainToken = async (req, res, next) => {
  await handleRefreshToken(captainModel, req, res, next);
};