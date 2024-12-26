import { useCallback } from "react";
import { MapPin, ArrowLeft, Clock } from "lucide-react";
import { createRide } from "../api/userApi";

const RideConfirm = ({ selectedRide, pickup, dropoff, onNext, onBack }) => {
  const handleBackClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof onBack === "function") {
        onBack();
      }
    },
    [onBack]
  );

  const handleConfirm = async () => {
    try {
      if (!pickup || !dropoff) {
        console.error("Pickup and destination are required");
        return;
      }

      let vehicleType;
      switch (selectedRide.name) {
        case "Connect Auto":
          vehicleType = "auto";
          break;
        case "Premier":
          vehicleType = "car";
          break;

        case "Connect Moto":
          vehicleType = "motorcycle";
          break;

        default:
          vehicleType = "auto";
      }

      const response = await createRide(pickup, dropoff, vehicleType);
      console.log("Create ride response:", response); // For debugging

      if (response.data.status === "success") {
        onNext();
      } else {
        throw new Error(response?.data?.message || "Failed to create ride");
      }
    } catch (error) {
      console.error("Error Creating Ride", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Map Area */}
      <div className="flex-1 relative bg-gray-100">
        {/* Header with Back Button and Title */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          {/* Back Button with white circular background */}
          <button
            type="button"
            onClick={handleBackClick}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors cursor-pointer z-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Title */}
          <div className="flex-1 flex justify-center">
            <div className="bg-white px-6 py-2 rounded-full shadow-md">
              <span className="font-medium">Choose a Vehicle</span>
            </div>
          </div>
        </div>

        {/* Centered Vehicle Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
            <img
              src={selectedRide?.icon}
              alt={selectedRide?.name}
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="bg-white rounded-t-3xl -mt-6">
        <div className="p-6 space-y-6">
          {/* Title and Pickup Info */}
          <div>
            <h2 className="text-2xl font-bold mb-1">Confirm your Ride</h2>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Immediate pickup</span>
            </div>
          </div>

          {/* Ride Details Card */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start gap-4">
              <img
                src={selectedRide?.icon}
                alt={selectedRide?.name}
                className="w-14 h-14 object-contain"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedRide.name}
                    </h3>
                    <p className="text-gray-500 mt-1">
                      {selectedRide.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold">
                      ₹{selectedRide.price}
                    </p>
                    <p className="text-sm text-gray-500 line-through">
                      ₹{selectedRide.originalPrice}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-gray-600">
                  <MapPin className="h-5 w-5" />
                  <span>{pickup}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl">💵</span>
              <span className="font-medium text-lg">Cash</span>
            </div>
            <button className="text-blue-600 font-medium hover:text-blue-800 transition-colors cursor-pointer">
              Change
            </button>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white py-4 rounded-xl text-lg font-medium transition-colors cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideConfirm;
