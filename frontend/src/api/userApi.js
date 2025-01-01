import generalApi from "./generalApi";

export const getUserProfile = () => {
  return generalApi.GeneralApi.get("/api/users/profile");
};

export const getRideHistory = () => {
  return generalApi.GeneralApi.get("/api/rides/user/rides");
};

export const getFares = async (pickup, dropoff) => {
  return generalApi.GeneralApi.get("/api/rides/fare", {
    params: {
      pickup,
      destination: dropoff,
    },
  });
};

export const getETA = async (pickup, dropoff) => {
  return generalApi.GeneralApi.get("/api/rides/eta", {
    params: {
      pickup,
      destination: dropoff,
    },
  });
};

export const createRide = async (pickup, destination, vehicleType) => {
  try {
    const body = {
      pickup,
      destination,
      vehicleType,
    };
    const url = "/api/rides/create-ride";
    const response = await generalApi.GeneralApi.post(url, body);
    return response;
  } catch (error) {
    console.error("Error in createRide:", error);
    throw error;
  }
};

export const getDistanceTime = async (pickup, dropoff) => {
  return generalApi.GeneralApi.get("/api/maps/get-distance-time", {
    params: {
      origin: pickup,
      destination: dropoff,
    },
  });
};
