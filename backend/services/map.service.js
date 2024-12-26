const axios = require("axios");
require("dotenv").config();
const AppError = require("../utils/AppError");

module.exports.getAddressCoordinates = async (address) => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    if (!response.data.results?.length) {
      throw new Error("No results found for the given address", 400);
    }

    const location = response.data.results[0].geometry.location;
    return { lat: location.lat, lng: location.lng };
  } catch (error) {
    throw new AppError(error.response?.data?.message || error.message, 500);
  }
};

module.exports.getDistanceTime = async (origin, destination) => {
  try {
    if (!origin || !destination) {
      throw new AppError("Origin and destination are required", 400);
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origin
    )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

    const response = await axios.get(url);
    console.log("Google Maps API Response:", response.data); // Debug log

    if (response.data.status !== "OK") {
      throw new AppError("Failed to get distance from Google Maps API", 400);
    }

    if (!response.data.rows?.[0]?.elements?.[0]) {
      throw new AppError("No route information available", 400);
    }

    const element = response.data.rows[0].elements[0];

    if (element.status !== "OK") {
      throw new AppError("Unable to calculate route", 400);
    }

    // Extract values and convert to numbers
    const distanceInKm = Number(element.distance.value) / 1000;
    const durationInMinutes = Math.ceil(Number(element.duration.value) / 60);

    console.log("Calculated values:", {
      distanceInKm,
      durationInMinutes,
      durationText: element.duration.text
    });

    return {
      distanceInKm,
      durationInMinutes,
      durationText: element.duration.text
    };
  } catch (error) {
    console.error("Error in getDistanceTime:", error);
    throw new AppError(
      error.message || "Error calculating distance and time",
      error.statusCode || 500
    );
  }
};

module.exports.getAutoCompleteSuggestions = async (input) => {
  if (!input) {
    throw new AppError("Input is required", 400);
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    if (response.data.status === "ZERO_RESULTS") {
      throw new AppError("No results found for the given input", 400);
    }
    if (response.data.status === "OK") {
      return response.data.predictions;
    } else {
      throw new AppError(response.data.error.message, 500);
    }
  } catch (error) {
    throw new AppError(error.message, 500);
  }
};

// TODO: Driver ETA Implementation Roadmap
/**
 * Driver ETA Calculation Feature
 *
 * Current Status: Placeholder method exists
 *
 * Implementation Steps:
 * 1. Rider Availability Tracking
 *    - Create a system to track available riders/drivers
 *    - Store their real-time location in the database
 *    - Implement WebSocket or real-time location updates
 *
 * 2. Nearest Driver Selection
 *    - Develop an algorithm to find the closest available driver
 *    - Calculate distance and estimated time to pickup
 *    - Consider driver's current status (online, busy, available)
 *
 * 3. ETA Calculation Enhancements
 *    - Integrate with existing calculateDriverETA method
 *    - Add caching mechanism to reduce API calls
 *    - Implement fallback mechanisms for location tracking
 *
 * 4. Frontend Integration
 *    - Update RideOptions to display driver ETA
 *    - Add real-time updates for driver location
 *    - Show driver's estimated arrival time
 *
 * Considerations:
 * - Privacy: Ensure user location data is securely handled
 * - Performance: Optimize location tracking and ETA calculations
 * - Accuracy: Use multiple data sources for location verification
 *
 * Potential Technologies:
 * - WebSockets for real-time updates
 * - Geospatial indexing in MongoDB
 * - Background job for location tracking
 */

module.exports.calculateDriverETA = async (driverLocation, pickupLocation) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      `${driverLocation.lat},${driverLocation.lng}`
    )}&destinations=${encodeURIComponent(
      `${pickupLocation.lat},${pickupLocation.lng}`
    )}&key=${apiKey}`;

    const response = await axios.get(url);

    if (response.data.status === "OK") {
      const element = response.data.rows[0].elements[0];

      if (element.status === "OK") {
        // Return duration in minutes
        return Math.ceil(element.duration.value / 60);
      } else {
        throw new AppError("Unable to calculate driver ETA", 400);
      }
    } else {
      throw new AppError("Distance Matrix API error", 500);
    }
  } catch (error) {
    throw new AppError(error.message || "Error calculating driver ETA", 400);
  }
};
