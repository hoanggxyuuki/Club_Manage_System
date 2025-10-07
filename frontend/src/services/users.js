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


const api = axios.create({ baseURL: API_URL });

api.interceptors.response.use(response => {
  
  if (response.data && response.data.encrypted === true && response.data.data) {
    
    response.data = decrypt(response.data.data);
  }
  return response;
}, error => {
  return Promise.reject(error);
});

const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

const getAllUsers = async () => {
  try {
    const response = await api.get(`/users`, {
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

const searchUsers = async (query) => {
  try {
    const response = await api.get(`/users/search`, {
      params: { query },
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

const getTodayBirthdays = async () => {
  try {
    const response = await api.get(`/users/birthdays/today`, {
      headers: getHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching today\'s birthdays:', error);
    throw error;
  }
};

const addGroupMember = async (groupId, userId) => {
  try {
    const response = await api.post(
      `/groups/${groupId}/members`,
      { userId },
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding group member:', error);
    throw error;
  }
};

const removeGroupMember = async (groupId, userId) => {
  try {
    const response = await api.delete(
      `/groups/${groupId}/members/${userId}`,
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error removing group member:', error);
    throw error;
  }
};

const updateMemberRole = async (groupId, userId, role) => {
  try {
    const response = await api.put(
      `/groups/${groupId}/members/${userId}/role`,
      { role },
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
};

export {
  getAllUsers,
  searchUsers,
  getTodayBirthdays,
  addGroupMember,
  removeGroupMember,
  updateMemberRole
};