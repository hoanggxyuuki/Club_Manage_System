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


const getAuthHeaders = () => ({
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

export const createSchedule = async (scheduleData) => {
  try {
    const response = await api.post(`/schedules`, scheduleData, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getGroupSchedules = async (groupId) => {
  try {
    const response = await api.get(`/schedules/group/${groupId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateSchedule = async (scheduleId, updateData) => {
  try {
    const response = await api.put(`/schedules/${scheduleId}`, updateData, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteSchedule = async (scheduleId) => {
  try {
    const response = await api.delete(`/schedules/${scheduleId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const joinSchedule = async (scheduleId) => {
  try {
    const response = await api.post(`/schedules/${scheduleId}/join`, {}, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateAttendeeStatus = async (scheduleId, userId, data) => {
  try {
    const response = await api.put(`/schedules/${scheduleId}/attendees/${userId}`, data, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAttendanceStats = async (scheduleId) => {
  try {
    const response = await api.get(`/schedules/${scheduleId}/attendance`, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};