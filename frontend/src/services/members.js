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

export const getAllMembers = async (filters = {}) => {
    try {
        
        const queryParams = new URLSearchParams();
        if (filters.approvalStatus) {
            queryParams.append('approvalStatus', filters.approvalStatus);
        }
        if (filters.role) {
            queryParams.append('role', filters.role);
        }

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        
        const response = await api.get(`/users${queryString}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateMemberSecondaryRole = async (userId, secondaryRole) => {
    try {
        const response = await api.put(
            `/users/${userId}/secondary-role`,
            { secondaryRole },
            {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getMemberById = async (userId) => {
    try {
        const response = await api.get(
            `/users/${userId}`,
            {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateMember = async (userId, memberData) => {
    try {
        const response = await api.put(
            `/users/${userId}`,
            memberData,
            {
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteMember = async (userId) => {
    try {
        const response = await api.delete(
            `/users/${userId}`,
            {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const scheduleInterview = async (userId, interviewData) => {
    try {
        const response = await api.post(
            `/users/${userId}/schedule-interview`,
            interviewData,
            {
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const approveUser = async (userId) => {
    try {
        const response = await api.put(
            `/users/approve-user/${userId}`,
            {},
            {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const rejectUser = async (userId) => {
    try {
        const response = await api.delete(
            `/users/reject-user/${userId}`,
            {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};