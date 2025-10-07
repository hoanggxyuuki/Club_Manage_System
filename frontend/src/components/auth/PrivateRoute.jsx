import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PrivateRoute = ({ children, requiredRoles = [], requiredRole }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const roles = requiredRole ? [requiredRole] : requiredRoles;

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/member"} />;
  }

  return children;
};

export default PrivateRoute;
