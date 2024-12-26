const rideService = require("../services/ride.service");
const mapService = require("../services/map.service");
const AppError = require("../utils/AppError");
const Ride = require("../models/ride.model");

const createRide = async (req, res, next) => {
  try {
    const { pickup, destination, vehicleType } = req.body;
    const user = req.user;

    console.log("Create ride request:", {
      body: req.body,
      userId: user?._id,
      vehicleType,
    });

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    if (!pickup || !destination || !vehicleType) {
      throw new AppError(
        "Pickup, destination and vehicle type are required",
        400
      );
    }

    // Get fares for the route
    const fares = await rideService.getFare(pickup, destination);
    console.log("Calculated fares:", fares);

    const fare = fares[vehicleType];
    if (!fare) {
      throw new AppError(
        `Could not calculate fare for vehicle type: ${vehicleType}`,
        400
      );
    }

    // Create the ride
    const ride = await rideService.createRide({
      user: user._id,
      pickup,
      destination,
      vehicleType,
      fare,
    });

    console.log("Created ride:", {
      rideId: ride._id,
      userId: user._id,
      fare: ride.fare,
      otp: ride.otp,
    });

    // Emit socket event for nearby drivers
    const io = req.app.get("io");
    if (io) {
      io.emit("ride:new_request", {
        rideId: ride._id,
        userId: user._id,
        userName: `${user.fullName.firstName} ${user.fullName.lastName}`,
        pickup,
        destination,
        vehicleType,
        fare: ride.fare,
        otp: ride.otp,
      });
      console.log("Emitted ride:new_request event to drivers");
    }

    res.status(201).json({
      status: "success",
      message: "Ride created successfully",
      data: { ride },
    });
  } catch (error) {
    console.error("Error in createRide controller:", error);
    next(new AppError(error.message || "Error creating ride", 500));
  }
};

const getAllRides = async (req, res, next) => {
  try {
    const rides = await rideService.getAllRides();
    res.status(200).json({
      status: "success",
      message: "Rides fetched successfully",
      data: { rides },
    });
  } catch (error) {
    next(new AppError(error.message || "Error fetching rides", 500));
  }
};

const getUserRides = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const rides = await rideService.getUserRides(userId);

    res.status(200).json({
      success: true,
      message: "User rides fetched successfully",
      data: { rides },
    });
  } catch (error) {
    next(new AppError(error.message || "Error fetching user rides", 500));
  }
};

const getCaptainRides = async (req, res) => {
  try {
    // Get captain ID from authenticated request
    const captainId = req.captain._id;

    // Fetch captain rides
    const { rides, totalRides, totalEarnings } =
      await rideService.getCaptainRides(captainId);

    // Respond with success
    return res.status(200).json({
      success: true,
      data: {
        rides,
        totalRides,
        totalEarnings,
      },
    });
  } catch (error) {
    console.error("Error in getCaptainRides controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve captain rides",
      error: {
        statusCode: 500,
      },
    });
  }
};

const getFare = async (req, res, next) => {
  try {
    const { pickup, destination } = req.query;

    const fares = await rideService.getFare(pickup, destination);

    res.status(200).json({
      status: "success",
      message: "Fares calculated successfully",
      data: { fares },
    });
  } catch (error) {
    next(new AppError(error.message || "Error calculating fares", 500));
  }
};

const getETA = async (req, res, next) => {
  try {
    const { pickup, destination } = req.query;

    // Validate input
    if (!pickup || !destination) {
      return res.status(400).json({
        status: "error",
        message: "Pickup and destination addresses are required",
      });
    }

    try {
      const pickupCoords = await mapService.getAddressCoordinates(pickup);
      const destinationCoords = await mapService.getAddressCoordinates(
        destination
      );

      if (!pickupCoords || !destinationCoords) {
        next(
          new AppError(
            "Unable to get coordinates for the provided addresses",
            400
          )
        );
      }

      const { travelTime, distance, formattedTime } =
        await rideService.calculateETA(
          { latitude: pickupCoords.lat, longitude: pickupCoords.lng },
          { latitude: destinationCoords.lat, longitude: destinationCoords.lng }
        );

      res.status(200).json({
        status: "success",
        message: "ETA calculated successfully",
        data: {
          ride: {
            estimatedTravelTime: travelTime,
            estimatedTravelTimeLabel: formattedTime,
            totalDistance: distance,
            distanceLabel: `Approx. ${distance} away`,
          },
          details: {
            pickupAddress: pickup,
            destinationAddress: destination,
          },
        },
      });
    } catch (error) {
      console.error("Geocoding or ETA calculation error:", error);
      next(new AppError(error.message || "Error calculating route", 500));
    }
  } catch (error) {
    console.error("ETA Calculation Error:", error);
    next(new AppError(error.message || "Error calculating ETA", 500));
  }
};

const acceptRide = async (req, res, next) => {
  try {
    const { rideId } = req.body;
    const captainId = req.captain._id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      throw new AppError("Ride not found", 404);
    }

    if (ride.status !== "pending") {
      throw new AppError("Ride is no longer available", 400);
    }

    const distanceTimeData = await mapService.getDistanceTime(
      ride.pickup,
      ride.destination
    );

    ride.duration = distanceTimeData.durationInMinutes;
    ride.durationText = distanceTimeData.durationText;
    ride.status = "accepted";
    ride.captain = captainId;

    await ride.save();

    const io = req.app.get("io");
    if (io) {
      io.to(ride.user.toString()).emit("ride:accepted", {
        rideId: ride._id,
        captain: {
          id: req.captain._id,
          name: `${req.captain.fullName.firstName} ${req.captain.fullName.lastName}`,
          vehicle: req.captain.vehicle,
        },
        fare: ride.fare,
        duration: distanceTimeData.durationInMinutes,
        durationText: distanceTimeData.durationText,
        status: ride.status,
        otp: ride.otp,
      });

      // Notify other drivers
      io.emit("ride:unavailable", rideId);
    }

    res.status(200).json({
      status: "success",
      message: "Ride accepted successfully",
      data: { ride },
    });
  } catch (error) {
    next(new AppError(error.message || "Error accepting ride", 500));
  }
};

// Need to implement rejectRide
const rejectRide = async (req, res, next) => {
  console.log("Reject ride request:", req.body);
};

module.exports = {
  createRide,
  getAllRides,
  getUserRides,
  getCaptainRides,
  getFare,
  getETA,
  acceptRide,
};
