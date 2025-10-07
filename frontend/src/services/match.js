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
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const getPotentialMatches = async () => {
    try {
        const response = await api.get('/match/potential', getAuthHeaders());
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy gợi ý kết nối');
    }
};

export const getMatches = async () => {
    try {
        const response = await api.get('/match', getAuthHeaders());
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách kết nối');
    }
};

export const createMatch = async (user2Id) => {
    try {
        const response = await api.post('/match', { user2Id }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lỗi khi tạo kết nối');
    }
};

export const respondToMatch = async (matchId, accepted) => {
    try {
        const response = await api.post(`/match/${matchId}/respond`, { accepted }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Lỗi khi phản hồi lời mời kết nối');
    }
};