import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/authApi";
import { CaptainDataContext } from "../context/CaptainContext";

const CaptainLogout = ({ onLogoutSuccess }) => {
  const navigate = useNavigate();
  const { setCaptain } = useContext(CaptainDataContext);

  useEffect(() => {
    const performLogout = async () => {
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
        navigate("/", { replace: true });
      }
    };

    performLogout();
    // Adding navigate and other dependencies
  }, [navigate, setCaptain, onLogoutSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      <span className="ml-2">Logging out...</span>
    </div>
  );
};

export default CaptainLogout;
