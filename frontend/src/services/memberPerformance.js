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

const getHeaders = () => ({
    headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    }
});

export const getAllPerformances = async (year, month) => {
    try {
        const params = new URLSearchParams();
        if (year) params.append('year', year);
        if (month) params.append('month', month);
        
        const response = await api.get(`/performances${params.toString() ? `?${params.toString()}` : ''}`, getHeaders());
        return response.data || [];
    } catch (error) {
        console.error('Get performances error:', error);
        throw error.response?.data || error.message;
    }
};

export const getMemberPerformance = async (memberId, year, month) => {
    try {
        const params = new URLSearchParams();
        if (year) params.append('year', year);
        if (month) params.append('month', month);
        
        const response = await api.get(`/performances/member/${memberId}${params.toString() ? `?${params.toString()}` : ''}`, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Get member performance error:', error);
        throw error.response?.data || error.message;
    }
};

export const getMemberMonthlyPerformance = async (memberId) => {
    try {
        const response = await api.get(`/performances/${memberId}/monthly`, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Get member monthly performance error:', error);
        throw error.response?.data || error.message;
    }
};

export const createPerformance = async (performanceData) => {
    try {
        const response = await api.post(`/performances`, performanceData, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Create performance error:', error);
        throw error.response?.data || error.message;
    }
};

export const updatePerformance = async (id, performanceData) => {
    try {
        const response = await api.put(`/performances/${id}`, performanceData, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Update performance error:', error);
        throw error.response?.data || error.message;
    }
};

export const deletePerformance = async (id) => {
    try {
        const response = await api.delete(`/performances/${id}`, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Delete performance error:', error);
        throw error.response?.data || error.message;
    }
};

export const getPerformanceStats = async (period = 'month') => {
    try {
        const response = await api.get(`/performances/stats/${period}`, getHeaders());
        return response.data;
    } catch (error) {
        console.error('Get performance stats error:', error);
        throw error.response?.data || error.message;
    }
};