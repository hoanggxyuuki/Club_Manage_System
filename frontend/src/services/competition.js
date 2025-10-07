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

const getAuthHeaders = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

export const createCompetition = async (competitionData) => {
    try {
        const response = await api.post(`/competitions`, competitionData, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getAllCompetitions = async (filters = {}) => {
    try {
        const response = await api.get(`/competitions`, {
            ...getAuthHeaders(),
            params: filters
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getCompetitionById = async (id) => {
    try {
        const response = await api.get(`/competitions/${id}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const joinCompetition = async (id) => {
    try {
        const response = await api.post(`/competitions/${id}/join`, null, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateScore = async (competitionId, memberId, score) => {
    try {
        const response = await api.put(
            `/competitions/${competitionId}/score/${memberId}`, 
            { score }, 
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const endCompetition = async (id) => {
    try {
        
        const response = await api.post(`/competitions/${id}/end`, null, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateCompetition = async (id, updateData) => {
    try {
        const response = await api.put(`/competitions/${id}`, updateData, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteCompetition = async (id) => {
    try {
        const response = await api.delete(`/competitions/${id}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};