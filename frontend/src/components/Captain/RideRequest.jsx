import { Power, Circle, Square, ArrowLeft, User, Clock } from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { acceptRide } from "../../api/captainApi";
import { toast } from "react-toastify";

const RideRequest = ({
  requests,
  onBack,
  onToggleOnline,
  isOnline,
  onAcceptRide,
}) => {
  const socket = useSocket();

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const handleAcceptRide = async (request) => {
    try {
      const response = await acceptRide(request.rideId);
      console.log("Accept Ride Response:", response);
      if (response.data.status === "success") {
        // Call the parent handler
        onAcceptRide(request);
      } else {
        throw new Error(response.data.message || "Failed to accept ride");
      }
    } catch (error) {
      console.error("Error accepting ride:", error);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
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

      {/* Notification Banner */}
      {requests.length > 0 && (
        <div className="fixed top-[60px] left-0 right-0 bg-orange-500 text-white p-3 text-center z-40">
          You have {requests.length} new{" "}
          {requests.length === 1 ? "request" : "requests"}.
        </div>
      )}

      {/* Ride Requests List */}
      <div className="pt-[120px] pb-4 px-4 md:max-w-2xl md:mx-auto">
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Active Requests
              </h3>
              <p className="text-gray-500">
                New ride requests will appear here
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.rideId}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* User Info Section */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          New Ride Request
                        </h3>
                        <div className="flex gap-2 mt-1">
                          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-0.5 rounded-md">
                            {request.distance} km
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(request.fare)}
                      </p>
                      <p className="text-sm text-gray-500">Estimated</p>
                    </div>
                  </div>
                </div>

                {/* Ride Details */}
                <div className="p-4 bg-gray-50 space-y-4">
                  {/* Pickup Location */}
                  <div className="flex items-start gap-3">
                    <Circle className="w-4 h-4 text-gray-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        PICK UP
                      </p>
                      <p className="font-medium text-gray-900">
                        {request.pickup}
                      </p>
                    </div>
                  </div>

                  {/* Dropoff Location */}
                  <div className="flex items-start gap-3">
                    <Square className="w-4 h-4 text-black mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        DROP OFF
                      </p>
                      <p className="font-medium text-gray-900">
                        {request.destination}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Accept Button */}
                <button
                  onClick={() => handleAcceptRide(request)}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-4 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Accept Ride</span>
                  <ArrowLeft className="h-5 w-5 rotate-180" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RideRequest;
