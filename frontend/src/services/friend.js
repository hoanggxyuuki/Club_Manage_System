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


const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const sendFriendRequest = async (friendId) => {
  try {
    const response = await api.post(
      `/friends/request`, 
      { friendId }, 
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Send friend request error:', error);
    throw error;
  }
};

export const respondToFriendRequest = async (requestId, status) => {
  try {
    const response = await api.put(
      `/friends/respond`, 
      { requestId, status }, 
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Respond to friend request error:', error);
    throw error;
  }
};

export const getFriendsList = async () => {
  try {
    const response = await api.get('/friends/list', getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Get friends list error:', error);
    throw error;
  }
};

export const getSentRequests = async () => {
  try {
    const response = await api.get('/friends/sent', getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Get sent requests error:', error);
    throw error;
  }
};

export const getPendingRequests = async () => {
  try {
    const response = await api.get('/friends/pending', getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Get pending requests error:', error);
    throw error;
  }
};

export const searchUsers = async (query, page = 1, limit = 10) => {
  try {
    const response = await api.get('/friends/search', {
      ...getAuthHeaders(),
      params: { query, page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Search users error:', error);
    throw error;
  }
};

export const deleteFriend = async (friendId) => {
  try {
    const response = await api.delete(`/friends/${friendId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Delete friend error:', error);
    throw error;
  }
};