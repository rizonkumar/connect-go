  const captainModel = require("../models/captain.model");
const AppError = require("../utils/AppError");
const captianService = require("../services/captain.service");
const { validationResult } = require("express-validator");
const blacklistTokenModel = require("../models/blacklistToken.model");

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

    const captain = await captianService.createCaptain({
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

module.exports.loginCaptain = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const captain = await captainModel.findOne({ email }).select("+password");

    if (!captain) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordMatch = await captain.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = captain.generateAuthToken();

    // Remove password from response
    const sanitizedCaptain = captain.toObject();
    delete sanitizedCaptain.password;

    res.status(200).json({
      status: "success",
      message: "Captain logged in successfully",
      data: {
        captain: sanitizedCaptain,
        token,
      },
    });
  } catch (error) {
    next(new AppError(error.message || "An error occurred during login", 500));
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

module.exports.logoutCaptain = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new AppError("No token found", 400));
    }

    await blacklistTokenModel.create({ token });

    res.clearCookie("token");

    res.status(200).json({
      status: "success",
      message: "Captain logged out successfully",
    });
  } catch (error) {
    next(new AppError(error.message || "Error during logout", 500));
  }
};
