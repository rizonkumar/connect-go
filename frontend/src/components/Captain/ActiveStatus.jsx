import { useState, useEffect } from "react";
import {
  MapPin,
  Power,
  Navigation2,
  CreditCard,
  ThumbsUp,
  User,
  ThumbsDown,
  Circle,
} from "lucide-react";
import { useSocket } from "../../context/SocketContext";

const ActiveStatus = ({ onIgnore, onToggleOnline, isOnline, onAcceptRide }) => {
  const socket = useSocket();
  const [activeRequest, setActiveRequest] = useState(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for new ride requests
    socket.on("ride:new_request", (rideData) => {
      console.log("New ride request received:", rideData);
      setActiveRequest(rideData);
    });

    // Clear request when it becomes unavailable
    socket.on("ride:unavailable", (rideId) => {
      if (activeRequest && activeRequest.rideId === rideId) {
        setActiveRequest(null);
      }
    });

    return () => {
      socket.off("ride:new_request");
      socket.off("ride:unavailable");
    };
  }, [socket, activeRequest]);

  if (!activeRequest) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-black text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Power className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full"></div>
            </div>
            <span className="font-medium">Online</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={onToggleOnline}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-green-500 peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Waiting for rides
            </h3>
            <p className="text-gray-500">New ride requests will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Map Section */}
      <div className="relative h-[60vh] bg-gray-200">
        <img
          src="https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif"
          alt="Map"
          className="w-full h-full object-cover"
        />
        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors">
            <Navigation2 className="h-5 w-5" />
          </button>
          <button className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors">
            <MapPin className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Ride Request Card */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3"></div>
        <div className="p-6 space-y-4">
          {/* User Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {activeRequest.userName || "New Request"}
                </h3>
                <div className="flex gap-2 mt-1">
                  <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-sm">
                    <CreditCard className="h-4 w-4" />
                    <span>{activeRequest.paymentMethod || "Cash"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">₹{activeRequest.fare}</p>
              <p className="text-sm text-gray-500">
                {activeRequest.distance} km
              </p>
            </div>
          </div>

          {/* Pickup & Dropoff */}
          <div className="space-y-4 relative">
            <div className="absolute left-[21px] top-8 bottom-8 w-0.5 bg-gray-200"></div>
            <div className="flex items-start gap-4">
              <Circle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-xs font-medium text-gray-500">PICK UP</p>
                <p className="font-medium">{activeRequest.pickup}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-5 w-5 rounded-sm bg-black flex-shrink-0 mt-1"></div>
              <div>
                <p className="text-xs font-medium text-gray-500">DROP OFF</p>
                <p className="font-medium">{activeRequest.destination}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={onIgnore}
              className="flex-1 py-4 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <ThumbsDown className="h-5 w-5" />
              <span>Ignore</span>
            </button>
            <button
              onClick={() => onAcceptRide(activeRequest)}
              className="flex-1 py-4 bg-yellow-400 rounded-xl font-medium hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
            >
              <ThumbsUp className="h-5 w-5" />
              <span>Accept</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveStatus;
