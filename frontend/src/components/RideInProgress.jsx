import { Phone, MessageSquare, X, MapPin, Shield } from "lucide-react";

const RideInProgress = ({ rideDetails, onCancel }) => {
  const { captain, pickup, dropoff, fare, otp, duration, durationText } =
    rideDetails;

  console.log("Ride Details: ---->>", rideDetails);
  console.log("111111");
  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Ride is Confirmed</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Captain Details */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
            <img
              src={captain.image || "https://via.placeholder.com/100"}
              alt={captain.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{captain.name}</h3>
            <p className="text-gray-600">
              {captain.vehicle.color}{" "}
              {captain.vehicle.vehicleType.toUpperCase()} •{" "}
              {captain.vehicle.plate}
            </p>
          </div>
        </div>
      </div>

      {/* OTP Section */}
      <div className="p-4 bg-blue-50 border-y border-blue-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-600">Share OTP with driver</p>
            <p className="text-2xl font-bold">{otp}</p>
          </div>
          <Shield className="h-8 w-8 text-blue-500" />
        </div>
      </div>

      {/* Ride Details */}
      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500">PICKUP</p>
              <p className="font-medium">{pickup.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-900 mt-1" />
            <div>
              <p className="text-sm text-gray-500">DROP-OFF</p>
              <p className="font-medium">{dropoff.address}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center border-t pt-4">
          <div>
            <p className="text-sm text-gray-500">ESTIMATED ARRIVAL</p>
            <p className="font-medium">{durationText || `${duration} mins`}</p>
          </div>
          <p className="text-xl font-bold">₹{fare}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <div className="flex justify-around">
          <button className="flex flex-col items-center gap-1">
            <div className="p-3 bg-gray-100 rounded-full">
              <Phone className="h-5 w-5" />
            </div>
            <span className="text-sm">Call</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <div className="p-3 bg-gray-100 rounded-full">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-sm">Message</span>
          </button>
          <button
            onClick={onCancel}
            className="flex flex-col items-center gap-1"
          >
            <div className="p-3 bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </div>
            <span className="text-sm">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideInProgress;
