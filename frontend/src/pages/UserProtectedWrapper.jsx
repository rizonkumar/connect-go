import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { verifyToken } from "../api/authApi";

const UserProtectedWrapper = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const isValid = verifyToken("user");
      if (!isValid) {
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate]);

  return <div>{children}</div>;
};

export default UserProtectedWrapper;
