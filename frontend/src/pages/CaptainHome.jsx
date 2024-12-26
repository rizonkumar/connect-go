import { useContext, useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { CaptainDataContext } from "../context/CaptainContext";
import InactiveStatus from "../components/Captain/InactiveStatus";
import { captainStats } from "../../constants/data";
import ActiveStatus from "../components/Captain/ActiveStatus";
import RideRequest from "../components/Captain/RideRequest";
import AcceptedRideDetails from "../components/Captain/AcceptedRideDetails";
import PickupContainer from "../components/Captain/PickupContainer";
import ProfileDropdown from "../components/ProfileDropdown";

const CaptainHome = () => {
  const socket = useSocket();
  const { captain } = useContext(CaptainDataContext);
  const [isOnline, setIsOnline] = useState(false);
  const [showRideRequests, setShowRideRequests] = useState(false);
  const [acceptedRide, setAcceptedRide] = useState(null);
  const [showPickup, setShowPickup] = useState(false);
  const [rideRequests, setRideRequests] = useState([]);

  useEffect(() => {
    if (!socket) return;

    if (socket && isOnline && captain) {
      // Emit captain online status
      socket.emit("captain:online", {
        id: captain.id,
        location: captain.location,
        vehicleType: captain.vehicle.vehicleType,
      });

      // Listen for new ride requests
      socket.on("ride:new_request", (rideData) => {
        console.log("New Ride Request Received", rideData);
        setRideRequests((prev) => [...prev, rideData]);
        setShowRideRequests(true);
      });

      // Listen for ride unavailable (when another captain accepts the ride)
      socket.on("ride:unavailable", (rideId) => {
        console.log("Ride Unavailable", rideId);
        setRideRequests((prev) =>
          prev.filter((request) => request.rideId !== rideId)
        );
      });
    }

    // Cleanup function
    return () => {
      if (socket) {
        socket.off("ride:new_request");
        socket.off("ride:unavailable");
        if (isOnline && captain) {
          socket.emit("captain:offline", captain._id);
        }
      }
    };
  }, [socket, isOnline, captain]);

  const handleGoOnline = () => {
    setIsOnline(true);
  };

  const handleGoOffline = () => {
    if (socket && captain) {
      socket.emit("captain:offline", captain._id);
    }
    setIsOnline(false);
    setShowRideRequests(false);
    setAcceptedRide(null);
  };

  const handleIgnoreRide = () => {
    setShowRideRequests(true);
  };

  const handleBackFromRequests = () => {
    setShowRideRequests(false);
  };

  const handleAcceptRide = (ride) => {
    if (socket) {
      console.log("Accepting ride:", ride);
      socket.emit("ride:accept", {
        rideId: ride.rideId,
        captainId: captain._id,
        userId: ride.userId,
        captain: {
          id: captain._id,
          name: `${captain.fullName.firstName} ${captain.fullName.lastName}`,
          vehicleInfo: captain.vehicle,
        },
      });
    }
    setAcceptedRide(ride);
    setShowRideRequests(false);
  };

  const handleCancelRide = () => {
    setAcceptedRide(null);
    setShowPickup(false);
  };

  const handleGoToPickup = () => {
    setShowPickup(true);
  };

  const handleFindNewRides = () => {
    setIsOnline(false);
    setAcceptedRide(null);
    setShowPickup(false);
  };

  return (
    <div>
      {!isOnline ? (
        <InactiveStatus
          {...captainStats}
          onGoOnline={handleGoOnline}
          headerRight={<ProfileDropdown userType="captain" />}
        />
      ) : (
        <>
          {/* Header for online status */}
          <div className="bg-black text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-medium">Online</span>
            </div>
            <ProfileDropdown userType="captain" />
          </div>

          {!showRideRequests && !acceptedRide && !showPickup && (
            <ActiveStatus
              onToggleOnline={handleGoOffline}
              isOnline={isOnline}
              onAcceptRide={handleAcceptRide}
            />
          )}

          {showRideRequests && (
            <RideRequest
              requests={rideRequests}
              onBack={() => setShowRideRequests(false)}
              onToggleOnline={handleGoOffline}
              isOnline={isOnline}
              onAcceptRide={handleAcceptRide}
            />
          )}

          {acceptedRide && !showPickup && (
            <AcceptedRideDetails
              rideDetails={acceptedRide}
              onCancel={() => {
                setAcceptedRide(null);
                setShowPickup(false);
              }}
              onGoToPickup={() => setShowPickup(true)}
            />
          )}

          {showPickup && acceptedRide && (
            <PickupContainer
              pickup={acceptedRide.pickup}
              onBack={() => setShowPickup(false)}
              onFindNewRides={() => {
                setAcceptedRide(null);
                setShowPickup(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CaptainHome;
