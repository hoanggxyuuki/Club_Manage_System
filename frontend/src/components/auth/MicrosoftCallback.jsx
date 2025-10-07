import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const MicrosoftCallback = () => {
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
          console.error("Microsoft login error:", error);
          navigate("/login");
          return;
        }

        if (!token || !role) {
          console.error("Missing token or role in callback");
          navigate("/login");
          return;
        }

        
        await login({ microsoftToken: token });

        
        navigate(role === "admin" ? "/admin" : "/member");
      } catch (error) {
        console.error("Error during Microsoft callback:", error);
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate, searchParams, login]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center space-x-2">
          <svg
            className="animate-spin h-5 w-5 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-gray-700">Đang xử lý đăng nhập...</span>
        </div>
      </div>
    </div>
  );
};

export default MicrosoftCallback;
