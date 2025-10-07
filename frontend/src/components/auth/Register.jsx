import React, { useState, useEffect, useRef } from "react";
import { getRegistrationStatus } from "../../services/systemConfig";
import { useAuth } from "../../context/AuthContext";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useNavigate } from "react-router-dom";


const generateUsername = (fullName) => {
  if (!fullName) return "";
  
  return fullName
    .normalize("NFD") 
    .replace(/[\u0300-\u036f]/g, "") 
    .toLowerCase()
    .replace(/\s+/g, ""); 
};

const Register = () => {
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  });
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRegistrationSetting = async () => {
      try {
        setLoading(true);
        const statusData = await getRegistrationStatus();
        if (statusData && typeof statusData.registrationEnabled === "boolean") {
          setRegistrationOpen(statusData.registrationEnabled);
        } else {
          console.warn(
            "Registration status data is not in expected format:",
            statusData,
          );
          setRegistrationOpen(false);
        }
        setSubmitError(null);
      } catch (err) {
        console.error(
          "Failed to fetch registration status for register page:",
          err,
        );
        setSubmitError(
          err.message ||
            "Failed to load registration status. Please try again later.",
        );
        setRegistrationOpen(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrationSetting();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVerifyCaptcha = (token) => {
    setCaptchaToken(token);
    setSubmitError(null);
  };

  const handleCaptchaError = (err) => {
    setSubmitError("CAPTCHA verification failed. Please try again.");
    console.error("Captcha error:", err);
    setCaptchaToken(null);
    captchaRef.current?.resetCaptcha();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!captchaToken) {
      setSubmitError("Please complete the CAPTCHA verification.");
      return;
    }

    
    
    const registrationData = {
      fullName: formData.fullName,
      email: formData.email,
      captchaToken,
    };

    try {
      await register(registrationData);
      navigate(
        "/login?registrationSuccess=true&email=" +
          encodeURIComponent(formData.email),
      );
    } catch (err) {
      setSubmitError(err.message || "Registration failed. Please try again.");
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading registration availability...
      </div>
    );
  }

  if (submitError && !registrationOpen) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        Error: {submitError}
      </div>
    );
  }

  if (!registrationOpen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Registration Closed
          </h2>
          <p className="text-gray-600">
            New member registration is currently closed. Please check back later
            or contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 p-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800">
          Create Your Account
        </h2>

        {submitError && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"
            role="alert"
          >
            <p className="font-bold">Error</p>
            <p>{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g. Nguyễn Văn A"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex justify-center">
            <HCaptcha
              sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
              onVerify={handleVerifyCaptcha}
              onError={handleCaptchaError}
              onExpire={() => {
                setCaptchaToken(null);
                setSubmitError("CAPTCHA expired. Please verify again.");
              }}
              ref={captchaRef}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !captchaToken}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            Register
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
