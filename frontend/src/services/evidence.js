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
  
  if (response.config.responseType === 'blob') {
    return response;
  }
  
  
  if (response.data && response.data.encrypted === true && response.data.data) {
    
    response.data = decrypt(response.data.data);
  }
  return response;
}, error => {
  return Promise.reject(error);
});

const submitEvidence = async (evidenceData) => {
  try {
    const formData = new FormData();
    
    if (evidenceData.file) {
      formData.append('evidence', evidenceData.file);
    }
    
    formData.append('title', evidenceData.title);
    formData.append('description', evidenceData.description);
    formData.append('type', evidenceData.type);
    
    if (evidenceData.type === 'link') {
      formData.append('link', evidenceData.link);
    }
  
    const response = await api.post(`/evidences`, formData, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting evidence:', error);
    throw error.response?.data || error.message;
  }
};
  
const updateEvidence = async (id, evidenceData) => {
  try {
    const formData = new FormData();
    
    if (evidenceData.file) {
      formData.append('evidence', evidenceData.file);
    }
    
    formData.append('title', evidenceData.title);
    formData.append('description', evidenceData.description);
    formData.append('type', evidenceData.type);
    
    if (evidenceData.type === 'link') {
      formData.append('link', evidenceData.link);
    }
  
    const response = await api.put(`/evidences/${id}`, formData, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating evidence:', error);
    throw error.response?.data || error.message;
  }
};
  
const deleteEvidence = async (id) => {
  try {
    const response = await api.delete(`/evidences/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting evidence:', error);
    throw error.response?.data || error.message;
  }
};
  
const getAllEvidences = async () => {
  try {
    const response = await api.get(`/evidences`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all evidences:', error);
    throw error.response?.data || error.message;
  }
};
  
const getMyEvidences = async () => {
  try {
    const response = await api.get(`/evidences/my-evidences`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my evidences:', error);
    throw error.response?.data || error.message;
  }
};
  
const reviewEvidence = async (id, reviewData) => {
  try {
    const response = await api.put(
      `/evidences/${id}/review`, 
      reviewData,
      {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error reviewing evidence:', error);
    throw error.response?.data || error.message;
  }
};

const exportEvidences = async () => {
  try {
    const response = await api({
      url: `/evidences/export`,
      method: 'GET',
      responseType: 'blob',  
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'evidences.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Error exporting evidences:', error);
    throw error.response?.data || error.message;
  }
};

export const evidenceService = {
  submitEvidence,
  updateEvidence,
  deleteEvidence,
  getAllEvidences,
  getMyEvidences,
  reviewEvidence,
  exportEvidences
};