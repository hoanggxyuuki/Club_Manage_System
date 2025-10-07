import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get("token");
        const role = searchParams.get("role");
        const error = searchParams.get("error");

        if (error) {
          console.error("Google login error:", error);
          navigate("/login");
          return;
        }

        if (!token || !role) {
          console.error("Missing token or role in callback");
          navigate("/login");
          return;
        }

        
        await login({ googleToken: token });

        
        navigate(role === "admin" ? "/admin" : "/member");
      } catch (error) {
        console.error("Error during Google callback:", error);
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate, searchParams, login]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <LoadingSpinner size="md" text="Đang xử lý đăng nhập..." />
      </div>
    </div>
  );
};

export default GoogleCallback;
