import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPasswor } from "../../services/auth";
import HCaptcha from "@hcaptcha/react-hcaptcha";
const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);
  const navigate = useNavigate();

  const handleVerify = (token) => {
    setCaptchaToken(token);
    setError("");
  };

  const onCaptchaError = (err) => {
    setError("Xác thực captcha thất bại. Vui lòng thử lại.");
    console.error("Captcha error:", err);
    setCaptchaToken(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!captchaToken) {
      setError("Vui lòng xác thực captcha");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await forgotPasswor({ email, captchaToken });
      setMessage(response.message);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } catch (err) {
      setError(err.response?.data?.message || "Đã xảy ra lỗi");
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Quên mật khẩu
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Địa chỉ email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Nhập địa chỉ email"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <HCaptcha
                sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
                onVerify={handleVerify}
                onError={onCaptchaError}
                ref={captchaRef}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !captchaToken}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading || !captchaToken
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isLoading ? "Đang xử lý..." : "Gửi yêu cầu"}
            </button>
          </div>
          {message && <p className="text-green-600 text-center">{message}</p>}
          {error && <p className="text-red-600 text-center">{error}</p>}
        </form>
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
