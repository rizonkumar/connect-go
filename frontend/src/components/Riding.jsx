import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Navigation,
  Phone,
  MessageSquare,
  Shield,
  Star,
  Clock,
  Share2,
  Circle,
  Square,
  ArrowRight,
  Car,
} from "lucide-react";
import { activeRideData } from "../../constants/data";

console.log("1");

const Riding = () => {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleCallDriver = () => {
    window.location.href = `tel:${activeRideData.driver.phone}`;
  };

  const handlePayment = () => {
    setShowPaymentModal(true);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Map Section */}
      <div className="relative h-[45vh] bg-gray-200">
        <img
          src="https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif"
          alt="Live Map"
          className="w-full h-full object-cover"
        />
        {/* Navigation overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 active:scale-95 transition-transform"
          >
            <Navigation className="h-6 w-6" />
          </button>
          <button className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 active:scale-95 transition-transform">
            <Share2 className="h-6 w-6" />
          </button>
        </div>

        {/* Trip Progress Indicator - Centered at bottom of map */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
          <Car className="h-5 w-5 text-blue-500" />
          <span className="font-medium">On the way to destination</span>
        </div>
      </div>

      {/* Ride Details Section */}
      <div className="flex-1 bg-white -mt-6 rounded-t-3xl">
        <div className="h-full flex flex-col">
          {/* Trip Status */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">Trip in Progress</p>
                  <p className="text-sm text-blue-600">You'll reach soon</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-blue-900">
                  {activeRideData.trip.distance}
                </span>
                <span className="text-sm text-blue-600">
                  {activeRideData.trip.duration} left
                </span>
              </div>
            </div>
          </div>

          {/* Driver Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-4">
              <img
                src={activeRideData.driver.image}
                alt={activeRideData.driver.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {activeRideData.driver.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{activeRideData.driver.rating}</span>
                  <span>•</span>
                  <span>{activeRideData.driver.vehicleModel}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Car className="h-4 w-4" />
                  <span>{activeRideData.driver.vehicleNumber}</span>
                  <span>•</span>
                  <span>{activeRideData.driver.vehicleColor}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-around mt-6">
              <button
                onClick={handleCallDriver}
                className="flex flex-col items-center gap-2"
              >
                <div className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-transform">
                  <Phone className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Call</span>
              </button>
              <button className="flex flex-col items-center gap-2">
                <div className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-transform">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Message</span>
              </button>
              <button className="flex flex-col items-center gap-2">
                <div className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-transform">
                  <Shield className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Safety</span>
              </button>
            </div>
          </div>

          {/* Trip Route */}
          <div className="flex-1 p-4">
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute left-[7px] top-8 bottom-8 w-0.5 bg-gray-200"></div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Circle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {activeRideData.trip.pickup}
                      </p>
                      <p className="text-sm text-gray-500">Pickup point</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Square className="h-4 w-4 text-black flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {activeRideData.trip.dropoff}
                      </p>
                      <p className="text-sm text-gray-500">Drop-off point</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="p-4 border-t">
            <button
              onClick={handlePayment}
              className="w-full bg-black text-white py-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-[0.99] transition-all"
            >
              <span>Pay ₹{activeRideData.trip.fare}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end animate-fade-up">
          <div className="bg-white w-full rounded-t-xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Choose payment method</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {activeRideData.paymentOptions.map((option) => (
                <button
                  key={option.id}
                  className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 border border-gray-100 active:scale-[0.99] transition-transform"
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="font-medium">{option.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Riding;
