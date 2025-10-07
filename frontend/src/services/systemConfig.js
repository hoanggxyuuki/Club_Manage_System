import { jwtDecode } from 'jwt-decode';
import CryptoJS from 'crypto-js'; 

const API_URL = import.meta.env.VITE_API_URL;
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default32byteslongkeythisisexample'; 

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

const getToken = () => localStorage.getItem('token');

const isTokenExpired = () => {
    const token = getToken();
    if (!token) return true;
    try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decodedToken.exp < currentTime;
    } catch (error) {
        console.error('Error decoding token:', error);
        return true;
    }
};

const getAuthHeaders = (includeContentType = true) => {
    const token = getToken();
    if (!token || isTokenExpired()) {
        throw new ApiError('Token expired or not available', 401);
    }

    const headers = {
        'Authorization': `Bearer ${token}`
    };
    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};


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
    console.error('Decryption error in systemConfig.js:', error);
    
    
    return null; 
  }
};

const processResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json(); 
    } catch (e) {
      
      errorData = { message: response.statusText };
    }
    throw new ApiError(errorData.message || `API Error: ${response.status}`, response.status);
  }

  
  if (response.status === 204) {
    return null;
  }

  const data = await response.json(); 

  
  if (data && data.encrypted === true && data.data) {
    const decryptedData = decrypt(data.data);
    if (decryptedData === null) {
        
        throw new ApiError('Failed to decrypt server response.', 500);
    }
    return decryptedData;
  }
  
  return data; 
};

const handleApiError = (error) => {
    if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
    throw error;
};



export const getSystemConfig = async () => {
    try {
        const response = await fetch(`${API_URL}/system-config`, {
            headers: getAuthHeaders()
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

















export const updateSystemConfigById = async (id, data) => {
    try {
        
        
        const payload = { settingValue: data.settingValue };
        if (data.description !== undefined) {
            payload.description = data.description;
        }
        
        
        
        

        const response = await fetch(`${API_URL}/system-config/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};




export const getRegistrationStatus = async () => {
    try {
        
        const response = await fetch(`${API_URL}/system-config/registration-status`, {
            
        });
        return processResponse(response);
    } catch (error) {
        
        
        
        if (error instanceof ApiError && error.status === 401) {
            
            
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        throw error; 
    }
};

export const updateRegistrationStatus = async (statusData) => {
    try {
        const response = await fetch(`${API_URL}/system-config/registration-status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(statusData)
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};



export const getSystemMessages = async () => {
    try {
        const response = await fetch(`${API_URL}/system-config/messages`, {
            headers: getAuthHeaders()
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const addSystemMessage = async (messageData) => {
    try {
        const response = await fetch(`${API_URL}/system-config/messages`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(messageData)
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const updateSystemMessage = async (messageId, messageData) => {
    try {
        const response = await fetch(`${API_URL}/system-config/messages/${messageId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(messageData)
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const deleteSystemMessage = async (messageId) => {
    try {
        const response = await fetch(`${API_URL}/system-config/messages/${messageId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(false) 
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};