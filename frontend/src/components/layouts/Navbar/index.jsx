import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { FiLogOut, FiUser, FiHome, FiSettings } from "react-icons/fi";
import NotificationList from "../../common/NotificationList";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import CryptoJS from "crypto-js";

const PROXY_URL = import.meta.env.VITE_PROXY_API_URL || "http://localhost";
const API_URL = import.meta.env.VITE_API_URL;
const ENCRYPTION_KEY =
  import.meta.env.VITE_ENCRYPTION_KEY || "default32byteslongkeythisisexample";

/**
 * Decrypt data received from the server
 * @param {string} encryptedData - Data in format "iv:encryptedContent"
 * @returns {Object|string} Decrypted data
 */
const decrypt = (encryptedData) => {
  try {
    const textParts = encryptedData.split(":");
    const iv = CryptoJS.enc.Hex.parse(textParts[0]);
    const encryptedContent = CryptoJS.enc.Hex.parse(textParts[1]);

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encryptedContent },
      CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY),
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 },
    );

    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

    try {
      return JSON.parse(decryptedString);
    } catch (e) {
      return decryptedString;
    }
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};


const api = axios.create({ baseURL: API_URL });

api.interceptors.response.use(
  (response) => {
    
    if (
      response.data &&
      response.data.encrypted === true &&
      response.data.data
    ) {
      
      response.data = decrypt(response.data.data);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);


const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

/**
 * Helper to correctly format avatar URLs
 * @param {string} avatarPath - The avatar path from API
 * @returns {string} - Properly formatted URL
 */
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;

  
  if (avatarPath.startsWith("http")) {
    return avatarPath;
  }

  
  const path = avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;
  const baseUrl = PROXY_URL.endsWith("/") ? PROXY_URL.slice(0, -1) : PROXY_URL;

  return `${baseUrl}${path}`;
};

const Navbar = () => {
  const { user, logout, userData: encryptedUserData, getUser } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  
  useEffect(() => {
    if (encryptedUserData) {
      if (encryptedUserData.encrypted === true && encryptedUserData.data) {
        
        const decryptedData = decrypt(encryptedUserData.data);
        setUserData(decryptedData);
      } else {
        
        setUserData(encryptedUserData);
      }
    }
  }, [encryptedUserData]);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const goToProfile = () => {
    navigate("/member/profile");
    setShowDropdown(false);
  };

  const goToSettings = () => {
    navigate("/member/settings");
    setShowDropdown(false);
  };

  const goToDashboard = () => {
    navigate("/member/dashboard");
    setShowDropdown(false);
  };

  useEffect(() => {
    getUser();
  }, [getUser]);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <div className="md:hidden flex items-center ml-4">
              {/* <button 
                         onClick={() => setIsMenuOpen(!isMenuOpen)}
                         className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                        >
                         <span className="sr-only">Open main menu</span>
                         {isMenuOpen ? (
                           <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                           </svg>
                         ) : (
                           <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                           </svg>
                         )}
                        </button> */}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <NotificationList />

            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-1 sm:space-x-2 cursor-pointer hover:bg-gray-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-colors"
                aria-expanded={showDropdown}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-600 flex items-center justify-center text-white overflow-hidden shadow-sm">
                  {userData?.avatar ? (
                    <img
                      src={getAvatarUrl(userData.avatar)}
                      alt={userData?.fullName?.charAt(0) || "User"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23ffffff"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
                      }}
                    />
                  ) : (
                    <UserCircleIcon className="w-7 h-7 sm:w-8 sm:h-8 text-gray-200" />
                  )}
                </div>
                <span className="hidden sm:inline text-gray-700 font-medium capitalize hover:text-primary-600">
                  {userData?.fullName || "Người dùng"}
                </span>
                <span className="ml-1">
                  <svg
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showDropdown ? "transform rotate-180" : ""}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>

              {showDropdown && (
                <div
                  className="absolute right-0 mt-1 sm:mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden transition-all duration-200 ease-out"
                  style={{
                    maxHeight: "90vh",
                    animation: "dropdownFadeIn 0.2s ease-out",
                  }}
                >
                  <div className="px-4 py-3 border-b">
                    <p className="text-xs text-gray-500">
                      Đăng nhập với tư cách
                    </p>
                    <p className="font-medium text-sm">
                      {userData?.fullName || "Người dùng"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {userData?.email}
                    </p>
                  </div>

                  <button
                    onClick={goToDashboard}
                    className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiHome className="text-gray-600" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={goToProfile}
                    className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiUser className="text-gray-600" />
                    <span>Hồ sơ</span>
                  </button>

                  <div className="border-t my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    <FiLogOut className="text-red-500" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
