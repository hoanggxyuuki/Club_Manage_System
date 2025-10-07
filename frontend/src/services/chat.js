import axios from 'axios';
import CryptoJS from 'crypto-js';

const url = import.meta.env.VITE_API_URL;
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


const api = axios.create({ baseURL: url });

api.interceptors.response.use(response => {
  
  if (response.data && response.data.encrypted === true && response.data.data) {
    
    response.data = decrypt(response.data.data);
  }
  return response;
}, error => {
  return Promise.reject(error);
});

export const getUsersList = async () => {
  try {
    const response = await api.get(`/chat/users`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching users list:', error);
    throw error;
  }
};

export const getUserChats = async () => {
  try {
    const response = await api.get(`/chat/list`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    return response.data;
  } catch (error) {
    console.error('Error fetching user chats:', error);
    throw error;
  }
};

export const getChatHistory = async (chatId) => {
  try {
    const response = await api.get(`/chat/${chatId}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    return response.data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

export const createOrGetChat = async (participantId) => {
  try {
    const response = await api.post(`/chat/create`, { participantId },
      { headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        } 
      });
    return response.data;
  } catch (error) {
    console.error('Error creating or getting chat:', error);
    throw error;
  }
};

export const sendMessage = async (chatId, content) => {
  try {
    const response = await api.post(`/chat/message`, { chatId, content },
      { headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        } 
      });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const markAsRead = async (chatId) => {
  try {
    const response = await api.post(`/chat/${chatId}/read`, {},
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    return response.data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

export const getUnreadCount = async () => {
  try {
    const response = await api.get(`/chat/unread/count`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    return response.data;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};