const rideModel = require("../models/ride.model");
const AppError = require("../utils/AppError");
const mapService = require("../services/map.service");
const crypto = require("crypto");
const axios = require("axios");
const Ride = require("../models/ride.model");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function getFare(pickup, destination) {
  if (!pickup || !destination) {
    throw new AppError("Pickup and destination are required", 400);
  }

  try {
    // Base fares and per kilometer rates for different vehicle types
    const fareRates = {
      auto: {
        baseFare: 30,
        perKm: 15,
        minFare: 30,
      },
      car: {
        baseFare: 50,
        perKm: 20,
        minFare: 50,
      },
      motorcycle: {
        baseFare: 20,
        perKm: 12,
        minFare: 20,
      },
    };

    // Get distance and time
    const distanceTimeData = await mapService.getDistanceTime(pickup, destination);
    const distanceInKm = distanceTimeData.distanceInKm; // Make sure we're using the correct property

    console.log("Distance data:", distanceTimeData); // Debug log

    if (!distanceInKm || isNaN(distanceInKm)) {
      throw new AppError("Invalid distance calculation", 400);
    }

    // Calculate fares for all vehicle types
    const fares = {};
    for (const [vehicleType, rate] of Object.entries(fareRates)) {
      // Ensure all values are numbers
      const baseFare = Number(rate.baseFare);
      const perKm = Number(rate.perKm);
      const minFare = Number(rate.minFare);
      const distance = Number(distanceInKm);

      // Calculate fare
      let fare = baseFare + (distance * perKm);
      // Ensure fare is not less than minimum fare
      fare = Math.max(fare, minFare);
      // Round to nearest integer
      fares[vehicleType] = Math.round(fare);

      // Verify calculation
      console.log(`${vehicleType} fare calculation:`, {
        baseFare,
        perKm,
        distance,
        calculatedFare: fare,
        roundedFare: fares[vehicleType]
      });
    }

    console.log("Final calculated fares:", fares); // Debug log
    return fares;
  } catch (error) {
    console.error("Error in getFare:", error);
    throw new AppError(
      error.message || "Error calculating fares",
      error.statusCode || 500
    );
  }
}

function getOTP(num) {
  // Using crypto.randomInt to generate cryptographically secure random numbers
  return Array.from({ length: num }, () => crypto.randomInt(0, 10)).join("");
}

const createRide = async ({ user, pickup, destination, vehicleType, fare }) => {
  console.log("Creating ride with params:", {
    userId: user,
    pickup,
    destination,
    vehicleType,
    fare,
  });

  try {
    // Validate required fields
    if (!user || !pickup || !destination || !vehicleType || !fare) {
      throw new AppError(
        "User, pickup, destination, vehicleType and fare are required",
        400
      );
    }

    // Generate OTP
    const otp = getOTP(4);
    console.log("Generated OTP:", otp);

    // Create ride record
    const ride = await rideModel.create({
      user,
      pickup,
      destination,
      vehicleType,
      fare,
      otp,
      status: "pending",
    });

    console.log("Successfully created ride:", {
      rideId: ride._id,
      userId: ride.user,
      status: ride.status,
      otp: ride.otp,
    });

    return ride;
  } catch (error) {
    console.error("Error creating ride:", error);
    throw new AppError(
      `Failed to create ride: ${error.message}`,
      error.statusCode || 500
    );
  }
};

const getAllRides = async () => {
  try {
    const rides = await rideModel
      .find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .populate("user", "name email"); // Populate user details if needed

    return rides;
  } catch (error) {
    throw new AppError("Error fetching rides", 500);
  }
};

const getUserRides = async (userId) => {
  try {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const rides = await rideModel
      .find({ user: userId, status: { $in: ["completed", "cancelled"] } })
      .sort({ createdAt: -1 })
      .populate("captain", "fullName")
      .select(
        "pickup destination fare status captain createdAt duration distance"
      );

    return rides;
  } catch (error) {
    throw new AppError(error.message || "Error fetching user rides", 500);
  }
};

const getCaptainRides = async (captainId) => {
  try {
    // Validate captainId
    if (!captainId) {
      throw new Error("Captain ID is required");
    }

    // Find all rides where the captain matches the given captainId
    const rides = await rideModel
      .find({ captain: captainId, status: { $in: ["completed", "cancelled"] } })
      .populate("user", "fullName.firstName fullName.lastName email")
      .sort({ createdAt: -1 }); // Sort by most recent first

    // Calculate total earnings
    const totalEarnings = rides.reduce(
      (total, ride) => total + (ride.fare || 0),
      0
    );

    return {
      rides,
      totalRides: rides.length,
      totalEarnings,
    };
  } catch (error) {
    console.error("Error in getCaptainRides:", error);
    throw new Error(`Failed to retrieve captain rides: ${error.message}`);
  }
};

const calculateETA = async (pickup, destination) => {
  if (!pickup || !destination) {
    throw new AppError("Pickup and destination coordinates are required", 400);
  }

  try {
    const origins = `${pickup.latitude},${pickup.longitude}`;
    const destinations = `${destination.latitude},${destination.longitude}`;

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          origins,
          destinations,
          key: GOOGLE_MAPS_API_KEY,
          mode: "driving",
          departure_time: "now",
          traffic_model: "best_guess",
        },
      }
    );

    // Validate API response
    if (!response.data || !response.data.rows || !response.data.rows[0]) {
      console.error("Invalid response from Google Maps API:", response.data);
      throw new Error("Invalid response from distance matrix API");
    }

    const elements = response.data.rows[0].elements;

    if (!elements || !elements[0] || elements[0].status !== "OK") {
      console.error("Route calculation failed:", elements);
      throw new Error("Unable to calculate route");
    }

    // Extract duration and distance
    const duration = elements[0].duration;
    const distance = elements[0].distance;

    if (!duration || !distance) {
      console.error("Missing duration or distance in response:", elements[0]);
      throw new Error("Unable to determine route duration or distance");
    }

    // Get duration in seconds and convert to minutes
    const durationInSeconds = duration.value;
    const travelTimeInMinutes = Math.ceil(durationInSeconds / 60);

    // Format time for display
    let formattedTime;
    if (travelTimeInMinutes >= 60) {
      const hours = Math.floor(travelTimeInMinutes / 60);
      const minutes = travelTimeInMinutes % 60;
      formattedTime =
        minutes > 0 ? `${hours} hr ${minutes} min ride` : `${hours} hr ride`;
    } else {
      formattedTime = `${travelTimeInMinutes} min ride`;
    }

    return {
      travelTime: travelTimeInMinutes,
      distance: distance.text,
      formattedTime,
    };
  } catch (error) {
    console.error("Detailed ETA Calculation Error:", error);
    throw new AppError(
      error.message || "Failed to calculate ETA from Google Maps",
      500
    );
  }
};

const acceptRide = async ({ rideId, captainId }) => {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) {
      throw new AppError("Ride not found", 404);
    }

    // Check if ride is already accepted
    if (ride.status !== "pending") {
      throw new AppError("Ride is no longer available", 400);
    }

    // Calculate duration using map service
    const distanceTimeData = await mapService.getDistanceTime(
      ride.pickup,
      ride.destination
    );

    // Update ride
    ride.duration = distanceTimeData.durationInMinutes;
    ride.durationText = distanceTimeData.durationText;
    ride.status = "accepted";
    ride.captain = captainId;

    await ride.save();

    return {
      ride,
      distanceTimeData,
    };
  } catch (error) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

module.exports = {
  createRide,
  getAllRides,
  getUserRides,
  getCaptainRides,
  getFare,
  calculateETA,
  acceptRide,
};
