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

/**
 * Process API response and handle decryption if needed
 * @param {Response} response - Fetch API response
 * @returns {Promise<any>} - Processed response data
 */
const processResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  const data = await response.json();
  
  
  if (data && data.encrypted === true && data.data) {
    return decrypt(data.data);
  }
  
  return data;
};

const getAuthHeaders = () => ({
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

export const getMyNotifications = async () => {
  try {
    const response = await fetch(`${API_URL}/notifications`, getAuthHeaders());
    return processResponse(response);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      ...getAuthHeaders()
    });
    return processResponse(response);
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
};

export const markAllAsRead = async () => {
  try {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      ...getAuthHeaders()
    });
    return processResponse(response);
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
};

export const getUnreadCount = async () => {
  try {
    const response = await fetch(`${API_URL}/notifications/unread/count`, getAuthHeaders());
    return processResponse(response);
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    throw new Error('Failed to fetch unread notifications count');
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      ...getAuthHeaders()
    });
    return processResponse(response);
  } catch (error) {
    console.error('Failed to delete notification:', error);
    throw new Error('Failed to delete notification');
  }
};
