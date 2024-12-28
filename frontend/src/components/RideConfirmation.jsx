import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import AcceptedRideDetails from "./Captain/AcceptedRideDetails";
import { getDistanceTime } from "../api/userApi";

const RideConfirmation = ({ pickup, dropoff, onCancel }) => {
  const [isSearching, setIsSearching] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const socket = useSocket();
  const [acceptedRide, setAcceptedRide] = useState(null);
  const [distanceTime, setDistanceTime] = useState(null);

  // Calculate distance and time when component mounts
  useEffect(() => {
    const calculateDistanceTime = async () => {
      try {
        if (!pickup || !dropoff) return;
        const response = await getDistanceTime(pickup, dropoff);
        setDistanceTime(response.data.data.distanceTime);
      } catch (error) {
        console.error("Error calculating distance and time:", error);
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
      socket.on("ride:accepted", (acceptedRideData) => {
        console.log("Ride accepted event received:", acceptedRideData);
        clearInterval(timerId);
        setIsSearching(false);
        setShowCancelConfirm(false);

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
          distance: distanceTime?.distance || "Calculating...",
          duration: acceptedRideData.duration,
          durationText: acceptedRideData.durationText,
          otp: acceptedRideData.otp,
          rideId: acceptedRideData.rideId,
          status: "accepted",
        };

        setAcceptedRide(formattedRideData);
      });

      socket.on("ride:cancelled", ({ rideId }) => {
        if (acceptedRide?.rideId === rideId) {
          setAcceptedRide(null);
          setIsSearching(false);
          onCancel();
        }
      });

      socket.on("ride:error", (error) => {
        console.error("Ride error:", error);
        setIsSearching(false);
        onCancel();
      });
    }

    return () => {
      clearInterval(timerId);
      if (socket) {
        socket.off("ride:accepted");
        socket.off("ride:cancelled");
        socket.off("ride:error");
      }
    };
  }, [socket, pickup, dropoff, distanceTime, acceptedRide, onCancel]);

  const handleCancel = () => {
    if (socket && acceptedRide) {
      socket.emit("ride:cancel", acceptedRide.rideId);
    }
    setIsSearching(false);
    onCancel();
  };

  if (!isSearching && acceptedRide) {
    return (
      <AcceptedRideDetails
        rideDetails={acceptedRide}
        onCancel={() => setShowCancelConfirm(true)}
        onGoToPickup={() => console.log("Go to pickup")}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Map Area */}
      <div className="flex-1 relative bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-lg shadow-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 space-y-4">
        {/* Header with Search Status and Timer */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-medium">Looking for nearby drivers</h2>
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
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-black mt-2"></div>
            <div>
              <h3 className="font-medium">{pickup}</h3>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-black mt-2"></div>
            <div>
              <h3 className="font-medium">{dropoff}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:w-[400px] md:rounded-xl rounded-t-xl p-4 space-y-4">
            <h3 className="text-lg font-medium">Cancel Ride?</h3>
            <p className="text-gray-600">
              No drivers found nearby. Would you like to cancel the ride?
            </p>
            <div className="space-y-2">
              <button
                onClick={handleCancel}
                className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Yes, Cancel Ride
              </button>
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  setTimeLeft(30);
                  setIsSearching(true);
                }}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
