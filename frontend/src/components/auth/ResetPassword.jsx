import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/auth";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    try {
      const response = await resetPassword(token, password);
      setMessage(response.message);
      setError("");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError("");
      if (err.response?.data?.missingInfo) {
        const missingInfo = err.response.data.missingInfo;
        const missingFields = [];
        if (missingInfo.fullName) missingFields.push("họ tên");
        if (missingInfo.email) missingFields.push("email");

        setError(
          <div>
            <p>{err.response.data.message}</p>
            <p className="mt-2">
              Thông tin còn thiếu: {missingFields.join(", ")}
            </p>
            <button
              onClick={() => navigate("/member/profile")}
              className="mt-2 text-indigo-600 hover:text-indigo-500 underline"
            >
              Cập nhật thông tin cá nhân
            </button>
          </div>,
        );
      } else {
        setError(err.response?.data?.message || "Đã xảy ra lỗi");
      }
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đặt lại mật khẩu
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                Mật khẩu mới
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength="6"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength="6"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {message && (
            <div className="text-green-500 text-sm text-center">{message}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Đặt lại mật khẩu
            </button>
          </div>
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
            <p className="font-medium mb-1">Lưu ý về mật khẩu mới:</p>
            <p>
              Mật khẩu phải có ít nhất 8 ký tự và bao gồm chữ hoa, chữ thường,
              số và ký tự đặc biệt.
            </p>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
