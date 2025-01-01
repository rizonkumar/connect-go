import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { getDistanceTime } from "../api/userApi";
import RideInProgress from "./RideInProgress";
import { Circle } from "lucide-react";

const RideConfirmation = ({ pickup, dropoff, onCancel }) => {
  const [isSearching, setIsSearching] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const socket = useSocket();
  const [acceptedRide, setAcceptedRide] = useState(null);
  const [distanceTime, setDistanceTime] = useState(null);
  const [error, setError] = useState(null);

  // Calculate distance and time when component mounts
  useEffect(() => {
    const calculateDistanceTime = async () => {
      try {
        if (!pickup || !dropoff) return;
        const response = await getDistanceTime(pickup, dropoff);
        if (response.data.status === "success") {
          setDistanceTime(response.data.data.distanceTime);
        }
      } catch (error) {
        console.error("Error calculating distance and time:", error);
        setError("Failed to calculate ride details");
      }
    };

    calculateDistanceTime();
  }, [pickup, dropoff]);

  useEffect(() => {
    let timerId;

    if (isSearching && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setShowCancelConfirm(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (socket) {
      // Join user's room
      socket.emit("join:user", { userId: socket.id });

      socket.on("ride:accepted", (acceptedRideData) => {
        console.log("Ride accepted event received:", acceptedRideData);

        // Clear timer and update states
        clearInterval(timerId);
        setIsSearching(false);
        setShowCancelConfirm(false);
        setTimeLeft(0);

        const formattedRideData = {
          passenger: {
            name: acceptedRideData.captain.name,
            image:
              acceptedRideData.captain.image ||
              "https://via.placeholder.com/100",
          },
          captain: {
            ...acceptedRideData.captain,
            vehicle: acceptedRideData.captain.vehicle,
          },
          pickup: {
            address: pickup,
          },
          dropoff: {
            address: dropoff,
          },
          fare: acceptedRideData.fare,
          distance: acceptedRideData.distance || "Calculating...",
          duration: acceptedRideData.duration,
          durationText: acceptedRideData.durationText,
          otp: acceptedRideData.otp,
          rideId: acceptedRideData.rideId,
          status: "accepted",
        };

        console.log("Setting accepted ride data:", formattedRideData);
        setAcceptedRide(formattedRideData);
      });

      socket.on("ride:error", (error) => {
        console.error("Ride error:", error);
        clearInterval(timerId);
        setIsSearching(false);
        setError(error.message || "Failed to process ride request");
        onCancel();
      });

      // Listen for ride unavailable (when ride is cancelled or expired)
      socket.on("ride:unavailable", () => {
        clearInterval(timerId);
        setIsSearching(false);
        setShowCancelConfirm(true);
      });
    }

    return () => {
      if (timerId) clearInterval(timerId);
      if (socket) {
        socket.off("ride:accepted");
        socket.off("ride:error");
        socket.off("ride:unavailable");
      }
    };
  }, [socket, pickup, dropoff, onCancel]);

  const handleCancel = () => {
    if (socket && acceptedRide) {
      socket.emit("ride:cancel", acceptedRide.rideId);
    }
    setIsSearching(false);
    onCancel();
  };

  const handleKeepSearching = () => {
    setShowCancelConfirm(false);
    setTimeLeft(30);
    setIsSearching(true);
  };

  // If ride is accepted, show RideInProgress
  if (!isSearching && acceptedRide) {
    console.log("Rendering RideInProgress with:", acceptedRide);
    return (
      <RideInProgress rideDetails={acceptedRide} onCancel={handleCancel} />
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="mb-4 text-red-500">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Map Area */}
      <div className="h-[60vh] bg-gray-100 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-lg shadow-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl -mt-6">
        <div className="p-6 space-y-4">
          {/* Header with Search Status and Timer */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium text-gray-900">
                Looking for nearby drivers
              </h2>
              <p className="text-gray-500">Time remaining: {timeLeft}s</p>
            </div>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-red-500 hover:text-red-600 font-medium"
            >
              Cancel
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            ></div>
          </div>

          {/* Location Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Circle className="w-4 h-4 text-blue-500 mt-1.5" />
              <div>
                <p className="text-sm text-gray-500">PICKUP</p>
                <p className="font-medium text-gray-900">{pickup}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Circle className="w-4 h-4 text-black mt-1.5" />
              <div>
                <p className="text-sm text-gray-500">DROP-OFF</p>
                <p className="font-medium text-gray-900">{dropoff}</p>
              </div>
            </div>
            {distanceTime && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-gray-800">Estimated journey time:</p>
                  <p className="font-medium">{distanceTime.durationText}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Cancel Ride?
            </h3>
            <p className="text-gray-600">
              {timeLeft === 0
                ? "No drivers found nearby. Would you like to cancel the ride?"
                : "Are you sure you want to cancel your ride request?"}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleCancel}
                className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Yes, Cancel Ride
              </button>
              <button
                onClick={handleKeepSearching}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Keep Searching
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideConfirmation;
