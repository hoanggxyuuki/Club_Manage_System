import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_URL = import.meta.env.VITE_API_URL;
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default32byteslongkeythisisexample';

/**
 * Decrypt data received from the server
 * @param {string} encryptedData - Data in format "iv:encryptedContent"
 * @returns {Object|string} Decrypted data
 */
const decrypt = (encryptedData) => {
  try {
    const textParts = encryptedData.split(':');
    const iv = CryptoJS.enc.Hex.parse(textParts[0]);
    const encryptedContent = CryptoJS.enc.Hex.parse(textParts[1]);
    
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encryptedContent },
      CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY),
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );
    
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    try {
      return JSON.parse(decryptedString);
    } catch (e) {
      return decryptedString;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};


const api = axios.create({ 
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(response => {
  
  if (response.data && response.data.encrypted === true && response.data.data) {
    
    response.data = decrypt(response.data.data);
  }
  return response;
}, error => {
  
  if (error.response && error.response.data && error.response.data.encrypted === true && error.response.data.data) {
    error.response.data = decrypt(error.response.data.data);
  }
  return Promise.reject(error);
});

export const login = async (credentials) => {
  if (credentials.googleToken) {
    return handleGoogleCallback(credentials.googleToken);
  }
  if (credentials.microsoftToken) {
    return handleMicrosoftCallback(credentials.microsoftToken);
  }
  try {
    const response = await api.post(`/auth/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role.role);
    }
    return response.data;
  } catch (error) {
    console.error(error);
    
    if (error.response) {
      throw new Error(error.response.data.message || "Có lỗi xảy ra khi đăng nhập.");
    }
    
    throw new Error("Không thể kết nối đến server, vui lòng thử lại.");
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post(`/auth/register`, userData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Có lỗi xảy ra khi đăng ký.");
    }
    throw new Error("Không thể kết nối đến server, vui lòng thử lại.");
  }
};

export const forgotPasswor = async (data) => {
    try {
      const { email, captchaToken } = data;
   
      
      const response = await api.post(`/auth/forgot-password`, { 
        email: email, 
        captchaToken: captchaToken 
      });
      
      return response.data;
    } catch (error) {
      console.error('Forgot password error details:', error.response?.data);
      
      if (error.response) {
        throw new Error(error.response.data.message || "Có lỗi xảy ra khi yêu cầu đặt lại mật khẩu.");
      }
      
      throw new Error("Không thể kết nối đến server, vui lòng thử lại.");
    }
  };
export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Có lỗi xảy ra khi đặt lại mật khẩu.");
    }
    throw new Error("Không thể kết nối đến server, vui lòng thử lại.");
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const getRole = () => {
  return localStorage.getItem('role');
};

export const initiateGoogleLogin = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  if (!API_URL) {
    console.error('API_URL is undefined. Please check your environment variables.');
    return;
  }
  const loginUrl = `${API_URL}/auth/google`;
  console.log('Initiating Google login with URL:', loginUrl);
  window.location.href = loginUrl;
};

export const initiateMicrosoftLogin = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  if (!API_URL) {
    console.error('API_URL is undefined. Please check your environment variables.');
    return;
  }
  const loginUrl = `${API_URL}/auth/microsoft`;
  console.log('Initiating Microsoft login with URL:', loginUrl);
  window.location.href = loginUrl;
};

export const handleGoogleCallback = async (token) => {
  if (token) {
    localStorage.setItem('token', token);
    const [, payload] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    localStorage.setItem('role', decodedPayload.role);
    return { token, role: { role: decodedPayload.role } };
  }
  throw new Error('Google authentication failed');
};

export const handleMicrosoftCallback = async (token) => {
  if (token) {
    localStorage.setItem('token', token);
    const [, payload] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    localStorage.setItem('role', decodedPayload.role);
    return { token, role: { role: decodedPayload.role } };
  }
  throw new Error('Microsoft authentication failed');
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
};