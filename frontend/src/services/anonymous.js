import CryptoJS from 'crypto-js';

const API_URL = import.meta.env.VITE_API_URL;
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default32byteslongkeythisisexample';

/**
 * Decrypts data received from the server
 * @param {string} encryptedData - Encrypted data string in format "iv:encryptedContent"
 * @returns {Object|string} - Decrypted data
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
    throw new Error(error.message);
  }
  
  const data = await response.json();
  
  
  if (data && data.encrypted === true && data.data) {
    return decrypt(data.data);
  }
  
  return data;
};

export const sendAnonymousEmail = async (formData) => {
  const response = await fetch(`${API_URL}/anonymous/send-mail`, {
    method: 'POST',
    body: formData, 
  });
  return processResponse(response);
};

export const getAnonymousEmails = async () => {
  const response = await fetch(`${API_URL}/anonymous/get-mail`, {
    method: 'GET',
    headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
  });
  return processResponse(response);
};

export const deleteAnonymousEmail = async (id) => {
  const response = await fetch(`${API_URL}/anonymous/delete-mail/${id}`, {
    method: 'DELETE',
    headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
  });
  return processResponse(response);
};


export const getBlockedIps = async () => {
  const response = await fetch(`${API_URL}/anonymous/blocked-ips`, {
    method: 'GET',
    headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
  });
  return processResponse(response);
};

export const blockIp = async (ipData) => {
  const response = await fetch(`${API_URL}/anonymous/block-ip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(ipData)
  });
  return processResponse(response);
};

export const unblockIp = async (id) => {
  const response = await fetch(`${API_URL}/anonymous/unblock-ip/${id}`, {
    method: 'DELETE',
    headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
  });
  return processResponse(response);
};