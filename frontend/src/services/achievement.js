import axios from 'axios';
import CryptoJS from 'crypto-js';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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

const api = axios.create({ baseURL: baseUrl });

api.interceptors.response.use(response => {
  if (response.data && response.data.encrypted === true && response.data.data) {
    response.data = decrypt(response.data.data);
  }
  return response;
}, error => {
  return Promise.reject(error);
});

const headers = {
  headers: { 
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
};

export const getAllAchievements = async () => {
  try {
    const response = await api.get(`/achievements`, headers);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getMemberAchievements = async (memberId) => {
  try {
    const response = await api.get(`/achievements/member/${memberId}`, headers);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createAchievement = async (achievementData) => {
  try {
    const response = await api.post(`/achievements`, achievementData, headers);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const evaluateAndAward = async (memberId) => {
  try {
    const response = await api.post(
      `/achievements/evaluate/${memberId}`,
      {},
      headers
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const awardAchievement = async (achievementId, memberId) => {
  try {
    const response = await api.post(
      `/achievements/${achievementId}/award/${memberId}`,
      {},
      headers
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateAchievement = async (id, updateData) => {
  try {
    const response = await api.put(`/achievements/${id}`, updateData, headers);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteAchievement = async (id) => {
  try {
    const response = await api.delete(`/achievements/${id}`, headers);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};