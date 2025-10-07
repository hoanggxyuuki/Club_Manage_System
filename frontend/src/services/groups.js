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

const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

/**
 * Utility function to fetch and handle encrypted responses
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Decrypted response data
 */
const fetchWithDecryption = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    
    if (data && data.encrypted === true && data.data) {
      return decrypt(data.data);
    }
    
    return data;
  } catch (error) {
    console.error('Error in API request:', error);
    throw error;
  }
};

export const getMyGroups = async () => {
  return fetchWithDecryption(`${API_URL}/groups/my-groups`, {
    headers: getHeaders()
  });
};

export const getGroupById = async (groupId) => {
  return fetchWithDecryption(`${API_URL}/groups/${groupId}`, {
    headers: getHeaders()
  });
};

export const createGroup = async (groupData) => {
  return fetchWithDecryption(`${API_URL}/groups`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(groupData)
  });
};

export const updateGroup = async (groupId, groupData) => {
  return fetchWithDecryption(`${API_URL}/groups/${groupId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(groupData)
  });
};

export const addMemberToGroup = async (groupId, userId) => {
  return fetchWithDecryption(`${API_URL}/groups/${groupId}/members`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ userId })
  });
};

export const removeMemberFromGroup = async (groupId, userId) => {
  return fetchWithDecryption(`${API_URL}/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
};

export const updateMemberRole = async (groupId, userId, role) => {
  return fetchWithDecryption(`${API_URL}/groups/${groupId}/members/${userId}/role`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ role })
  });
};

export const searchUsers = async (query) => {
  return fetchWithDecryption(`${API_URL}/groups/search-users?q=${encodeURIComponent(query)}`, {
    headers: getHeaders()
  });
};

export const deleteGroup = async (groupId) => {
  return fetchWithDecryption(`${API_URL}/groups/${groupId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
};