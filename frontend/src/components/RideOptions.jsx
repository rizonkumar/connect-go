import { useState, useCallback, useEffect } from "react";
import { Clock, User, MapPin, Timer } from "lucide-react";
import { rides } from "../../constants/data";
import RideConfirmation from "./RideConfirmation";
import RideConfirm from "./RideConfirm";
import { getETA, getFares } from "../api/userApi";

const RideOptions = ({ pickup, dropoff, onBack }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRideAccepted, setIsRideAccepted] = useState(false);
  const [fares, setFares] = useState(null);
  const [eta, setETA] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        setLoading(true);

        const [faresResponse, etaResponse] = await Promise.all([
          getFares(pickup, dropoff),
          getETA(pickup, dropoff),
        ]);

        // Map API fares to existing rides data
        const updatedRides = rides.map((ride) => {
          let fareType;
          switch (ride.name) {
            case "Connect Auto":
              fareType = "auto";
              break;
            case "Premier":
              fareType = "car";
              break;
            case "Connect Moto":
              fareType = "motorcycle";
              break;
            default:
              fareType = "auto";
          }

          return {
            ...ride,
            price: faresResponse.data.data.fares[fareType],
            eta: etaResponse.data.data.ride.estimatedTravelTime,
            etaLabel: etaResponse.data.data.ride.estimatedTravelTimeLabel,
            distance: etaResponse.data.data.ride.totalDistance,
            distanceLabel: etaResponse.data.data.ride.distanceLabel,
          };
        });

        setFares(faresResponse.data.data.fares);
        setETA(etaResponse.data.data.ride);
        setSelectedRide(updatedRides[3]);

        rides.length = 0;
        rides.push(...updatedRides);
      } catch (err) {
        console.error("Error fetching ride details:", err);
        setError("Failed to fetch ride information");
      } finally {
        setLoading(false);
      }
    };

    if (pickup && dropoff) {
      fetchRideDetails();
    }
  }, [pickup, dropoff]);

  const handleBackFromRides = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleRideSelect = (ride) => {
    setSelectedRide(ride);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p>{error}</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // TODO: we need to use this Riding Component after the RideConfirmation Component is done

  if (showConfirm) {
    return (
      <RideConfirm
        selectedRide={selectedRide}
        pickup={pickup}
        dropoff={dropoff}
        onNext={() => {
          setShowConfirm(false);
          setShowConfirmation(true);
        }}
        onBack={handleBackFromRides}
      />
    );
  }

  if (showConfirmation) {
    return (
      <RideConfirmation
        pickup={pickup}
        dropoff={dropoff}
        onCancel={() => setShowConfirmation(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Enhanced Header */}
      <div className="bg-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <button
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
            onClick={onBack}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full">
              <Clock className="h-5 w-5 text-gray-700" />
              <span className="text-gray-900 font-medium">Pickup now</span>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full">
              <User className="h-5 w-5 text-gray-700" />
              <span className="text-gray-900 font-medium">For me</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Promotion Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-full">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
          <span className="text-white font-medium">
            23% promotion applied to your ride
          </span>
        </div>
      </div>

      {/* Enhanced Ride Options */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {rides.map((ride) => (
          <div
            key={ride.id}
            onClick={() => handleRideSelect(ride)}
            className={`mb-4 cursor-pointer transition-all rounded-2xl bg-white hover:shadow-lg ${
              selectedRide.id === ride.id
                ? "ring-2 ring-black shadow-md"
                : "border border-gray-100"
            }`}
          >
            <div className="flex items-center p-5 gap-5">
              {/* Left - Vehicle Icon */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center p-2">
                  <img
                    src={ride.icon}
                    alt={ride.name}
                    className="w-16 h-16 object-contain"
                  />
                </div>
                {selectedRide.id === ride.id && (
                  <div className="absolute -top-2 -right-2 bg-black text-white p-1.5 rounded-full">
                    <svg
                      className="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Middle - Name and Description */}
              <div className="flex-grow min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {ride.name}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {ride.description}
                </p>
              </div>

              {/* Right - Price and Details */}
              <div className="flex-shrink-0 text-right">
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  ₹{ride.price}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-end gap-2 text-gray-600">
                    <Timer className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm whitespace-nowrap font-medium">
                      {ride.etaLabel || "Calculating..."}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm whitespace-nowrap font-medium">
                      {ride.distanceLabel || "Calculating..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Footer */}
      <div className="bg-white px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full bg-black text-white py-4 rounded-xl text-lg font-semibold hover:bg-gray-900 active:bg-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        >
          Confirm {selectedRide.name}
        </button>
      </div>
    </div>
  );
};

export default RideOptions;
