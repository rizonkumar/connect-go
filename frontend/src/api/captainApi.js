import generalApi from "./generalApi";

// get location suggestions
export const getLocationSuggestions = (input) => {
  const url = `/api/maps/get-suggestions?input=${input}`;
  return generalApi.GeneralApi.get(url);
};

export const getCaptainProfile = () => {
  return generalApi.GeneralApi.get("/api/captains/profile");
};

export const getCaptainRideHistory = () => {
  return generalApi.GeneralApi.get("/api/rides/captain/rides");
};


export const acceptRide = (rideId) => {
  return generalApi.GeneralApi.post("/api/rides/accept-ride", { rideId });
};

export const getCaptainStats = () => {
  return generalApi.GeneralApi.get("/api/captains/stats"); 
}