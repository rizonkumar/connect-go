const captainModel = require("../models/captain.model");
const CaptainSession = require("../models/captainSession.model");
const Ride = require("../models/ride.model");
const AppError = require("../utils/AppError");

module.exports.createCaptain = async ({
  firstName,
  lastName,
  email,
  password,
  color,
  plate,
  capacity,
  vehicleType,
}) => {
  if (
    !firstName ||
    !email ||
    !password ||
    !color ||
    !plate ||
    !capacity ||
    !vehicleType
  ) {
    throw new AppError("All fields are required", 400);
  }

  const captain = captainModel.create({
    fullName: {
      firstName,
      lastName,
    },
    email,
    password,
    vehicle: {
      color,
      plate,
      capacity,
      vehicleType,
    },
  });

  return captain;
};

module.exports.getCaptainStats = async (captainId) => {
  try {
    // Get total hours online from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const sessions = await CaptainSession.find({
      captain: captainId,
      longTime: { $gte: oneDayAgo },
    });

    let totalHours = 0;
    sessions.forEach((session) => {
      const endTime = session.logoutTime || new Date();
      const durationInHours = (endTime - session.loginTime) / (1000 * 60 * 60);
      totalHours += durationInHours;
    });

    // Get completed rides for distance and earnings
    const completedRides = await Ride.find({
      captain: captainId,
      status: "completed",
    });

    // Calculate stats
    const stats = {
      totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
      totalDistance: completedRides.reduce(
        (acc, ride) => acc + (ride.distance || 0),
        0
      ),
      totalJobs: completedRides.length,
      earnings: completedRides.reduce((acc, ride) => acc + (ride.fare || 0), 0),
    };

    return stats;
  } catch (error) {
    throw new AppError("Error calculating captain stats", 500);
  }
};
