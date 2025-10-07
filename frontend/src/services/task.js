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
    const errorData = await response.json();
    throw new Error(errorData.message || 'API request failed');
  }
  
  const data = await response.json();
  
  
  if (data && data.encrypted === true && data.data) {
    return decrypt(data.data);
  }
  
  return data;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const createTask = async (taskData) => {
  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    });
    return processResponse(response);
  } catch (error) {
    console.error('Failed to create task:', error);
    throw error;
  }
};

export const updateTaskProgress = async (taskId, progressData) => {
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}/progress`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(progressData)
    });
    return processResponse(response);
  } catch (error) {
    console.error('Failed to update task progress:', error);
    throw error;
  }
};

export const getGroupTasks = async (groupId) => {
  try {
    const response = await fetch(`${API_URL}/tasks/group/${groupId}`, {
      headers: getAuthHeaders()
    });
    return processResponse(response);
  } catch (error) {
    console.error('Failed to fetch group tasks:', error);
    throw error;
  }
};

export const getTasks = async () => {
  try {
    const response = await fetch(`${API_URL}/tasks`, {
      headers: getAuthHeaders()
    });
    return processResponse(response);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};

export const updateTask = async (taskId, updateData) => {
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
    return processResponse(response);
  } catch (error) {
    console.error('Failed to update task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return processResponse(response);
  } catch (error) {
    console.error('Failed to delete task:', error);
    throw error;
  }
};

export const confirmTask = async (taskId) => {
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return processResponse(response);
  } catch (error) {
    console.error('Failed to confirm task completion:', error);
    throw error;
  }
};