import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/authApi";
import { CaptainDataContext } from "../context/CaptainContext";

const CaptainLogout = ({ onLogoutSuccess }) => {
  const navigate = useNavigate();
  const { setCaptain } = useContext(CaptainDataContext);

  const performLogout = async () => {
    console.log("Performing captain logout outside of useEffect...");
    try {
      await logout("captain");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Clear captain context
      setCaptain(null);

      // Clear local storage
      localStorage.removeItem("captainToken");

      // Call success callback if provided
      if (onLogoutSuccess) {
        onLogoutSuccess();
      }

      // Navigate to home
      navigate("/captain-login", { replace: true });
    }
  };

  useEffect(() => {
    console.log("Performing logout...");
    performLogout();
  }, [onLogoutSuccess, setCaptain]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      <span className="ml-2">Logging out...</span>
    </div>
  );
};

export default CaptainLogout;
