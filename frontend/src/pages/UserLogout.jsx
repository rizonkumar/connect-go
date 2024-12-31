import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/authApi";
import { UserDataContext } from "../context/UserContext";

const UserLogout = ({ onLogoutSuccess }) => {
  const navigate = useNavigate();
  const { setUser } = useContext(UserDataContext);

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout("user");
      } catch (error) {
        console.error("Logout failed:", error);
      } finally {
        // Clear user context
        setUser({
          email: "",
          fullName: {
            firstName: "",
            lastName: "",
          },
        });

        // Clear local storage
        localStorage.removeItem("userToken");

        // Call success callback if provided
        if (onLogoutSuccess) {
          onLogoutSuccess();
        }

        // Navigate to home
        navigate("/user-home", { replace: true });
      }
    };

    performLogout();
  }, [onLogoutSuccess, setUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      <span className="ml-2">Logging out...</span>
    </div>
  );
};

export default UserLogout;
