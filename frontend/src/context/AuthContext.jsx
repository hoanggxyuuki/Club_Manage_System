import React from "react";
const { createContext, useContext, useState, useCallback, useEffect } = React;
import { jwtDecode } from "jwt-decode";
import * as authService from "../services/auth";
import * as apiService from "../services/api";
import { isTokenExpired, removeToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";

const AuthContext = createContext(null);
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

/**
 * Process API response and decrypt if necessary
 * @param {Object} data - Data from API
 * @returns {any} - Processed data
 */
const processApiResponse = (data) => {
  if (data && data.encrypted === true && data.data) {
    return decrypt(data.data);
  }
  return data;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (token && !isTokenExpired()) {
      try {
        const decoded = jwtDecode(token);
        return decoded;
      } catch {
        removeToken();
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  
  useEffect(() => {
    if (user) {
      const checkInterval = setInterval(() => {
        if (isTokenExpired()) {
          logout();
          navigate("/login");
        }
      }, 60000); 
      return () => clearInterval(checkInterval);
    }
  }, [user, navigate]);

  const checkTokenExpiration = useCallback(() => {
    if (isTokenExpired()) {
      logout();
      navigate("/login");
      return true;
    }
    return false;
  }, [navigate]);

  const updateUserData = useCallback(async () => {
    if (!checkTokenExpiration()) {
      await getUser();
    }
  }, [checkTokenExpiration]);

  const getUser = useCallback(async () => {
    if (checkTokenExpiration()) return;

    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token);
    const id = decoded.userId;

    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const rawData = await response.json();

      
      const processedData = processApiResponse(rawData);

      setUserData(processedData);
      return processedData;
    } catch (error) {
      console.error("Get user error:", error);
      if (error.response?.status === 401) {
        logout();
        navigate("/login");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [checkTokenExpiration, navigate]);

  const login = useCallback(async (credentials) => {
    try {
      const response = await authService.login(credentials);

      
      const processedResponse = processApiResponse(response);

      const { token } = processedResponse;
      if (token) {
        localStorage.setItem("token", token);
        const decoded = jwtDecode(token);
        if (!isTokenExpired()) {
          setUser(decoded);
          return decoded;
        } else {
          throw new Error("Token expired");
        }
      }
      throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const response = await authService.register(userData);

      
      return processApiResponse(response);
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const response = await authService.forgotPassword(email);

      
      return processApiResponse(response);
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      const response = await authService.resetPassword(token, newPassword);

      
      return processApiResponse(response);
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }, []);

  const updateProfile = useCallback(
    async (profileData) => {
      if (checkTokenExpiration()) return;

      try {
        setLoading(true);
        const response = await apiService.updateProfile(profileData);

        
        const processedResponse = processApiResponse(response);

        
        await getUser();
        return processedResponse;
      } catch (error) {
        console.error("Update profile error:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [checkTokenExpiration, getUser],
  );

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setUserData(null);
    setLoading(false);
    navigate("/login");
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword,
        getUser,
        userData,
        loading,
        updateUserData,
        updateProfile,
        checkTokenExpiration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
