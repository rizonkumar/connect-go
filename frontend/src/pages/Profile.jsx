import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserDataContext } from "../context/UserContext";
import { CaptainDataContext } from "../context/CaptainContext";
import { Mail, Car, DollarSign, ChevronLeft } from "lucide-react";
import { getUserProfile, getRideHistory } from "../api/userApi";
import { getCaptainProfile, getCaptainRideHistory } from "../api/captainApi";

import {
  EmptyRideHistory,
  InfoItem,
  ProfileHeader,
  RideHistoryCard,
} from "./ProfileComponents";
import { ErrorState, LoadingSpinner } from "./LoadingSpinner";

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserDataContext);
  const { captain, setCaptain } = useContext(CaptainDataContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rideHistory, setRideHistory] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const isUserProfile = !!user;
  const isCaptainProfile = !!captain;

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isCaptainProfile) {
        const [profileResponse, rideHistoryResponse] = await Promise.all([
          getCaptainProfile(),
          getCaptainRideHistory(),
        ]);

        if (profileResponse.data.success) {
          setCaptain(profileResponse.data.data.captain);
        }

        if (rideHistoryResponse.data.success) {
          const { totalRides, totalEarnings, rides } =
            rideHistoryResponse.data.data;
          setRideHistory(rides);
          setTotalEarnings(totalEarnings);
        }
      } else if (isUserProfile) {
        const [profileResponse, rideHistoryResponse] = await Promise.all([
          getUserProfile(),
          getRideHistory(),
        ]);

        if (profileResponse.data.success) {
          setUser(profileResponse.data.data.user);
        }

        if (rideHistoryResponse.data.success) {
          setRideHistory(rideHistoryResponse.data.data.rideHistory);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [isCaptainProfile, isUserProfile, setCaptain, setUser]);

  useEffect(() => {
    if (isUserProfile || isCaptainProfile) {
      fetchProfileData();
    } else {
      navigate("/welcome");
    }
  }, [isUserProfile, isCaptainProfile, fetchProfileData, navigate]);

  useEffect(() => {
    if (!isUserProfile && !isCaptainProfile) {
      navigate("/welcome");
    }
  }, [isUserProfile, isCaptainProfile, navigate]);

  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => navigate("/welcome")} />;
  }

  const profileData = isCaptainProfile ? captain : user;
  const fullName = `${profileData.fullName.firstName} ${profileData.fullName.lastName}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() =>
                navigate(isCaptainProfile ? "/captain-home" : "/home")
              }
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
            <div className="w-12"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <ProfileHeader
                name={fullName}
                type={isCaptainProfile ? "Professional Driver" : "Passenger"}
                email={profileData.email}
              />

              <div className="p-6 space-y-4">
                <InfoItem icon={Mail} label="Email" value={profileData.email} />

                {isCaptainProfile && (
                  <>
                    <InfoItem
                      icon={Car}
                      label="Vehicle"
                      value={`${captain.vehicle.color} ${captain.vehicle.vehicleType} - ${captain.vehicle.plate}`}
                    />
                    <InfoItem
                      icon={DollarSign}
                      label="Total Earnings"
                      value={`₹${totalEarnings.toFixed(2)}`}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Ride History Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isCaptainProfile ? "Trip History" : "Your Rides"}
                </h3>
              </div>

              <div className="p-6">
                {!rideHistory || rideHistory.length === 0 ? (
                  <EmptyRideHistory
                    isCaptain={isCaptainProfile}
                    onAction={() =>
                      navigate(isCaptainProfile ? "/captain-home" : "/home")
                    }
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-1">
                    {rideHistory.map((ride, index) => (
                      <RideHistoryCard key={index} ride={ride} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
